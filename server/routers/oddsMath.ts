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
import {
  shinDevig,
  powerDevig,
  calculateKelly,
  buildPoissonMatrix,
  poissonProbability,
  updateEloAdvanced,
  detectSteamMoveAdvanced,
} from "@shared/quantEngine";

/**
 * Betting-math API surface backing the +EV finder, devig tool, and calculators.
 * Pure computation over the shared oddsMath + quantEngine modules — no external
 * data needed, so these endpoints are always available.
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
        method: "multiplicative",
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
   * Shin Devig: institutional-grade devigging that solves for insider
   * parameter z. Used by Pinnacle/CRIS for accurate fair probabilities.
   */
  shinDevig: publicProcedure
    .input(
      z.object({
        outcomes: z
          .array(
            z.object({
              id: z.string(),
              decimalOdds: z.number().min(1.01),
            })
          )
          .min(2),
      })
    )
    .query(({ input }) => {
      return shinDevig(input.outcomes);
    }),

  /**
   * Power Devig: exponent-based devigging for heavy favorites/longshots.
   * Better than multiplicative for lopsided markets (-500/+350).
   */
  powerDevig: publicProcedure
    .input(
      z.object({
        outcomes: z
          .array(
            z.object({
              id: z.string(),
              decimalOdds: z.number().min(1.01),
            })
          )
          .min(2),
      })
    )
    .query(({ input }) => {
      return powerDevig(input.outcomes);
    }),

  /**
   * +EV screen: given a sharp/fair line and the price offered at another book,
   * return the EV% and the recommended (fractional) Kelly stake.
   */
  evScreen: publicProcedure
    .input(
      z.object({
        fairAmerican: z
          .number()
          .describe("Fair (e.g. no-vig/sharp) American odds"),
        offeredAmerican: z.number().describe("American odds actually on offer"),
        kellyFraction: z.number().min(0).max(1).default(0.25),
      })
    )
    .query(({ input }) => {
      const ev = edgeVsFairLine(input.fairAmerican, input.offeredAmerican);
      const fairProb = 1 / americanToDecimal(input.fairAmerican);
      const stake = kellyFraction(
        fairProb,
        input.offeredAmerican,
        input.kellyFraction
      );
      return {
        evPercent: ev * 100,
        isPositiveEV: ev > 0,
        fairProbability: fairProb,
        recommendedStakeFraction: stake,
      };
    }),

  /**
   * Fractional Kelly Calculator with risk controls.
   * Returns recommended stake, EV%, and full/scaled Kelly fractions.
   */
  kellyCalculator: publicProcedure
    .input(
      z.object({
        fairProbability: z.number().min(0.01).max(0.99),
        offeredDecimalOdds: z.number().min(1.01),
        bankroll: z.number().min(1),
        fraction: z.number().min(0.05).max(1).default(0.25),
        maxBankrollCapPct: z.number().min(0.01).max(0.2).default(0.03),
      })
    )
    .query(({ input }) => {
      return calculateKelly(input);
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
      clvPercentagePoints: closingLineValue(
        input.betAmerican,
        input.closingAmerican
      ),
      beatTheClose:
        closingLineValue(input.betAmerican, input.closingAmerican) > 0,
    })),

  /**
   * Poisson Matrix: builds a score probability grid for modeling
   * totals, goals, runs, rounds. Returns win/draw/loss + over/under probs.
   */
  poissonMatrix: publicProcedure
    .input(
      z.object({
        lambdaA: z
          .number()
          .min(0.1)
          .max(20)
          .describe("Expected score rate for team A"),
        lambdaB: z
          .number()
          .min(0.1)
          .max(20)
          .describe("Expected score rate for team B"),
        maxScore: z.number().min(5).max(30).default(10),
        keyTotals: z.array(z.number()).default([2.5, 8.5, 10.5]),
      })
    )
    .query(({ input }) => {
      const result = buildPoissonMatrix(
        input.lambdaA,
        input.lambdaB,
        input.maxScore,
        input.keyTotals
      );
      // Don't return the full matrix (too large for API), just the summary
      return {
        teamAWinProb: result.teamAWinProb,
        drawProb: result.drawProb,
        teamBWinProb: result.teamBWinProb,
        overUnderProbs: result.overUnderProbs,
        mostLikelyScore: findMostLikelyScore(result.scoreMatrix),
      };
    }),

  /**
   * Elo prediction with Margin-of-Victory adjustment.
   * FiveThirtyEight-style power ratings.
   */
  eloPredictAdvanced: publicProcedure
    .input(
      z.object({
        ratingA: z.number().min(800).max(2400),
        ratingB: z.number().min(800).max(2400),
        homeFieldAdvantage: z.number().default(24),
        kFactor: z.number().min(5).max(50).default(20),
        scoreA: z.number().min(0),
        scoreB: z.number().min(0),
      })
    )
    .query(({ input }) => {
      return updateEloAdvanced(input);
    }),

  /**
   * Steam Move Detection: checks if sharp books are moving in unison.
   */
  steamMoveCheck: publicProcedure
    .input(
      z.object({
        sharpBookMoves: z.array(
          z.object({
            bookmaker: z.string(),
            previousOdds: z.number(),
            currentOdds: z.number(),
            timestampMs: z.number(),
          })
        ),
        publicBettingPct: z.number().min(0).max(100).default(50),
        minSharpBooks: z.number().min(1).max(10).default(3),
        maxTimeWindowMs: z.number().default(120000),
        minMagnitudeCents: z.number().default(10),
      })
    )
    .query(({ input }) => {
      return detectSteamMoveAdvanced(input);
    }),
});

// Helper: find most likely score from matrix
function findMostLikelyScore(matrix: number[][]): {
  scoreA: number;
  scoreB: number;
  probability: number;
} {
  let maxProb = 0;
  let bestA = 0;
  let bestB = 0;
  for (let a = 0; a < matrix.length; a++) {
    for (let b = 0; b < matrix[a].length; b++) {
      if (matrix[a][b] > maxProb) {
        maxProb = matrix[a][b];
        bestA = a;
        bestB = b;
      }
    }
  }
  return { scoreA: bestA, scoreB: bestB, probability: maxProb };
}
