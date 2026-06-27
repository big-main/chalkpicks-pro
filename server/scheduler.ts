import { getDb } from "./db";
import { picks, users, subscriptionOrders } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendDailyPicksToAllUsers, sendDailyDigestToAllUsers } from "./notificationService";

const DAILY_MATCHUPS = [
  { sportKey: "nfl", homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", pickType: "spread" as const },
  { sportKey: "nba", homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors", pickType: "over_under" as const },
  { sportKey: "mlb", homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants", pickType: "moneyline" as const },
  { sportKey: "nhl", homeTeam: "Colorado Avalanche", awayTeam: "Minnesota Wild", pickType: "spread" as const },
  { sportKey: "nba", homeTeam: "Denver Nuggets", awayTeam: "Phoenix Suns", pickType: "player_prop" as const },
];

async function getWeatherContext(sportKey: string, homeTeam: string): Promise<string> {
  // Only relevant for outdoor sports
  if (!['nfl', 'mlb', 'ncaaf'].includes(sportKey)) return '';
  
  // Map teams to approximate cities for weather context
  const TEAM_CITIES: Record<string, string> = {
    'Kansas City Chiefs': 'Kansas City, MO',
    'Las Vegas Raiders': 'Las Vegas, NV',
    'Los Angeles Dodgers': 'Los Angeles, CA',
    'San Francisco Giants': 'San Francisco, CA',
    'Chicago Bears': 'Chicago, IL',
    'Green Bay Packers': 'Green Bay, WI',
    'New England Patriots': 'Boston, MA',
    'Buffalo Bills': 'Buffalo, NY',
    'Denver Broncos': 'Denver, CO',
    'Seattle Seahawks': 'Seattle, WA',
    'Miami Dolphins': 'Miami, FL',
    'Dallas Cowboys': 'Dallas, TX',
    'New York Giants': 'New York, NY',
    'Philadelphia Eagles': 'Philadelphia, PA',
    'Pittsburgh Steelers': 'Pittsburgh, PA',
    'Baltimore Ravens': 'Baltimore, MD',
  };
  
  const city = TEAM_CITIES[homeTeam];
  if (!city) return '';
  
  try {
    // Use Open-Meteo free API (no key required)
    const [lat, lon] = await getCityCoords(city);
    if (!lat || !lon) return '';
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return '';
    const data = await res.json() as any;
    const c = data.current;
    const temp = Math.round(c.temperature_2m);
    const wind = Math.round(c.wind_speed_10m);
    const precip = c.precipitation;
    const code = c.weather_code;
    const condition = code >= 80 ? 'rainy/stormy' : code >= 51 ? 'drizzle' : code >= 3 ? 'cloudy' : 'clear';
    return `Weather at ${city}: ${temp}°F, ${wind} mph wind, ${precip}mm precip, ${condition} conditions.`;
  } catch {
    return '';
  }
}

async function getCityCoords(city: string): Promise<[number, number]> {
  const COORDS: Record<string, [number, number]> = {
    'Kansas City, MO': [39.0997, -94.5786],
    'Las Vegas, NV': [36.1699, -115.1398],
    'Los Angeles, CA': [34.0522, -118.2437],
    'San Francisco, CA': [37.7749, -122.4194],
    'Chicago, IL': [41.8781, -87.6298],
    'Green Bay, WI': [44.5133, -88.0133],
    'Boston, MA': [42.3601, -71.0589],
    'Buffalo, NY': [42.8864, -78.8784],
    'Denver, CO': [39.7392, -104.9903],
    'Seattle, WA': [47.6062, -122.3321],
    'Miami, FL': [25.7617, -80.1918],
    'Dallas, TX': [32.7767, -96.7970],
    'New York, NY': [40.7128, -74.0060],
    'Philadelphia, PA': [39.9526, -75.1652],
    'Pittsburgh, PA': [40.4406, -79.9959],
    'Baltimore, MD': [39.2904, -76.6122],
  };
  return COORDS[city] ?? [0, 0];
}

async function generatePickForMatchup(matchup: typeof DAILY_MATCHUPS[0], date: string) {
  try {
    const weatherContext = await getWeatherContext(matchup.sportKey, matchup.homeTeam);
    const weatherSection = weatherContext ? `\nWeather Conditions: ${weatherContext}\nConsider weather impact on totals, passing game, and scoring.` : '';
    const prompt = `You are an expert sports betting analyst. Generate a betting pick for this matchup:
Sport: ${matchup.sportKey.toUpperCase()}
Home Team: ${matchup.homeTeam}
Away Team: ${matchup.awayTeam}
Bet Type: ${matchup.pickType}
Date: ${date}${weatherSection}

Respond with JSON only:
{
  "recommendation": "specific bet recommendation e.g. Chiefs -7.5",
  "odds": -110,
  "confidenceScore": 78,
  "edgeScore": 4.2,
  "aiAnalysis": "2-3 sentence analysis explaining the pick",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "tier": "free"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a professional sports betting analyst. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pick_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendation: { type: "string" },
              odds: { type: "number" },
              confidenceScore: { type: "number" },
              edgeScore: { type: "number" },
              aiAnalysis: { type: "string" },
              keyFactors: { type: "array", items: { type: "string" } },
              tier: { type: "string" },
            },
            required: ["recommendation", "odds", "confidenceScore", "edgeScore", "aiAnalysis", "keyFactors", "tier"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) return null;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    const parsed = JSON.parse(content);
    return {
      ...matchup,
      pickDate: date,
      recommendation: parsed.recommendation,
      odds: parsed.odds,
      confidenceScore: Math.min(99, Math.max(50, parsed.confidenceScore)),
      edgeScore: String(Math.min(10, Math.max(1, parsed.edgeScore)).toFixed(1)),
      aiAnalysis: parsed.aiAnalysis,
      keyFactors: parsed.keyFactors,
      tier: (parsed.confidenceScore >= 80 ? "premium" : "free") as "free" | "premium",
      result: "pending" as const,
      isFeatured: parsed.confidenceScore >= 85,
      isActive: true,
    };
  } catch (err) {
    console.error(`[Scheduler] Failed to generate pick for ${matchup.homeTeam} vs ${matchup.awayTeam}:`, err);
    return null;
  }
}

export async function runDailyPicksJob() {
  const db = await getDb();
  if (!db) {
    console.warn("[Scheduler] No database available, skipping daily picks generation");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  console.log(`[Scheduler] Generating daily picks for ${today}...`);

  // Check if picks already exist for today
  const existingPicks = await db.select().from(picks)
    .where(and(
      gte(picks.pickDate, today),
      lte(picks.pickDate, today)
    ));

  if (existingPicks.length >= 3) {
    console.log(`[Scheduler] Picks already exist for ${today} (${existingPicks.length} picks), skipping`);
    return;
  }

  let generated = 0;
  for (const matchup of DAILY_MATCHUPS) {
    const pick = await generatePickForMatchup(matchup, today);
    if (pick) {
      try {
        await db.insert(picks).values({
          sportKey: pick.sportKey,
          pickDate: pick.pickDate,
          pickType: pick.pickType,
          homeTeam: pick.homeTeam,
          awayTeam: pick.awayTeam,
          recommendation: pick.recommendation,
          odds: pick.odds,
          confidenceScore: pick.confidenceScore,
          edgeScore: pick.edgeScore,
          aiAnalysis: pick.aiAnalysis,
          keyFactors: pick.keyFactors,
          tier: pick.tier,
          result: pick.result,
          isFeatured: pick.isFeatured,
          isActive: pick.isActive,
        });
        generated++;
        console.log(`[Scheduler] Generated pick: ${pick.recommendation} (${pick.confidenceScore}% confidence)`);
      } catch (err) {
        console.error(`[Scheduler] Failed to insert pick:`, err);
      }
    }
    // Small delay between LLM calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[Scheduler] Daily picks job complete: ${generated}/${DAILY_MATCHUPS.length} picks generated`);

  // Send daily picks notifications to all subscribed users
  if (generated > 0) {
    try {
      await sendDailyPicksToAllUsers();
      console.log("[Scheduler] Daily picks notifications sent to subscribed users");
    } catch (err) {
      console.error("[Scheduler] Failed to send daily picks notifications:", err);
    }
  }
}

/**
 * Schedule a function to run at a specific hour (UTC) every day.
 * Uses setInterval to check every minute if it's time to run.
 */
function scheduleDaily(hourUTC: number, fn: () => Promise<void>, label: string) {
  let lastRun: string | null = null;
  setInterval(() => {
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    if (now.getUTCHours() === hourUTC && now.getUTCMinutes() === 0 && lastRun !== dateKey) {
      lastRun = dateKey;
      fn().catch(err => console.error(`[Scheduler] ${label} failed:`, err));
    }
  }, 60 * 1000); // check every minute
  console.log(`[Scheduler] ${label} scheduled at ${hourUTC}:00 UTC daily`);
}

export function startScheduler() {
  // Run picks generation immediately on startup (5s delay)
  setTimeout(() => {
    runDailyPicksJob().catch(console.error);
  }, 5000);

  // Schedule daily picks generation at 6:00 UTC (2am EST)
  scheduleDaily(6, runDailyPicksJob, "Daily Picks Generation");

  // Schedule daily digest emails at 13:00 UTC (8am EST)
  scheduleDaily(13, sendDailyDigestToAllUsers, "Daily Digest Emails");

  console.log("[Scheduler] All scheduled jobs started");
}
