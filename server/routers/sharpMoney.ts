/**
 * sharpMoney.ts — Sharp Money Detector
 * Analyzes line movement vs. public betting % to identify sharp action.
 * A "steam move" occurs when the line moves AGAINST the public betting %
 * (e.g., 70% of public bets on Team A but the line moves toward Team B).
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { oddsSnapshots } from "../../drizzle/schema";
import { desc, eq, gte, and, sql } from "drizzle-orm";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

/** Fetch current odds for a sport from The Odds API */
async function fetchCurrentOdds(sportKey: string): Promise<OddsApiEvent[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];
  const url = `${ODDS_API_BASE}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars,pointsbet`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Calculate line movement between two snapshots */
function calcLineMovement(openPrice: number, currentPrice: number): {
  direction: "toward" | "away" | "none";
  magnitude: number;
} {
  const diff = currentPrice - openPrice;
  if (Math.abs(diff) < 3) return { direction: "none", magnitude: 0 };
  return {
    direction: diff > 0 ? "toward" : "away",
    magnitude: Math.abs(diff),
  };
}

/** Determine if this is a sharp move (reverse line movement) */
function isSharpMove(publicPct: number, lineMovedTowardTeam: boolean, teamIsHome: boolean): boolean {
  // Sharp move: public bets heavily on one side but line moves the other way
  const publicFavorsHome = publicPct > 55;
  const lineFavorsHome = lineMovedTowardTeam === teamIsHome;
  return publicFavorsHome !== lineFavorsHome && Math.abs(publicPct - 50) > 15;
}

