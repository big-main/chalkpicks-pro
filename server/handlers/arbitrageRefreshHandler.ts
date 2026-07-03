/**
 * Arbitrage Refresh Handler
 * Called by Manus Heartbeat cron every 5 minutes to refresh arbitrage opportunities.
 * Endpoint: POST /api/scheduled/refresh-arbitrage
 *
 * Per periodic-updates.md §4a: This is a project-level Heartbeat (no end-user).
 * The handler does NOT use sdk.authenticateRequest — instead it trusts the
 * platform gateway which restricts /api/scheduled/* to cron callers only.
 * The task UID is read from the x-manus-cron-task-uid header for logging.
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { arbitrageOpportunities } from "../../drizzle/schema";
import { fetchMultiBookmakerOdds, BookmakerOdds } from "../services/sportsbookOddsScraper";
import { detectAllArbitrages, calculateOptimalBets, classifyRiskLevel } from "../services/arbitrageDetector";
import { lt } from "drizzle-orm";
import crypto from "crypto";

const SPORTS = [
  "americanfootball_nfl",
  "basketball_nba",
  "baseball_mlb",
  "icehockey_nhl",
  "soccer_epl",
];

// Minimum arbitrage percentage to save (0.5% = 0.5 cents per $100)
const MIN_ARBITRAGE_PCT = 0.5;

// TTL for arbitrage opportunities (30 minutes)
const OPPORTUNITY_TTL_MS = 30 * 60 * 1000;

export async function arbitrageRefreshHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string | undefined;
  const startTime = Date.now();

  try {
    console.log(`[ArbRefresh] Starting refresh (taskUid=${taskUid ?? "manual"})`);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available", timestamp: new Date().toISOString() });
    }

    // 1. Expire old opportunities
    const now = new Date();
    await db
      .update(arbitrageOpportunities)
      .set({ isActive: false })
      .where(lt(arbitrageOpportunities.expiresAt, now));

    let totalInserted = 0;
    let totalDetected = 0;

    // 2. Fetch odds for each sport and detect arbitrage
    for (const sport of SPORTS) {
      try {
        const bookmakerOdds = await fetchMultiBookmakerOdds(sport);
        if (!bookmakerOdds.length) continue;

        // Group by event
        const eventMap: Record<string, BookmakerOdds[]> = {};
        for (const odds of bookmakerOdds) {
          if (!eventMap[odds.eventId]) eventMap[odds.eventId] = [];
          eventMap[odds.eventId]!.push(odds);
        }

        for (const [eventId, eventOdds] of Object.entries(eventMap)) {
          const firstOdds = eventOdds[0];
          if (!firstOdds) continue;

          // Build moneyline odds array across bookmakers
          const h2hOdds: Array<{ bookmaker: string; odds: number }> = [];
          for (const bookOdds of eventOdds) {
            const h2hMarket = bookOdds.markets.find((m: { key: string }) => m.key === "h2h");
            if (!h2hMarket) continue;
            for (const outcome of h2hMarket.outcomes) {
              h2hOdds.push({ bookmaker: `${bookOdds.bookmaker}:${outcome.name}`, odds: outcome.price });
            }
          }

          if (h2hOdds.length < 2) continue;

          // Detect arbitrage opportunities
          const arbs = detectAllArbitrages(h2hOdds, MIN_ARBITRAGE_PCT);
          totalDetected += arbs.length;

          for (const arb of arbs) {
            // Parse bookmaker:outcome format
            const [book1, outcome1] = arb.bookmaker1.split(":");
            const [book2, outcome2] = arb.bookmaker2.split(":");

            // Calculate optimal bets for $100 investment
            const bets = calculateOptimalBets(100, arb.odds1, arb.odds2);
            if (!bets) continue;

            const riskLevel = classifyRiskLevel(arb.arbitragePercent);
            const expiresAt = new Date(Date.now() + OPPORTUNITY_TTL_MS);

            // Upsert: check if this exact arb already exists and is active
            const existingId = `${eventId}:${book1}:${book2}`;
            const dedupKey = crypto.createHash("md5").update(existingId).digest("hex").slice(0, 16);

            try {
              await db.insert(arbitrageOpportunities).values({
                eventId: `${eventId}_${dedupKey}`,
                sport: sport.split("_")[0] ?? sport,
                league: sport,
                matchup: firstOdds.eventName,
                eventTime: new Date(firstOdds.eventDate),
                bookA: book1 ?? "unknown",
                bookB: book2 ?? "unknown",
                outcomeA: outcome1 ?? "Team A",
                oddsA: String(arb.odds1),
                impliedProbabilityA: String(arb.impliedProb1.toFixed(4)),
                outcomeB: outcome2 ?? "Team B",
                oddsB: String(arb.odds2),
                impliedProbabilityB: String(arb.impliedProb2.toFixed(4)),
                totalImpliedProbability: String((arb.impliedProb1 + arb.impliedProb2).toFixed(4)),
                arbitragePercentage: String((arb.arbitragePercent / 100).toFixed(4)),
                profitPercentage: String((arb.arbitragePercent / 100).toFixed(4)),
                stakeA: String(bets.bet1),
                stakeB: String(bets.bet2),
                guaranteedProfit: String(bets.profit),
                isActive: true,
                expiresAt,
                source: "heartbeat-cron",
              });
              totalInserted++;
            } catch (insertErr: any) {
              // Duplicate eventId — skip silently
              if (!insertErr?.message?.includes("Duplicate")) {
                console.warn("[ArbRefresh] Insert error:", insertErr?.message);
              }
            }
          }
        }
      } catch (sportErr: any) {
        console.warn(`[ArbRefresh] Error fetching ${sport}:`, sportErr?.message);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[ArbRefresh] Done: detected=${totalDetected}, inserted=${totalInserted}, elapsed=${elapsed}ms`
    );

    res.json({
      ok: true,
      detected: totalDetected,
      inserted: totalInserted,
      elapsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ArbRefresh] Fatal error:", err);
    res.status(500).json({
      error: err?.message ?? "Unknown error",
      stack: err?.stack,
      context: { taskUid, url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
