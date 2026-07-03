import { router, protectedProcedure } from "../\_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { arbitrageOpportunities, userArbitrageTrades } from "../../drizzle/schema";
import { eq, and, gt, lt, asc, desc, inArray } from "drizzle-orm";

// Helper: Convert American odds to decimal
const americanToDecimal = (odds: number): number => {
  if (odds > 0) {
    return 1 + odds / 100;
  } else {
    return 1 + 100 / Math.abs(odds);
  }
};

// Helper: Convert decimal odds to implied probability
const decimalToImpliedProbability = (decimalOdds: number): number => {
  return 1 / decimalOdds;
};

// Helper: Calculate arbitrage percentage
const calculateArbitrage = (probA: number, probB: number): number => {
  return probA + probB - 1;
};

// Helper: Calculate stakes for $100 investment
const calculateStakes = (oddsA: number, oddsB: number, totalStake: number = 100) => {
  const decimalA = americanToDecimal(oddsA);
  const decimalB = americanToDecimal(oddsB);
  
  const probA = decimalToImpliedProbability(decimalA);
  const probB = decimalToImpliedProbability(decimalB);
  
  const stakeA = (totalStake * probB) / (probA + probB);
  const stakeB = totalStake - stakeA;
  
  const winningsA = stakeA * decimalA;
  const winningsB = stakeB * decimalB;
  const guaranteedProfit = Math.min(winningsA, winningsB) - totalStake;
  
  return {
    stakeA: Math.round(stakeA * 100) / 100,
    stakeB: Math.round(stakeB * 100) / 100,
    guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
    profitPercentage: Math.round((guaranteedProfit / totalStake) * 10000) / 10000,
  };
};

