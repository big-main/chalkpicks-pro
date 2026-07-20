/**
 * Tools Router — Prop Builder, Line Movement, Correlation Finder
 * All tools consume credits per use and return real/cached data.
 */
import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, premiumProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  fetchOdds,
  fetchPlayerProps,
  fetchLiveScores,
  trackLineMovement,
  calculateEV,
  findCorrelations,
  cache,
  type OddsEvent,
  type PlayerProp,
  type LineMovement,
  type CorrelationPair,
} from "../services/dataService";

// Credit costs per tool use
const CREDIT_COSTS = {
  propBuilder: 2,
  lineMovement: 1,
  correlationFinder: 3,
  evFinder: 1,
  liveScores: 0, // Free
} as const;

// Helper: deduct credits from user
async function deductCredits(userId: number, amount: number): Promise<{ success: boolean; remaining: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [user] = await db.select({ balance: users.accountBalance }).from(users).where(eq(users.id, userId));
  const currentBalance = parseFloat(String(user?.balance || "0"));
  
  if (currentBalance < amount) {
    return { success: false, remaining: currentBalance };
  }

  const newBalance = (currentBalance - amount).toFixed(2);
  await db.update(users).set({ accountBalance: newBalance } as any).where(eq(users.id, userId));
  return { success: true, remaining: parseFloat(newBalance) };
}

export const toolsRouter = router({
  // ─── Get Credit Balance ─────────────────────────────────────────────────
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [user] = await db.select({ balance: users.accountBalance }).from(users).where(eq(users.id, ctx.user.id as number));
    return { balance: parseFloat(String(user?.balance || "0")) };
  }),

  // ─── Prop Builder ───────────────────────────────────────────────────────
  propBuilder: premiumProcedure
    .input(z.object({
      sport: z.enum(["nba", "nfl", "mlb", "nhl"]),
      playerName: z.string().optional(),
      market: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Deduct credits
      const deduction = await deductCredits(ctx.user.id as number, CREDIT_COSTS.propBuilder);
      if (!deduction.success) {
        return { 
          error: "insufficient_credits", 
          required: CREDIT_COSTS.propBuilder, 
          balance: deduction.remaining,
          data: null 
        };
      }

      const props = await fetchPlayerProps(input.sport);
      
      // Filter by player name if provided
      let filtered = props;
      if (input.playerName) {
        filtered = props.filter(p => 
          p.playerName.toLowerCase().includes(input.playerName!.toLowerCase())
        );
      }
      if (input.market) {
        filtered = filtered.filter(p => p.market === input.market);
      }

      return {
        error: null,
        balance: deduction.remaining,
        creditUsed: CREDIT_COSTS.propBuilder,
        data: {
          props: filtered.slice(0, 20),
          topPicks: filtered.filter(p => p.ev > 3).slice(0, 5),
          totalAnalyzed: props.length,
          sport: input.sport,
          generatedAt: new Date().toISOString(),
        },
      };
    }),

  // ─── Line Movement Tracker ──────────────────────────────────────────────
  lineMovement: premiumProcedure
    .input(z.object({
      sport: z.enum(["nba", "nfl", "mlb", "nhl"]),
      sharpOnly: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const deduction = await deductCredits(ctx.user.id as number, CREDIT_COSTS.lineMovement);
      if (!deduction.success) {
        return { 
          error: "insufficient_credits", 
          required: CREDIT_COSTS.lineMovement, 
          balance: deduction.remaining,
          data: null 
        };
      }

      const events = await fetchOdds(input.sport);
      const movements = trackLineMovement(events);
      
      let filtered = movements;
      if (input.sharpOnly) {
        filtered = movements.filter(m => m.isSharpMove);
      }

      return {
        error: null,
        balance: deduction.remaining,
        creditUsed: CREDIT_COSTS.lineMovement,
        data: {
          movements: filtered.slice(0, 30),
          sharpMoves: movements.filter(m => m.isSharpMove).length,
          totalTracked: movements.length,
          sport: input.sport,
          generatedAt: new Date().toISOString(),
        },
      };
    }),

  // ─── Correlation Finder ─────────────────────────────────────────────────
  correlationFinder: premiumProcedure
    .input(z.object({
      sport: z.enum(["nba", "nfl", "mlb", "nhl"]),
      minCorrelation: z.number().min(0).max(1).optional().default(0.3),
    }))
    .mutation(async ({ ctx, input }) => {
      const deduction = await deductCredits(ctx.user.id as number, CREDIT_COSTS.correlationFinder);
      if (!deduction.success) {
        return { 
          error: "insufficient_credits", 
          required: CREDIT_COSTS.correlationFinder, 
          balance: deduction.remaining,
          data: null 
        };
      }

      const events = await fetchOdds(input.sport);
      const correlations = findCorrelations(input.sport, events);
      
      const filtered = correlations.filter(c => Math.abs(c.correlation) >= input.minCorrelation);

      return {
        error: null,
        balance: deduction.remaining,
        creditUsed: CREDIT_COSTS.correlationFinder,
        data: {
          correlations: filtered,
          strongPairs: filtered.filter(c => c.recommendation === "strong_corr").length,
          totalAnalyzed: correlations.length,
          sport: input.sport,
          generatedAt: new Date().toISOString(),
        },
      };
    }),

  // ─── Enhanced EV Finder ─────────────────────────────────────────────────
  evFinder: premiumProcedure
    .input(z.object({
      sport: z.enum(["nba", "nfl", "mlb", "nhl"]),
      minEV: z.number().optional().default(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const deduction = await deductCredits(ctx.user.id as number, CREDIT_COSTS.evFinder);
      if (!deduction.success) {
        return { 
          error: "insufficient_credits", 
          required: CREDIT_COSTS.evFinder, 
          balance: deduction.remaining,
          data: null 
        };
      }

      const events = await fetchOdds(input.sport, "h2h,spreads,totals");
      const evBets = calculateEV(events);
      
      const filtered = evBets.filter(b => b.ev >= input.minEV);

      return {
        error: null,
        balance: deduction.remaining,
        creditUsed: CREDIT_COSTS.evFinder,
        data: {
          bets: filtered.slice(0, 20).map(b => ({
            matchup: `${b.event.awayTeam} @ ${b.event.homeTeam}`,
            market: b.market,
            outcome: b.outcome,
            bestOdds: b.bestOdds,
            bestBook: b.bestBook,
            fairOdds: b.fairOdds,
            ev: Math.round(b.ev * 100) / 100,
            kellyBetSize: Math.round(b.kellyBetSize * 10) / 10,
            commenceTime: b.event.commenceTime,
          })),
          totalFound: evBets.length,
          sport: input.sport,
          generatedAt: new Date().toISOString(),
        },
      };
    }),

  // ─── Live Scores (Free) ─────────────────────────────────────────────────
  liveScores: publicProcedure
    .input(z.object({
      sport: z.enum(["nba", "nfl", "mlb", "nhl"]),
    }))
    .query(async ({ input }) => {
      const scores = await fetchLiveScores(input.sport);
      return { scores, generatedAt: new Date().toISOString() };
    }),

  // ─── Cache Stats (Admin) ────────────────────────────────────────────────
  cacheStats: protectedProcedure.query(async () => {
    return cache.stats();
  }),

  // ─── Credit Costs Info ──────────────────────────────────────────────────
  getCreditCosts: publicProcedure.query(() => {
    return CREDIT_COSTS;
  }),
});
