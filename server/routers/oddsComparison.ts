import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  fetchMultiBookmakerOdds,
  findBestLine,
  detectSteamMoves,
  americanOddsToImpliedProbability,
  americanToDecimal,
  type Market,
} from "../services/sportsbookOddsScraper";

/**
 * Odds Comparison Router
 * Provides procedures for fetching and analyzing odds from multiple sportsbooks
 */
export const oddsComparisonRouter = router({
  /**
   * Get odds for a specific sport from all available bookmakers
   */
  getMultiBookmakerOdds: publicProcedure
    .input(
      z.object({
        sport: z.string().describe("Sport key (e.g., americanfootball_nfl, basketball_nba)"),
        region: z.string().default("us").describe("Region (us, uk, au, etc.)"),
      })
    )
    .query(async ({ input }) => {
      const odds = await fetchMultiBookmakerOdds(input.sport, input.region);
      return {
        success: true,
        sport: input.sport,
        region: input.region,
        bookmakerCount: new Set(odds.map((o) => o.bookmaker)).size,
        eventCount: new Set(odds.map((o) => o.eventId)).size,
        odds,
      };
    }),

  /**
   * Get best lines for a specific event across all bookmakers
   */
  getBestLines: publicProcedure
    .input(
      z.object({
        sport: z.string(),
        eventName: z.string().optional().describe("Filter by event name"),
      })
    )
    .query(async ({ input }) => {
      const odds = await fetchMultiBookmakerOdds(input.sport);

      const bestLines: Record<
        string,
        {
          event: string;
          moneyline: { home: any; away: any };
          spreads: { home: any; away: any };
          totals: { over: any; under: any };
        }
      > = {};

      for (const odd of odds) {
        if (input.eventName && !odd.eventName.includes(input.eventName)) {
          continue;
        }

        if (!bestLines[odd.eventId]) {
          bestLines[odd.eventId] = {
            event: odd.eventName,
            moneyline: { home: null, away: null },
            spreads: { home: null, away: null },
            totals: { over: null, under: null },
          };
        }

        // Find best moneyline
        const homeMoneyline = findBestLine(odds, "h2h", odd.eventName.split(" vs ")[0]);
        const awayMoneyline = findBestLine(odds, "h2h", odd.eventName.split(" vs ")[1]);

        if (homeMoneyline) {
          bestLines[odd.eventId].moneyline.home = {
            ...homeMoneyline,
            impliedProb: americanOddsToImpliedProbability(homeMoneyline.odds),
            decimal: americanToDecimal(homeMoneyline.odds),
          };
        }

        if (awayMoneyline) {
          bestLines[odd.eventId].moneyline.away = {
            ...awayMoneyline,
            impliedProb: americanOddsToImpliedProbability(awayMoneyline.odds),
            decimal: americanToDecimal(awayMoneyline.odds),
          };
        }
      }

      return {
        success: true,
        bestLines: Object.values(bestLines),
      };
    }),

  /**
   * Detect steam moves (sharp line movement)
   */
  detectSteamMoves: publicProcedure
    .input(
      z.object({
        sport: z.string(),
        thresholdOdds: z.number().default(10).describe("Minimum odds movement to flag"),
      })
    )
    .query(async ({ input }) => {
      // Fetch current odds
      const current = await fetchMultiBookmakerOdds(input.sport);

      // In production, would compare against baseline from DB
      // For now, return current odds as reference
      return {
        success: true,
        sport: input.sport,
        timestamp: new Date().toISOString(),
        oddsSnapshot: current.slice(0, 20), // Return first 20 for demo
      };
    }),

  /**
   * Get odds comparison table for a specific event
   */
  getEventOddsComparison: publicProcedure
    .input(
      z.object({
        sport: z.string(),
        eventId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const odds = await fetchMultiBookmakerOdds(input.sport);

      // Group by event
      const events: Record<string, any[]> = {};
      for (const odd of odds) {
        if (!events[odd.eventId]) {
          events[odd.eventId] = [];
        }
        events[odd.eventId].push(odd);
      }

      // Format for display
      const comparison = Object.entries(events).map(([eventId, eventOdds]) => {
        const firstOdd = eventOdds[0];
        const bookmakerLines: Record<string, any> = {};

        for (const odd of eventOdds) {
          bookmakerLines[odd.bookmaker] = {
            moneyline: odd.markets.find((m: Market) => m.key === "h2h")?.outcomes || [],
            spreads: odd.markets.find((m: Market) => m.key === "spreads")?.outcomes || [],
            totals: odd.markets.find((m: Market) => m.key === "totals")?.outcomes || [],
          };
        }

        return {
          eventId,
          eventName: firstOdd.eventName,
          eventDate: firstOdd.eventDate,
          bookmakerCount: eventOdds.length,
          bookmakerLines,
        };
      });

      return {
        success: true,
        sport: input.sport,
        eventCount: comparison.length,
        comparison,
      };
    }),
});
