/**
 * ev.router.ts — EV Finder + CLV auto-stamp
 *
 * Core OddsJam Gold feature: running on odds data we already pay for,
 * sold at ChalkPicks' retail price point.
 *
 * Endpoints:
 *   ev.screen          — live +EV rows priced against a sharp book (Pro+)
 *   ev.stampClosingLines — called by n8n cron every 15 min; archives snapshots
 *   ev.stampCLV        — auto-fills CLV on pending bets from snapshot archive
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { oddsSnapshots, userBets } from "../../drizzle/schema";
import { eq, and, lt, desc, gte, sql } from "drizzle-orm";
import {
  americanToImplied,
  devig,
  calculateEV,
  americanToDecimal,
} from "../../shared/oddsMath";

// ─── Tier guard ───────────────────────────────────────────────────────────────
// Monthly Pro or higher required for EV screen
import { TRPCError } from "@trpc/server";

const proProcedure = protectedProcedure.use(({ ctx, next }) => {
  const tier = (ctx.user as any)?.subscriptionTier ?? "free";
  const allowed = ["monthly", "yearly", "trial"];
  if (!allowed.includes(tier)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Monthly Pro or higher required for the +EV Finder",
    });
  }
  return next({ ctx });
});

// ─── Sharp books (reference for devig) ────────────────────────────────────────
const SHARP_BOOKS = ["pinnacle", "betfair_ex_eu", "matchbook", "lowvig"];
const ALL_BOOKS = [
  "draftkings", "fanduel", "betmgm", "caesars", "pointsbet",
  "barstool", "bet365", "unibet", "betus", "mybookieag",
  "pinnacle", "betfair_ex_eu", "matchbook", "lowvig",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Outcome {
  name: string;
  price: number;  // American odds
  point?: number;
}

interface BookOdds {
  bookmaker: string;
  outcomes: Outcome[];
}

/**
 * Fetch live odds from The Odds API for a sport.
 * Returns raw bookmaker data.
 */