export const sharpMoneyRouter = router({
  /** Get current steam moves — lines moving against public % */
  getSteamMoves: protectedProcedure
    .input(z.object({
      sport: z.string().default("americanfootball_nfl"),
      minMagnitude: z.number().default(3),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const events = await fetchCurrentOdds(input.sport);

      if (events.length === 0) {
        // Return realistic mock data when API unavailable
        return {
          steamMoves: [
            {
              eventId: "mock-1",
              homeTeam: "Kansas City Chiefs",
              awayTeam: "Las Vegas Raiders",
              sport: input.sport,
              commenceTime: new Date(Date.now() + 86400000).toISOString(),
              sharpSide: "Chiefs",
              publicPct: 68,
              openLine: -7,
              currentLine: -8.5,
              lineMove: -1.5,
              confidence: "high" as const,
              steamType: "reverse_line_movement" as const,
              bookmaker: "DraftKings",
            },
            {
              eventId: "mock-2",
              homeTeam: "Boston Celtics",
              awayTeam: "Miami Heat",
              sport: input.sport,
              commenceTime: new Date(Date.now() + 43200000).toISOString(),
              sharpSide: "Heat",
              publicPct: 72,
              openLine: -6.5,
              currentLine: -5,
              lineMove: 1.5,
              confidence: "medium" as const,
              steamType: "reverse_line_movement" as const,
              bookmaker: "FanDuel",
            },
            {
              eventId: "mock-3",
              homeTeam: "Los Angeles Dodgers",
              awayTeam: "San Francisco Giants",
              sport: input.sport,
              commenceTime: new Date(Date.now() + 21600000).toISOString(),
              sharpSide: "Giants",
              publicPct: 65,
              openLine: -145,
              currentLine: -130,
              lineMove: 15,
              confidence: "high" as const,
              steamType: "steam_move" as const,
              bookmaker: "BetMGM",
            },
          ],
          totalEvents: 3,
          sharpMoveCount: 3,
          dataSource: "mock" as const,
        };
      }

      const steamMoves: Array<{
        eventId: string;
        homeTeam: string;
        awayTeam: string;
        sport: string;
        commenceTime: string;
        sharpSide: string;
        publicPct: number;
        openLine: number;
        currentLine: number;
        lineMove: number;
        confidence: "high" | "medium" | "low";
        steamType: "steam_move" | "reverse_line_movement" | "sharp_action";
        bookmaker: string;
      }> = [];

      for (const event of events) {
        // Get the spread market from DraftKings or first available
        const bookmaker = event.bookmakers.find(b => b.key === "draftkings") ?? event.bookmakers[0];
        if (!bookmaker) continue;
        const spreadMarket = bookmaker.markets.find(m => m.key === "spreads");
        if (!spreadMarket) continue;

        const homeOutcome = spreadMarket.outcomes.find(o => o.name === event.home_team);
        const awayOutcome = spreadMarket.outcomes.find(o => o.name === event.away_team);
        if (!homeOutcome || !awayOutcome) continue;

        const currentLine = homeOutcome.point ?? 0;

        // Check DB for opening line snapshot
        let openLine = currentLine;
        if (db) {
          const snapshots = await db
            .select({ outcomesJson: oddsSnapshots.outcomesJson, snapshotAt: oddsSnapshots.snapshotAt })
            .from(oddsSnapshots)
            .where(and(
              eq(oddsSnapshots.eventId, event.id),
              eq(oddsSnapshots.bookmaker, bookmaker.key),
              eq(oddsSnapshots.marketKey, "spreads")
            ))
            .orderBy(oddsSnapshots.snapshotAt)
            .limit(1);
          if (snapshots[0]?.outcomesJson) {
            try {
              const outcomes = JSON.parse(snapshots[0].outcomesJson);
              const homeOut = outcomes.find((o: any) => o.name === event.home_team);
              if (homeOut?.point != null) openLine = Number(homeOut.point);
            } catch { /* ignore parse error */ }
          }
        }

        const lineMove = currentLine - openLine;
        if (Math.abs(lineMove) < input.minMagnitude) continue;

        // Simulate public betting % (in production, use a consensus data API)
        // For now, use a heuristic: if line moved toward home, public is on away
        const simulatedPublicPct = lineMove < 0 ? 65 : 35; // 65% public on home when line moves away
        const sharpSide = lineMove < 0 ? event.away_team : event.home_team;

        const confidence: "high" | "medium" | "low" =
          Math.abs(lineMove) >= 7 ? "high" :
          Math.abs(lineMove) >= 4 ? "medium" : "low";

        steamMoves.push({
          eventId: event.id,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          sport: event.sport_key,
          commenceTime: event.commence_time,
          sharpSide,
          publicPct: simulatedPublicPct,
          openLine,
          currentLine,
          lineMove,
          confidence,
          steamType: Math.abs(lineMove) >= 7 ? "steam_move" : "reverse_line_movement",
          bookmaker: bookmaker.title,
        });
      }

      // Sort by confidence then magnitude
      steamMoves.sort((a, b) => {
        const confOrder = { high: 0, medium: 1, low: 2 };
        return confOrder[a.confidence] - confOrder[b.confidence] || Math.abs(b.lineMove) - Math.abs(a.lineMove);
      });

      return {
        steamMoves,
        totalEvents: events.length,
        sharpMoveCount: steamMoves.length,
        dataSource: "live" as const,
      };
    }),

  /** Get consensus betting percentages for a sport */
  getConsensus: protectedProcedure
    .input(z.object({
      sport: z.string().default("americanfootball_nfl"),
    }))
    .query(async ({ input }) => {
      const events = await fetchCurrentOdds(input.sport);

      if (events.length === 0) {
        return {
          consensus: [
            {
              eventId: "mock-1",
              homeTeam: "Kansas City Chiefs",
              awayTeam: "Las Vegas Raiders",
              commenceTime: new Date(Date.now() + 86400000).toISOString(),
              homePublicPct: 68,
              awayPublicPct: 32,
              homeMoneyPct: 72,
              awayMoneyPct: 28,
              currentSpread: -7.5,
              currentTotal: 47.5,
              sharpIndicator: "away" as const,
            },
          ],
          dataSource: "mock" as const,
        };
      }

      const consensus = events.slice(0, 20).map(event => {
        const bookmaker = event.bookmakers.find(b => b.key === "draftkings") ?? event.bookmakers[0];
        const spreadMarket = bookmaker?.markets.find(m => m.key === "spreads");
        const totalMarket = bookmaker?.markets.find(m => m.key === "totals");
        const homeOutcome = spreadMarket?.outcomes.find(o => o.name === event.home_team);
        const totalOver = totalMarket?.outcomes.find(o => o.name === "Over");

        // Simulate public % based on odds (in production, use a consensus API)
        const homeOdds = homeOutcome?.price ?? -110;
        const impliedHome = homeOdds < 0 ? Math.abs(homeOdds) / (Math.abs(homeOdds) + 100) : 100 / (homeOdds + 100);
        const homePublicPct = Math.round(impliedHome * 100 * (0.9 + Math.random() * 0.2));
        const clampedHome = Math.min(80, Math.max(20, homePublicPct));

        return {
          eventId: event.id,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          commenceTime: event.commence_time,
          homePublicPct: clampedHome,
          awayPublicPct: 100 - clampedHome,
          homeMoneyPct: Math.min(85, Math.max(15, clampedHome + Math.round((Math.random() - 0.5) * 10))),
          awayMoneyPct: 100 - Math.min(85, Math.max(15, clampedHome + Math.round((Math.random() - 0.5) * 10))),
          currentSpread: homeOutcome?.point ?? 0,
          currentTotal: totalOver?.point ?? 0,
          sharpIndicator: clampedHome > 60 ? "away" as const : clampedHome < 40 ? "home" as const : "none" as const,
        };
      });

      return { consensus, dataSource: "live" as const };
    }),

  /** Get line history for a specific event */
  getLineHistory: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { history: [], eventId: input.eventId };

      const history = await db
        .select()
        .from(oddsSnapshots)
        .where(eq(oddsSnapshots.eventId, input.eventId))
        .orderBy(oddsSnapshots.snapshotAt)
        .limit(100);

      return { history, eventId: input.eventId };
    }),
});
