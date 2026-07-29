import { getDb } from "./db";
import { picks } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { and, gte, lte } from "drizzle-orm";
import {
  sendDailyPicksToAllUsers,
  sendDailyDigestToAllUsers,
} from "./notificationService";
import {
  resolveGameResults,
  syncGameScores,
} from "./services/gameResultsResolver";
import { fetchOdds, type OddsEvent } from "./services/dataService";
import { sendHighConfidencePickAlert } from "./services/pushNotifications";
import { commitPickRowToLedger, extractInsertId } from "./_core/pick-ledger";
import { runClosingLineJob } from "./services/closingLineJob";

type PickType = "moneyline" | "spread" | "over_under" | "player_prop";
type SlateMatchup = {
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  pickType: PickType;
};
type SlateEntry = { matchup: SlateMatchup; event?: OddsEvent };

const DEV_FALLBACK_MATCHUPS: SlateMatchup[] = [
  {
    sportKey: "nfl",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Las Vegas Raiders",
    pickType: "spread",
  },
  {
    sportKey: "nba",
    homeTeam: "Boston Celtics",
    awayTeam: "Golden State Warriors",
    pickType: "over_under",
  },
  {
    sportKey: "mlb",
    homeTeam: "Los Angeles Dodgers",
    awayTeam: "San Francisco Giants",
    pickType: "moneyline",
  },
];

const SLATE_SPORTS = [
  "nfl",
  "nba",
  "mlb",
  "nhl",
  "ncaaf",
  "ncaab",
  "mma",
  "soccer",
];
const SLATE_MAX_PICKS = 6;
const SLATE_WINDOW_HOURS = 36;
const MOCK_EVENT_ID = /^[a-z]+_\d+_\d{10,}$/;