export const arbitrageRouter = router({
  // Get all active arbitrage opportunities with advanced filtering
  getOpportunities: protectedProcedure
    .input(
      z.object({
        sports: z.array(z.string()).default([]),
        sportsbooks: z.array(z.string()).default([]),
        minProfitMargin: z.number().default(0.5),
        maxProfitMargin: z.number().default(5),
        minGuaranteedProfit: z.number().default(10),
        eventTimeRange: z.enum(["today", "this_week", "this_month", "all"]).default("all"),
        sortBy: z.enum(["profit_desc", "profit_asc", "margin_desc", "margin_asc", "time_asc"]).default("profit_desc"),
        onlyActive: z.boolean().default(true),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check subscription tier - only paid tiers get access
      if (ctx.user.subscriptionTier === "free") {
        throw new Error("Arbitrage Finder requires a paid subscription");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const now = new Date();
      const conditions = [];
      
      // Active status
      if (input.onlyActive) {
        conditions.push(eq(arbitrageOpportunities.isActive, true));
        conditions.push(gt(arbitrageOpportunities.expiresAt, now));
      }
      
      // Profit margin range
      conditions.push(gt(arbitrageOpportunities.arbitragePercentage, String(input.minProfitMargin / 100)));
      conditions.push(lt(arbitrageOpportunities.arbitragePercentage, String(input.maxProfitMargin / 100)));
      
      // Guaranteed profit minimum
      conditions.push(gt(arbitrageOpportunities.guaranteedProfit, String(input.minGuaranteedProfit)));
      
      // Sports filter
      if (input.sports.length > 0) {
        conditions.push(inArray(arbitrageOpportunities.sport, input.sports));
      }
      
      // Event time range
      if (input.eventTimeRange !== "all") {
        const today = new Date();
        let startDate = new Date();
        
        if (input.eventTimeRange === "today") {
          startDate.setHours(0, 0, 0, 0);
        } else if (input.eventTimeRange === "this_week") {
          startDate.setDate(startDate.getDate() - startDate.getDay());
        } else if (input.eventTimeRange === "this_month") {
          startDate.setDate(1);
        }
        
        conditions.push(gt(arbitrageOpportunities.eventTime, startDate));
      }
      
      // Build base query
      let baseQuery = db
        .select()
        .from(arbitrageOpportunities)
        .where(and(...conditions));
      
      // Apply sorting
      let query: any = baseQuery;
      if (input.sortBy === "profit_desc") {
        query = baseQuery.orderBy(desc(arbitrageOpportunities.guaranteedProfit));
      } else if (input.sortBy === "profit_asc") {
        query = baseQuery.orderBy(asc(arbitrageOpportunities.guaranteedProfit));
      } else if (input.sortBy === "margin_desc") {
        query = baseQuery.orderBy(desc(arbitrageOpportunities.arbitragePercentage));
      } else if (input.sortBy === "margin_asc") {
        query = baseQuery.orderBy(asc(arbitrageOpportunities.arbitragePercentage));
      } else if (input.sortBy === "time_asc") {
        query = baseQuery.orderBy(asc(arbitrageOpportunities.eventTime));
      } else {
        query = baseQuery;
      }

      const opportunities = await query.limit(input.limit);
      return opportunities.map((opp: any) => ({
        ...opp,
        arbitragePercentage: Number(opp.arbitragePercentage),
        profitPercentage: Number(opp.profitPercentage),
        stakeA: Number(opp.stakeA),
        stakeB: Number(opp.stakeB),
        guaranteedProfit: Number(opp.guaranteedProfit),
        oddsA: Number(opp.oddsA),
        oddsB: Number(opp.oddsB),
        source: String(opp.source ?? "api"), // Include source (heartbeat-cron or heartbeat-cron+oddsportal)
      }));
    }),

  // Get single arbitrage opportunity details
  getOpportunity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.subscriptionTier === "free") {
        throw new Error("Arbitrage Finder requires a paid subscription");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const opp = await db
        .select()
        .from(arbitrageOpportunities)
        .where(eq(arbitrageOpportunities.id, input.id))
        .limit(1);

      if (!opp.length) {
        throw new Error("Arbitrage opportunity not found");
      }

      return {
        ...opp[0],
        arbitragePercentage: Number(opp[0].arbitragePercentage),
        profitPercentage: Number(opp[0].profitPercentage),
        stakeA: Number(opp[0].stakeA),
        stakeB: Number(opp[0].stakeB),
        guaranteedProfit: Number(opp[0].guaranteedProfit),
        oddsA: Number(opp[0].oddsA),
        oddsB: Number(opp[0].oddsB),
        source: String(opp[0].source ?? "api"), // Include source
      };
    }),

  // Calculate custom arbitrage stakes
  calculateStakes: protectedProcedure
    .input(
      z.object({
        oddsA: z.number(),
        oddsB: z.number(),
        totalStake: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.subscriptionTier === "free") {
        throw new Error("Arbitrage Finder requires a paid subscription");
      }

      const decimalA = americanToDecimal(input.oddsA);
      const decimalB = americanToDecimal(input.oddsB);

      const probA = decimalToImpliedProbability(decimalA);
      const probB = decimalToImpliedProbability(decimalB);

      const arbitragePercentage = calculateArbitrage(probA, probB);

      if (arbitragePercentage <= 0) {
        throw new Error("No arbitrage opportunity exists for these odds");
      }

      return calculateStakes(input.oddsA, input.oddsB, input.totalStake);
    }),

  // Record a user's arbitrage trade
  recordTrade: protectedProcedure
    .input(
      z.object({
        arbitrageId: z.number(),
        stakeA: z.number(),
        stakeB: z.number(),
        bookABetId: z.string().optional(),
        bookBBetId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.subscriptionTier === "free") {
        throw new Error("Arbitrage Finder requires a paid subscription");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(userArbitrageTrades).values({
        userId: ctx.user.id,
        arbitrageId: input.arbitrageId,
        stakeA: String(input.stakeA),
        stakeB: String(input.stakeB),
        totalStake: String(input.stakeA + input.stakeB),
        bookABetId: input.bookABetId,
        bookBBetId: input.bookBBetId,
        status: "pending",
      });

      return { success: true, tradeId: (result as any).insertId || 0 };
    }),

  // Get user's arbitrage trades
  getUserTrades: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "executed", "completed", "failed"]).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.subscriptionTier === "free") {
        throw new Error("Arbitrage Finder requires a paid subscription");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(userArbitrageTrades.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(userArbitrageTrades.status, input.status));
      }

      const trades = await db
        .select()
        .from(userArbitrageTrades)
        .where(and(...conditions))
        .limit(input.limit);
      return trades.map((trade) => ({
        ...trade,
        stakeA: Number(trade.stakeA),
        stakeB: Number(trade.stakeB),
        totalStake: Number(trade.totalStake),
        winningsA: trade.winningsA ? Number(trade.winningsA) : null,
        winningsB: trade.winningsB ? Number(trade.winningsB) : null,
        totalWinnings: trade.totalWinnings ? Number(trade.totalWinnings) : null,
        actualProfit: trade.actualProfit ? Number(trade.actualProfit) : null,
      }));
    }),

  // Get arbitrage statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.subscriptionTier === "free") {
      throw new Error("Arbitrage Finder requires a paid subscription");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const trades = await db
      .select()
      .from(userArbitrageTrades)
      .where(eq(userArbitrageTrades.userId, ctx.user.id));

    const completedTrades = trades.filter((t) => t.status === "completed");
    const totalProfit = completedTrades.reduce(
      (sum, t) => sum + (t.actualProfit ? Number(t.actualProfit) : 0),
      0
    );

    return {
      totalTrades: trades.length,
      completedTrades: completedTrades.length,
      pendingTrades: trades.filter((t) => t.status === "pending").length,
      executedTrades: trades.filter((t) => t.status === "executed").length,
      failedTrades: trades.filter((t) => t.status === "failed").length,
      totalStaked: trades.reduce((sum, t) => sum + Number(t.totalStake), 0),
      totalProfit,
      averageProfit: completedTrades.length > 0 ? totalProfit / completedTrades.length : 0,
    };
  }),
});
