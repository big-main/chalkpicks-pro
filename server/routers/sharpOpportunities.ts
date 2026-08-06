import { router, publicProcedure, premiumProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  fetchSharpEVOpportunities,
  fetchSharpArbOpportunities,
  fetchSharpLowHoldLines,
  fetchSharpGameState,
} from "../services/dataService";

export const sharpOpportunitiesRouter = router({
  /** +EV opportunities — Pro+ feature, available to premium users */
  getEVOpportunities: premiumProcedure
    .input(
      z.object({
        sport: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        minEV: z.number().optional(),
        liveOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const opps = await fetchSharpEVOpportunities({
        sport: input.sport,
        limit: input.limit,
        minEV: input.minEV,
      });
      const filtered = input.liveOnly ? opps.filter(o => o.isLive) : opps;
      return {
        opportunities: filtered,
        count: filtered.length,
        updatedAt: new Date().toISOString(),
      };
    }),

  /** Arbitrage opportunities — available to all premium users */
  getArbOpportunities: premiumProcedure
    .input(
      z.object({
        sport: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        liveOnly: z.boolean().default(false),
        minProfit: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const opps = await fetchSharpArbOpportunities({
        sport: input.sport,
        limit: input.limit,
        liveOnly: input.liveOnly,
      });
      const filtered = opps.filter(
        o => o.estimatedNetProfitPercent >= input.minProfit
      );
      return {
        opportunities: filtered,
        count: filtered.length,
        updatedAt: new Date().toISOString(),
      };
    }),

  /** Low hold lines — Pro+ feature */
  getLowHoldLines: premiumProcedure
    .input(
      z.object({
        sport: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        maxHold: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const lines = await fetchSharpLowHoldLines({
        sport: input.sport,
        limit: input.limit,
        maxHold: input.maxHold,
      });
      return {
        lines,
        count: lines.length,
        updatedAt: new Date().toISOString(),
      };
    }),

  /** Live game state — available to all users (free preview) */
  getGameState: publicProcedure
    .input(
      z.object({
        sport: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const games = await fetchSharpGameState(input.sport);
      return {
        games,
        count: games.length,
        updatedAt: new Date().toISOString(),
      };
    }),
});