async function buildDailySlate(): Promise<SlateEntry[]> {
  const now = Date.now();
  const horizon = now + SLATE_WINDOW_HOURS * 60 * 60 * 1000;
  const candidates: { sportKey: string; event: OddsEvent; commence: number }[] =
    [];
  for (const sportKey of SLATE_SPORTS) {
    try {
      const events = await fetchOdds(sportKey);
      for (const event of events) {
        if (!event?.homeTeam || !event?.awayTeam) continue;
        if (!event.bookmakers?.length) continue;
        if (MOCK_EVENT_ID.test(String(event.id ?? ""))) continue;
        const commence = Date.parse(event.commenceTime ?? "");
        if (!Number.isFinite(commence) || commence < now || commence > horizon)
          continue;
        candidates.push({ sportKey, event, commence });
      }
    } catch (err) {
      console.warn(
        `[Scheduler] Slate fetch failed for ${sportKey}:`,
        (err as Error).message
      );
    }
  }
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
    if (sportCount >= 2) continue;
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

function oddsContextFromEvent(event: OddsEvent): string {
  if (!event.bookmakers?.length) return "";
  const bookLines: string[] = [];
  for (const book of event.bookmakers.slice(0, 6)) {
    const h2h = book.markets?.find((m: any) => m.key === "h2h");
    const spreads = book.markets?.find((m: any) => m.key === "spreads");
    const totals = book.markets?.find((m: any) => m.key === "totals");
    let line = `${book.title}: `;
    if (h2h?.outcomes)
      line += `ML [${h2h.outcomes.map((o: any) => `${o.name} ${o.price > 0 ? "+" : ""}${o.price}`).join(", ")}]`;
    if (spreads?.outcomes)
      line += ` | Spread [${spreads.outcomes.map((o: any) => `${o.name} ${o.point > 0 ? "+" : ""}${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(", ")}]`;
    if (totals?.outcomes)
      line += ` | Total [${totals.outcomes.map((o: any) => `${o.name} ${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(", ")}]`;
    bookLines.push(line);
  }
  if (bookLines.length === 0) return "";
  return `\nReal-Time Odds from ${bookLines.length} sportsbooks:\n${bookLines.join("\n")}`;
}

async function generatePickForMatchup(
  matchup: SlateMatchup,
  date: string,
  event?: OddsEvent
) {
  try {
    const oddsContext = event ? oddsContextFromEvent(event) : "";
    const prompt = `You are an expert sports betting analyst. Generate a betting pick for this matchup:
Sport: ${matchup.sportKey.toUpperCase()}
Home Team: ${matchup.homeTeam}
Away Team: ${matchup.awayTeam}
Bet Type: ${matchup.pickType}
Date: ${date}${oddsContext}

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
        {
          role: "system",
          content:
            "You are a professional sports betting analyst. Always respond with valid JSON only.",
        },
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
            required: [
              "recommendation",
              "odds",
              "confidenceScore",
              "edgeScore",
              "aiAnalysis",
              "keyFactors",
              "tier",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) return null;
    const content =
      typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
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
      tier: (parsed.confidenceScore >= 80 ? "premium" : "free") as
        | "free"
        | "premium",
      result: "pending" as const,
      isFeatured: parsed.confidenceScore >= 85,
      isActive: true,
      commenceTime: event?.commenceTime ?? null,
    };
  } catch (err) {
    console.error(
      `[Scheduler] Failed to generate pick for ${matchup.homeTeam} vs ${matchup.awayTeam}:`,
      err
    );
    return null;
  }
}

export async function runDailyPicksJob() {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Scheduler] No database available, skipping daily picks generation"
    );
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  console.warn(`[Scheduler] Generating daily picks for ${today}...`);

  const existingPicks = await db
    .select()
    .from(picks)
    .where(and(gte(picks.pickDate, today), lte(picks.pickDate, today)));
  if (existingPicks.length >= 3) {
    console.warn(
      `[Scheduler] Picks already exist for ${today} (${existingPicks.length} picks), skipping`
    );
    return;
  }

  const hasOddsKey = Boolean(
    process.env.ODDS_API_IO_KEY || process.env.ODDS_API_KEY
  );
  const isProd = process.env.NODE_ENV === "production";

  let slate: SlateEntry[];
  if (hasOddsKey) {
    slate = await buildDailySlate();
    if (slate.length === 0) {
      console.warn(
        "[Scheduler] No real games with live odds in the next 36h — skipping."
      );
      return;
    }
  } else if (isProd) {
    // HARD STOP: never invent matchups in production
    console.error(
      "[Scheduler] REFUSING pick generation: ODDS_API_KEY missing in production. No fabricated picks."
    );
    return;
  } else {
    console.warn(
      "[Scheduler] Odds API key missing — DEV fallback matchups only (non-production)."
    );
    slate = DEV_FALLBACK_MATCHUPS.map(matchup => ({ matchup }));
  }

  let generated = 0;
  for (const { matchup, event } of slate) {
    const pick = await generatePickForMatchup(matchup, today, event);
    if (pick) {
      try {
        const inserted = await db.insert(picks).values({
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
        const pickId = extractInsertId(inserted);
        generated++;
        console.warn(
          `[Scheduler] Generated pick: ${pick.recommendation} (${pick.confidenceScore}% confidence)`
        );

        if (pickId) {
          void commitPickRowToLedger({
            id: pickId,
            sportKey: pick.sportKey,
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            recommendation: pick.recommendation,
            pickType: pick.pickType,
            odds: pick.odds,
            confidenceScore: pick.confidenceScore,
            pickDate: (pick as any).commenceTime
              ? new Date((pick as any).commenceTime).toISOString().slice(0, 10)
              : pick.pickDate,
            tier: pick.tier,
          }).catch(e => console.warn("[Scheduler] ledger lock failed:", e));
        }

        const edgeNum = parseFloat(pick.edgeScore);
        if (pick.confidenceScore >= 85 || edgeNum >= 5) {
          sendHighConfidencePickAlert({
            id: pickId ?? 0,
            recommendation: pick.recommendation,
            sportKey: pick.sportKey,
            confidenceScore: pick.confidenceScore,
            edgeScore: pick.edgeScore,
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
          }).catch(err => console.error("[Scheduler] Push alert failed:", err));
        }
      } catch (err) {
        console.error(`[Scheduler] Failed to insert pick:`, err);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.warn(
    `[Scheduler] Daily picks job complete: ${generated}/${slate.length} picks generated`
  );
  if (generated > 0) {
    try {
      await sendDailyPicksToAllUsers();
    } catch (err) {
      console.error(
        "[Scheduler] Failed to send daily picks notifications:",
        err
      );
    }
  }
}

function scheduleDaily(
  hourUTC: number,
  fn: () => Promise<void>,
  label: string
) {
  let lastRun: string | null = null;
  setInterval(() => {
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    if (
      now.getUTCHours() === hourUTC &&
      now.getUTCMinutes() === 0 &&
      lastRun !== dateKey
    ) {
      lastRun = dateKey;
      fn().catch(err => console.error(`[Scheduler] ${label} failed:`, err));
    }
  }, 60 * 1000);
  console.warn(`[Scheduler] ${label} scheduled at ${hourUTC}:00 UTC daily`);
}

async function runGameResultsJob() {
  console.warn("[Scheduler] Running game results resolution...");
  await syncGameScores();
  const results = await resolveGameResults();
  console.warn(
    `[Scheduler] Game results: ${results.resolved} resolved (${results.wins}W/${results.losses}L/${results.pushes}P)`
  );
  try {
    await runClosingLineJob();
  } catch (err) {
    console.warn("[Scheduler] Closing line job failed:", err);
  }
}

export function startScheduler() {
  setTimeout(() => {
    runDailyPicksJob().catch(console.error);
  }, 5000);
  setTimeout(() => {
    runGameResultsJob().catch(console.error);
  }, 10000);
  setTimeout(() => {
    runClosingLineJob().catch(console.error);
  }, 20000);
  scheduleDaily(6, runDailyPicksJob, "Daily Picks Generation");
  scheduleDaily(8, runGameResultsJob, "Game Results Resolution (Morning)");
  scheduleDaily(20, runGameResultsJob, "Game Results Resolution (Evening)");
  scheduleDaily(
    9,
    async () => {
      await runClosingLineJob();
    },
    "Closing Line Capture"
  );
  scheduleDaily(
    21,
    async () => {
      await runClosingLineJob();
    },
    "Closing Line Capture (Evening)"
  );
  scheduleDaily(13, sendDailyDigestToAllUsers, "Daily Digest Emails");
  console.warn("[Scheduler] All scheduled jobs started");
}
