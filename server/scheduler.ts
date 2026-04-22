import { getDb } from "./db";
import { picks, users } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq, and, gte, lte } from "drizzle-orm";

const DAILY_MATCHUPS = [
  { sportKey: "nfl", homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", pickType: "spread" as const },
  { sportKey: "nba", homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors", pickType: "over_under" as const },
  { sportKey: "mlb", homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants", pickType: "moneyline" as const },
  { sportKey: "nhl", homeTeam: "Colorado Avalanche", awayTeam: "Minnesota Wild", pickType: "spread" as const },
  { sportKey: "nba", homeTeam: "Denver Nuggets", awayTeam: "Phoenix Suns", pickType: "player_prop" as const },
];

async function generatePickForMatchup(matchup: typeof DAILY_MATCHUPS[0], date: string) {
  try {
    const prompt = `You are an expert sports betting analyst. Generate a betting pick for this matchup:
Sport: ${matchup.sportKey.toUpperCase()}
Home Team: ${matchup.homeTeam}
Away Team: ${matchup.awayTeam}
Bet Type: ${matchup.pickType}
Date: ${date}

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
}

export function startScheduler() {
  // Run immediately on startup
  setTimeout(() => {
    runDailyPicksJob().catch(console.error);
  }, 5000); // 5 second delay to let server fully start

  // Then run every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runDailyPicksJob().catch(console.error);
  }, TWENTY_FOUR_HOURS);

  console.log("[Scheduler] Daily picks scheduler started");
}
