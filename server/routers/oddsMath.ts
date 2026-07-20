import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  noVigProbabilities,
  bookmakerHold,
  expectedValue,
  edgeVsFairLine,
  kellyFraction,
  closingLineValue,
  americanToDecimal,
  decimalToAmerican,
} from "@shared/oddsMath";

/**
 * Betting-math API surface backing the +EV finder, devig tool, and calculators.
 * Pure computation over the shared oddsMath module — no external data needed, so
 * these endpoints are always available regardless of odds-provider status.
 */
export const oddsMathRouter = router({
  /**
   * Devig a market: strip the bookmaker's vig from a set of American odds and
   * return each outcome's fair probability + fair American price, plus the hold.
   */
  devig: publicProcedure
    .input(
      z.object({
        americanOdds: z
          .array(z.number())
          .min(2)
          .describe("American odds for every outcome of one market"),
      })
    )
    .query(({ input }) => {
      const fairProbabilities = noVigProbabilities(input.americanOdds);
      return {
        hold: bookmakerHold(input.americanOdds),
        outcomes: input.americanOdds.map((odds, i) => {
          const fairProb = fairProbabilities[i];
          const fairDecimal = 1 / fairProb;
          return {
            offeredAmerican: odds,
            fairProbability: fairProb,
            fairDecimal,
            fairAmerican: decimalToAmerican(fairDecimal),
          };
        }),
      };
    }),

  /**
   * +EV screen: given a sharp/fair line and the price offered at another book,
   * return the EV% and the recommended (fractional) Kelly stake.
   */
  evScreen: publicProcedure
    .input(
      z.object({
        fairAmerican: z.number().describe("Fair (e.g. no-vig/sharp) American odds"),
        offeredAmerican: z.number().describe("American odds actually on offer"),
        kellyFraction: z.number().min(0).max(1).default(0.25),
      })
    )
    .query(({ input }) => {
      const ev = edgeVsFairLine(input.fairAmerican, input.offeredAmerican);
      const fairProb = 1 / americanToDecimal(input.fairAmerican);
      const stake = kellyFraction(fairProb, input.offeredAmerican, input.kellyFraction);
      return {
        evPercent: ev * 100,
        isPositiveEV: ev > 0,
        fairProbability: fairProb,
        recommendedStakeFraction: stake,
      };
    }),

  /**
   * Expected value of a single bet from an explicit fair win probability.
   */
  expectedValue: publicProcedure
    .input(
      z.object({
        fairProbability: z.number().min(0).max(1),
        americanOdds: z.number(),
      })
    )
    .query(({ input }) => ({
      evPercent: expectedValue(input.fairProbability, input.americanOdds) * 100,
    })),

  /**
   * Closing line value (percentage points) of a bet vs the closing price.
   */
  clv: publicProcedure
    .input(
      z.object({
        betAmerican: z.number(),
        closingAmerican: z.number(),
      })
    )
    .query(({ input }) => ({
      clvPercentagePoints: closingLineValue(input.betAmerican, input.closingAmerican),
      beatTheClose: closingLineValue(input.betAmerican, input.closingAmerican) > 0,
    })),
});
