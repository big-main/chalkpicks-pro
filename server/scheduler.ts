import { getDb } from "./db";
import { picks, users, subscriptionOrders, pickFeedback } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { sendDailyPicksToAllUsers, sendDailyDigestToAllUsers } from "./notificationService";
import { resolveGameResults, syncGameScores } from "./services/gameResultsResolver";
import { fetchOdds, type OddsEvent } from "./services/dataService";
import { sendHighConfidencePickAlert } from "./services/pushNotifications";

type PickType = "moneyline" | "spread" | "over_under" | "player_prop";
type SlateMatchup = { sportKey: string; homeTeam: string; awayTeam: string; pickType: PickType };
type SlateEntry = { matchup: SlateMatchup; event?: OddsEvent };

// Dev-only fallback when ODDS_API_KEY is not configured. NEVER used in
// production — publishing picks for games that aren't actually being played
// destroys subscriber trust faster than anything else.
const DEV_FALLBACK_MATCHUPS: SlateMatchup[] = [
  { sportKey: "nfl", homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", pickType: "spread" },
  { sportKey: "nba", homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors", pickType: "over_under" },
  { sportKey: "mlb", homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants", pickType: "moneyline" },
];

const SLATE_SPORTS = ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "mma", "soccer"];
const SLATE_MAX_PICKS = 6;
const SLATE_WINDOW_HOURS = 36;
// Real Odds API event ids are 32-char hex; the offline mock generator emits
// ids like "nba_2_1720620000000". Filter mocks so a transient API failure can
// never leak fabricated games into paid picks.
const MOCK_EVENT_ID = /^[a-z]+_\d+_\d{10,}$/;

/**
 * Build today's slate from REAL upcoming games across every in-season sport.
 * Only events with live bookmaker odds commencing within the next 36 hours
 * qualify — the sports calendar decides what we pick, not a hardcoded list.
 */
async function buildDailySlate(): Promise<SlateEntry[]> {
  const now = Date.now();
  const horizon = now + SLATE_WINDOW_HOURS * 60 * 60 * 1000;
  const candidates: { sportKey: string; event: OddsEvent; commence: number }[] = [];

  for (const sportKey of SLATE_SPORTS) {
    try {
      const events = await fetchOdds(sportKey);
      for (const event of events) {
        if (!event?.homeTeam || !event?.awayTeam) continue;
        if (!event.bookmakers?.length) continue;
        if (MOCK_EVENT_ID.test(String(event.id ?? ""))) continue;
        const commence = Date.parse(event.commenceTime ?? "");
        if (!Number.isFinite(commence) || commence < now || commence > horizon) continue;
        candidates.push({ sportKey, event, commence });
      }
    } catch (err) {
      console.warn(`[Scheduler] Slate fetch failed for ${sportKey}:`, (err as Error).message);
    }
  }

  // Soonest games first; spread coverage across sports before doubling up.
  candidates.sort((a, b) => a.commence - b.commence);
  const perSportCount = new Map<string, number>();
  const seen = new Set<string>();
  const slate: SlateEntry[] = [];
  const pickTypeRotation: PickType[] = ["spread", "moneyline", "over_under"];

  for (const c of candidates) {
    if (slate.length >= SLATE_MAX_PICKS) break;
    const gameKey = `${c.event.homeTeam}|${c.event.awayTeam}`;
    if (seen.has(gameKey)) continue;
    const sportCount = perSportCount.get(c.sportKey) ?? 0;
    if (sportCount >= 2) continue; // max 2 picks per sport for a diverse card
    seen.add(gameKey);
    perSportCount.set(c.sportKey, sportCount + 1);
    slate.push({
      matchup: {
        sportKey: c.sportKey,
        homeTeam: c.event.homeTeam,
        awayTeam: c.event.awayTeam,
        pickType: pickTypeRotation[slate.length % pickTypeRotation.length],
      },
      event: c.event,
    });
  }

  return slate;
}

/** Summarize odds directly from the slate's own event — no fuzzy re-matching. */
function oddsContextFromEvent(event: OddsEvent): string {
  if (!event.bookmakers?.length) return "";
  const bookLines: string[] = [];
  for (const book of event.bookmakers.slice(0, 6)) {
    const h2h = book.markets?.find((m: any) => m.key === "h2h");
    const spreads = book.markets?.find((m: any) => m.key === "spreads");
    const totals = book.markets?.find((m: any) => m.key === "totals");
    let line = `${book.title}: `;
    if (h2h?.outcomes) line += `ML [${h2h.outcomes.map((o: any) => `${o.name} ${o.price > 0 ? "+" : ""}${o.price}`).join(", ")}]`;
    if (spreads?.outcomes) line += ` | Spread [${spreads.outcomes.map((o: any) => `${o.name} ${o.point > 0 ? "+" : ""}${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(", ")}]`;
    if (totals?.outcomes) line += ` | Total [${totals.outcomes.map((o: any) => `${o.name} ${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(", ")}]`;
    bookLines.push(line);
  }
  if (bookLines.length === 0) return "";
  return `\nReal-Time Odds from ${bookLines.length} sportsbooks:\n${bookLines.join("\n")}\nUse these real odds to identify edge and value. Compare lines across books for sharp money indicators.`;
}

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

async function getOddsContext(sportKey: string, homeTeam: string, awayTeam: string): Promise<string> {
  try {
    const odds = await fetchOdds(sportKey);
    // Find the matching event
    const event = odds.find(e =>
      (e.homeTeam?.toLowerCase().includes(homeTeam.toLowerCase().split(' ').pop() || '___') ||
       homeTeam.toLowerCase().includes(e.homeTeam?.toLowerCase().split(' ').pop() || '___'))
    );
    if (!event || !event.bookmakers?.length) return '';
    // Summarize odds from multiple sportsbooks
    const bookLines: string[] = [];
    for (const book of event.bookmakers.slice(0, 6)) {
      const h2h = book.markets?.find((m: any) => m.key === 'h2h');
      const spreads = book.markets?.find((m: any) => m.key === 'spreads');
      const totals = book.markets?.find((m: any) => m.key === 'totals');
      let line = `${book.title}: `;
      if (h2h?.outcomes) line += `ML [${h2h.outcomes.map((o: any) => `${o.name} ${o.price > 0 ? '+' : ''}${o.price}`).join(', ')}]`;
      if (spreads?.outcomes) line += ` | Spread [${spreads.outcomes.map((o: any) => `${o.name} ${o.point > 0 ? '+' : ''}${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(', ')}]`;
      if (totals?.outcomes) line += ` | Total [${totals.outcomes.map((o: any) => `${o.name} ${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(', ')}]`;
      bookLines.push(line);
    }
    if (bookLines.length === 0) return '';
    return `\nReal-Time Odds from ${bookLines.length} sportsbooks:\n${bookLines.join('\n')}\nUse these real odds to identify edge and value. Compare lines across books for sharp money indicators.`;
  } catch {
    return '';
  }
}

async function generatePickForMatchup(matchup: SlateMatchup, date: string, event?: OddsEvent) {
  try {
    const weatherContext = await getWeatherContext(matchup.sportKey, matchup.homeTeam);
    const weatherSection = weatherContext ? `\nWeather Conditions: ${weatherContext}\nConsider weather impact on totals, passing game, and scoring.` : '';
    const feedbackContext = await getFeedbackContext();
    const oddsContext = event
      ? oddsContextFromEvent(event)
      : await getOddsContext(matchup.sportKey, matchup.homeTeam, matchup.awayTeam);
    const prompt = `You are an expert sports betting analyst. Generate a betting pick for this matchup:
Sport: ${matchup.sportKey.toUpperCase()}
Home Team: ${matchup.homeTeam}
Away Team: ${matchup.awayTeam}
Bet Type: ${matchup.pickType}
Date: ${date}${weatherSection}${oddsContext}${feedbackContext}

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

  // Build the slate from real upcoming games. Without an Odds API key
  // (local dev only), fall back to the static list so the UI has data.
  let slate: SlateEntry[];
  if (process.env.ODDS_API_KEY) {
    slate = await buildDailySlate();
    if (slate.length === 0) {
      console.warn("[Scheduler] No real games with live odds in the next 36h — skipping pick generation (never fabricate picks).");
      return;
    }
    console.log(`[Scheduler] Slate built from live odds: ${slate.map(s => `${s.matchup.awayTeam} @ ${s.matchup.homeTeam} (${s.matchup.sportKey})`).join("; ")}`);
  } else {
    console.warn("[Scheduler] ODDS_API_KEY missing — using DEV fallback matchups. Do not run production this way.");
    slate = DEV_FALLBACK_MATCHUPS.map(matchup => ({ matchup }));
  }

  let generated = 0;
  for (const { matchup, event } of slate) {
    const pick = await generatePickForMatchup(matchup, today, event);
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
        // Fire Web Push alert for high-confidence picks (85%+)
        if (pick.confidenceScore >= 85) {
          sendHighConfidencePickAlert({
            id: 0, // placeholder until DB returns the inserted ID
            recommendation: pick.recommendation,
            sportKey: pick.sportKey,
            confidenceScore: pick.confidenceScore,
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
          }).catch(err => console.error("[Scheduler] Push alert failed:", err));
        }
      } catch (err) {
        console.error(`[Scheduler] Failed to insert pick:`, err);
      }
    }
    // Small delay between LLM calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[Scheduler] Daily picks job complete: ${generated}/${slate.length} picks generated`);

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

/**
 * Get feedback summary to inform AI pick generation
 */
async function getFeedbackContext(): Promise<string> {
  const db = await getDb();
  if (!db) return '';
  try {
    const recentFeedback = await db.select({
      rating: pickFeedback.rating,
      sentiment: pickFeedback.sentiment,
      comment: pickFeedback.comment,
    }).from(pickFeedback).orderBy(desc(pickFeedback.createdAt)).limit(20);
    if (recentFeedback.length === 0) return '';
    const avgRating = recentFeedback.reduce((s, f) => s + f.rating, 0) / recentFeedback.length;
    const negativeComments = recentFeedback.filter(f => f.sentiment === 'negative').map(f => f.comment).filter(Boolean).slice(0, 3);
    let context = `\nUser Feedback Context (avg rating: ${avgRating.toFixed(1)}/5):`;
    if (negativeComments.length > 0) {
      context += `\nCommon complaints: ${negativeComments.join('; ')}`;
      context += `\nAdjust picks to address these concerns.`;
    }
    if (avgRating < 3) {
      context += `\nUsers are unsatisfied. Be more conservative with confidence scores and provide more detailed analysis.`;
    }
    return context;
  } catch {
    return '';
  }
}

/**
 * Run game results resolution job
 */
async function runGameResultsJob() {
  console.log('[Scheduler] Running game results resolution...');
  await syncGameScores();
  const results = await resolveGameResults();
  console.log(`[Scheduler] Game results: ${results.resolved} resolved (${results.wins}W/${results.losses}L/${results.pushes}P)`);
}

export function startScheduler() {
  // Run picks generation immediately on startup (5s delay)
  setTimeout(() => {
    runDailyPicksJob().catch(console.error);
  }, 5000);
  // Run game results resolution on startup (10s delay)
  setTimeout(() => {
    runGameResultsJob().catch(console.error);
  }, 10000);
  // Schedule daily picks generation at 6:00 UTC (2am EST)
  scheduleDaily(6, runDailyPicksJob, "Daily Picks Generation");
  // Schedule game results resolution at 8:00 UTC and 20:00 UTC
  scheduleDaily(8, runGameResultsJob, "Game Results Resolution (Morning)");
  scheduleDaily(20, runGameResultsJob, "Game Results Resolution (Evening)");
  // Schedule daily digest emails at 13:00 UTC (8am EST)
  scheduleDaily(13, sendDailyDigestToAllUsers, "Daily Digest Emails");
  console.log("[Scheduler] All scheduled jobs started");
}