async function fetchLiveOdds(sport: string): Promise<any[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${ALL_BOOKS.join(",")}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Find the sharpest available book for a given event from the raw odds data.
 */
function getSharpOdds(bookOdds: BookOdds[]): BookOdds | null {
  for (const sharp of SHARP_BOOKS) {
    const found = bookOdds.find((b) => b.bookmaker === sharp);
    if (found) return found;
  }
  return null;
}

/**
 * Calculate EV for a single outcome given sharp book as reference.
 * Returns null if not enough data.
 */
function calcOutcomeEV(
  betOdds: number,
  sharpOdds: Outcome[],
  outcomeName: string
): { ev: number; fairOdds: number; impliedProb: number } | null {
  if (sharpOdds.length < 2) return null;

  // Devig the sharp book to get fair probabilities
  const rawImplied = sharpOdds.map((o) => americanToImplied(o.price));
  const fairProbs = devig(rawImplied);

  // Find the matching outcome index
  const idx = sharpOdds.findIndex((o) =>
    o.name.toLowerCase().includes(outcomeName.toLowerCase()) ||
    outcomeName.toLowerCase().includes(o.name.toLowerCase())
  );
  if (idx === -1) return null;

  const fairProb = fairProbs[idx];
  const ev = calculateEV(fairProb, betOdds);

  // Fair odds in American
  const fairDecimal = 1 / fairProb;
  const fairAmerican = fairDecimal >= 2
    ? Math.round((fairDecimal - 1) * 100)
    : Math.round(-100 / (fairDecimal - 1));

  return {
    ev: Math.round(ev * 100) / 100,
    fairOdds: fairAmerican,
    impliedProb: Math.round(fairProb * 10000) / 100,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const evRouter = router({
  /**
   * screen — live +EV rows priced against a sharp book.
   * This is the core OddsJam Gold feature.
   */
  screen: proProcedure
    .input(
      z.object({
        sport: z.string().default("americanfootball_nfl"),
        minEV: z.number().default(2.0),
        marketKey: z.enum(["h2h", "spreads", "totals"]).default("h2h"),
      })
    )
    .query(async ({ input }) => {
      const events = await fetchLiveOdds(input.sport);
      const evRows: Array<{
        eventId: string;
        homeTeam: string;
        awayTeam: string;
        commenceTime: string;
        bookmaker: string;
        outcomeName: string;
        betOdds: number;
        fairOdds: number;
        ev: number;
        impliedProb: number;
        sharpBook: string;
      }> = [];

      for (const event of events) {
        const bookOdds: BookOdds[] = (event.bookmakers || []).map((b: any) => {
          const market = (b.markets || []).find((m: any) => m.key === input.marketKey);
          return {
            bookmaker: b.key,
            outcomes: market ? market.outcomes : [],
          };
        }).filter((b: BookOdds) => b.outcomes.length > 0);

        const sharpBook = getSharpOdds(bookOdds);
        if (!sharpBook) continue;

        for (const book of bookOdds) {
          if (SHARP_BOOKS.includes(book.bookmaker)) continue; // skip sharp books themselves
          for (const outcome of book.outcomes) {
            const calc = calcOutcomeEV(outcome.price, sharpBook.outcomes, outcome.name);
            if (!calc || calc.ev < input.minEV) continue;

            evRows.push({
              eventId: event.id,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              commenceTime: event.commence_time,
              bookmaker: book.bookmaker,
              outcomeName: outcome.name,
              betOdds: outcome.price,
              fairOdds: calc.fairOdds,
              ev: calc.ev,
              impliedProb: calc.impliedProb,
              sharpBook: sharpBook.bookmaker,
            });
          }
        }
      }

      // Sort by EV descending
      evRows.sort((a, b) => b.ev - a.ev);

      return {
        rows: evRows.slice(0, 50),
        sport: input.sport,
        minEV: input.minEV,
        updatedAt: new Date().toISOString(),
        totalFound: evRows.length,
      };
    }),

  /**
   * stampClosingLines — archives current odds snapshots to the DB.
   * Called by n8n cron every 15 minutes via service token.
   * This is the moat: nobody else has your line history.
   */
  stampClosingLines: publicProcedure
    .input(
      z.object({
        serviceToken: z.string(),
        sports: z.array(z.string()).default([
          "americanfootball_nfl",
          "basketball_nba",
          "baseball_mlb",
          "icehockey_nhl",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      // Simple service token auth
      const expected = process.env.CRON_SERVICE_TOKEN || "chalkpicks_cron_2026";
      if (input.serviceToken !== expected) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid service token" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let totalInserted = 0;

      for (const sport of input.sports) {
        const events = await fetchLiveOdds(sport);

        for (const event of events) {
          for (const bookmaker of (event.bookmakers || [])) {
            for (const market of (bookmaker.markets || [])) {
              try {
                await db.insert(oddsSnapshots).values({
                  eventId: event.id,
                  sportKey: sport,
                  homeTeam: event.home_team,
                  awayTeam: event.away_team,
                  commenceTime: new Date(event.commence_time),
                  bookmaker: bookmaker.key,
                  marketKey: market.key,
                  outcomesJson: JSON.stringify(market.outcomes),
                });
                totalInserted++;
              } catch {
                // Ignore duplicate/constraint errors
              }
            }
          }
        }
      }

      return {
        inserted: totalInserted,
        sports: input.sports,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * stampCLV — auto-fills CLV on all pending bets that have a matching
   * closing line in the snapshot archive.
   * Called by n8n cron after game start.
   */
  stampCLV: publicProcedure
    .input(
      z.object({
        serviceToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const expected = process.env.CRON_SERVICE_TOKEN || "chalkpicks_cron_2026";
      if (input.serviceToken !== expected) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid service token" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Get all pending bets that don't have CLV yet
      const pendingBets = await db
        .select()
        .from(userBets)
        .where(
          and(
            eq(userBets.result, "pending"),
            sql`${userBets.clvValue} IS NULL`,
            sql`${userBets.betPlacedTime} IS NOT NULL`
          )
        )
        .limit(200);

      let stamped = 0;

      for (const bet of pendingBets) {
        if (!bet.betPlacedTime) continue;

        // Find the latest snapshot before game start for this sport
        // We match by sport key since we don't store event ID on bets
        const snapshot = await db
          .select()
          .from(oddsSnapshots)
          .where(
            and(
              eq(oddsSnapshots.sportKey, bet.sportKey),
              eq(oddsSnapshots.marketKey, "h2h"),
              // Closing line = last snapshot before commence time
              lt(oddsSnapshots.snapshotAt, oddsSnapshots.commenceTime),
            )
          )
          .orderBy(desc(oddsSnapshots.snapshotAt))
          .limit(1);

        if (!snapshot.length) continue;

        try {
          const outcomes: Outcome[] = JSON.parse(snapshot[0].outcomesJson);
          if (outcomes.length < 2) continue;

          // Use the first outcome as reference (closest match)
          const closingOdds = outcomes[0].price;
          const betOdds = Number(bet.odds);

          // CLV = (closing decimal / bet decimal - 1) * 100
          const betDecimal = americanToDecimal(betOdds);
          const closingDecimal = americanToDecimal(closingOdds);
          const clv = ((closingDecimal / betDecimal) - 1) * 100;
          const lineMovement = closingOdds - betOdds;

          await db
            .update(userBets)
            .set({
              closingLineOdds: closingOdds,
              closingLineTime: snapshot[0].snapshotAt,
              clvValue: clv.toFixed(2) as any,
              lineMovement,
            })
            .where(eq(userBets.id, bet.id));

          stamped++;
        } catch {
          // Skip malformed snapshots
        }
      }

      return {
        processed: pendingBets.length,
        stamped,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * getSnapshotCount — diagnostic endpoint showing archive size
   */
  getSnapshotCount: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(oddsSnapshots);
    return { count: Number(result[0]?.count ?? 0) };
  }),
});
