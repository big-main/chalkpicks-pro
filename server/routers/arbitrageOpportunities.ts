import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  detectArbitrage,
  detectAllArbitrages,
  calculateOptimalBets,
  classifyRiskLevel,
  filterArbitrages,
  ArbitrageOpportunity,
} from "../services/arbitrageDetector";

export const arbitrageOpportunitiesRouter = router({
  /**
   * Get all current arbitrage opportunities
   */
  getOpportunities: publicProcedure
    .input(
      z.object({
        sport: z.string().optional(),
        minArbitragePercent: z.number().default(1),
        maxRiskLevel: z.enum(["low", "medium", "high"]).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }: any) => {
      // Mock data - in production, fetch from database
      const opportunities: ArbitrageOpportunity[] = [
        {
          id: "arb-1",
          sport: "nfl",
          eventName: "Chiefs vs Ravens",
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          team1: "Chiefs",
          team2: "Ravens",
          marketType: "moneyline",
          bookmaker1: "DraftKings",
          bookmaker2: "FanDuel",
          odds1: -110,
          odds2: 110,
          impliedProb1: 0.52,
          impliedProb2: 0.48,
          arbitragePercent: 2.5,
          profitPotential: 250,
          recommendedBet1: 1000,
          recommendedBet2: 952,
          totalInvestment: 1952,
          guaranteedProfit: 48,
          riskLevel: "medium",
          detectedAt: new Date(),
        },
        {
          id: "arb-2",
          sport: "nba",
          eventName: "Lakers vs Celtics",
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          team1: "Lakers",
          team2: "Celtics",
          marketType: "spread",
          bookmaker1: "BetMGM",
          bookmaker2: "Caesars",
          odds1: -110,
          odds2: -110,
          impliedProb1: 0.525,
          impliedProb2: 0.475,
          arbitragePercent: 3.2,
          profitPotential: 320,
          recommendedBet1: 1000,
          recommendedBet2: 905,
          totalInvestment: 1905,
          guaranteedProfit: 95,
          riskLevel: "low",
          detectedAt: new Date(),
        },
      ];

      // Filter by criteria
      let filtered = opportunities;
      if (input.sport) {
        filtered = filtered.filter((opp) => opp.sport === input.sport);
      }
      if (input.minArbitragePercent) {
        filtered = filtered.filter((opp) => opp.arbitragePercent >= input.minArbitragePercent);
      }
      if (input.maxRiskLevel) {
        const riskLevels = ["low", "medium", "high"];
        filtered = filtered.filter((opp) => riskLevels.indexOf(opp.riskLevel) <= riskLevels.indexOf(input.maxRiskLevel!));
      }

      return {
        opportunities: filtered.slice(0, input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get arbitrage opportunity details
   */
  getOpportunityDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }: any) => {
      // Mock data - in production, fetch from database
      const opportunity: ArbitrageOpportunity = {
        id: input.id,
        sport: "nfl",
        eventName: "Chiefs vs Ravens",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        team1: "Chiefs",
        team2: "Ravens",
        marketType: "moneyline",
        bookmaker1: "DraftKings",
        bookmaker2: "FanDuel",
        odds1: -110,
        odds2: 110,
        impliedProb1: 0.52,
        impliedProb2: 0.48,
        arbitragePercent: 2.5,
        profitPotential: 250,
        recommendedBet1: 1000,
        recommendedBet2: 952,
        totalInvestment: 1952,
        guaranteedProfit: 48,
        riskLevel: "medium",
        detectedAt: new Date(),
      };

      return {
        opportunity,
        analysis: {
          description: `Arbitrage opportunity detected between ${opportunity.bookmaker1} and ${opportunity.bookmaker2}. Guaranteed profit of $${opportunity.guaranteedProfit} with ${opportunity.arbitragePercent.toFixed(2)}% arbitrage margin.`,
          executionSteps: [
            `Bet $${opportunity.recommendedBet1} on ${opportunity.team1} at ${opportunity.bookmaker1} (${opportunity.odds1} odds)`,
            `Bet $${opportunity.recommendedBet2} on ${opportunity.team2} at ${opportunity.bookmaker2} (${opportunity.odds2} odds)`,
            `Guaranteed profit: $${opportunity.guaranteedProfit} regardless of outcome`,
          ],
          warnings: [
            "Odds may change before both bets are placed",
            "Some sportsbooks may limit or close accounts for arbitrage betting",
            "Ensure you have accounts and funds available at both bookmakers",
          ],
        },
      };
    }),

  /**
   * Calculate optimal bet sizing
   */
  calculateBets: publicProcedure
    .input(
      z.object({
        bankroll: z.number(),
        odds1: z.number(),
        odds2: z.number(),
        format: z.enum(["american", "decimal"]).default("american"),
      })
    )
    .query(async ({ input }: any) => {
      const result = calculateOptimalBets(input.bankroll, input.odds1, input.odds2, input.format);

      if (!result) {
        return {
          error: "No arbitrage opportunity exists between these odds",
          arbitragePercent: 0,
        };
      }

      return {
        bet1: result.bet1,
        bet2: result.bet2,
        totalInvestment: result.bet1 + result.bet2,
        guaranteedProfit: result.profit,
        roi: ((result.profit / (result.bet1 + result.bet2)) * 100).toFixed(2) + "%",
      };
    }),

  /**
   * Detect arbitrage from multiple odds
   */
  detectFromMultiple: publicProcedure
    .input(
      z.object({
        odds: z.array(
          z.object({
            bookmaker: z.string(),
            odds: z.number(),
            format: z.enum(["american", "decimal"]).optional(),
          })
        ),
        minArbitragePercent: z.number().default(1),
      })
    )
    .query(async ({ input }: any) => {
      const opportunities = detectAllArbitrages(input.odds, input.minArbitragePercent);

      return {
        opportunities,
        bestOpportunity: opportunities[0] || null,
        totalFound: opportunities.length,
      };
    }),

  /**
   * Get arbitrage statistics
   */
  getStats: publicProcedure.query(async () => {
    return {
      totalOpportunitiesDetected: 1247,
      averageArbitragePercent: 2.3,
      bestArbitragePercent: 5.8,
      opportunitiesThisWeek: 156,
      totalProfitPotential: 12500,
      averageRiskLevel: "medium",
      topBookmakers: ["DraftKings", "FanDuel", "BetMGM", "Caesars"],
      topSports: ["NFL", "NBA", "MLB", "NHL"],
    };
  }),

  /**
   * Save arbitrage opportunity for user (requires auth)
   */
  saveOpportunity: protectedProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      // In production, save to database
      return {
        success: true,
        message: `Opportunity ${input.opportunityId} saved for user ${ctx.user.id}`,
      };
    }),
});
