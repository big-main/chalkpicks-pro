import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { userPickTracking, picks } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const trackingRouter = router({
  /**
   * Add a pick to user's tracked list
   */
  addToTracked: protectedProcedure
    .input(
      z.object({
        pickId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if pick exists
      const pickRows = await db.select().from(picks).where(eq(picks.id, input.pickId)).limit(1);
      if (!pickRows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pick not found" });
      }

      // Check if already tracked
      const existingRows = await db
        .select()
        .from(userPickTracking)
        .where(
          and(
            eq(userPickTracking.userId, ctx.user.id),
            eq(userPickTracking.pickId, input.pickId)
          )
        )
        .limit(1);

      if (existingRows.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Pick already tracked" });
      }

      // Add to tracked
      await db.insert(userPickTracking).values({
        userId: ctx.user.id,
        pickId: input.pickId,
        notes: input.notes ?? null,
        addedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Remove a pick from user's tracked list
   */
  removeFromTracked: protectedProcedure
    .input(
      z.object({
        pickId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.delete(userPickTracking).where(
        and(
          eq(userPickTracking.userId, ctx.user.id),
          eq(userPickTracking.pickId, input.pickId)
        )
      );

      return { success: true };
    }),

  /**
   * Get all tracked picks for the current user (with pick data joined)
   */
  getTrackedPicks: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Users can only view their own tracked picks
      if (input.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot view other users' tracked picks" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Join userPickTracking with picks
      const rows = await db
        .select({
          id: userPickTracking.id,
          userId: userPickTracking.userId,
          pickId: userPickTracking.pickId,
          notes: userPickTracking.notes,
          addedAt: userPickTracking.addedAt,
          pick: {
            id: picks.id,
            sportKey: picks.sportKey,
            homeTeam: picks.homeTeam,
            awayTeam: picks.awayTeam,
            recommendation: picks.recommendation,
            confidenceScore: picks.confidenceScore,
            edgeScore: picks.edgeScore,
            odds: picks.odds,
            pickType: picks.pickType,
            pickDate: picks.pickDate,
            result: picks.result,
            aiAnalysis: picks.aiAnalysis,
            tier: picks.tier,
            isActive: picks.isActive,
          },
        })
        .from(userPickTracking)
        .innerJoin(picks, eq(userPickTracking.pickId, picks.id))
        .where(eq(userPickTracking.userId, ctx.user.id))
        .orderBy(userPickTracking.addedAt);

      return rows;
    }),

  /**
   * Update notes on a tracked pick
   */
  updateTrackedNotes: protectedProcedure
    .input(
      z.object({
        pickId: z.number(),
        notes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(userPickTracking)
        .set({ notes: input.notes })
        .where(
          and(
            eq(userPickTracking.userId, ctx.user.id),
            eq(userPickTracking.pickId, input.pickId)
          )
        );

      return { success: true };
    }),

  /**
   * Get performance stats for tracked picks
   */
  getTrackedStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const rows = await db
      .select({
        result: picks.result,
      })
      .from(userPickTracking)
      .innerJoin(picks, eq(userPickTracking.pickId, picks.id))
      .where(eq(userPickTracking.userId, ctx.user.id));

    const totalPicks = rows.length;
    const wins = rows.filter((r) => r.result === "win").length;
    const losses = rows.filter((r) => r.result === "loss").length;
    const pushes = rows.filter((r) => r.result === "push").length;
    const pending = rows.filter((r) => !r.result || r.result === "pending").length;

    const decidedPicks = wins + losses;
    const winRate = decidedPicks > 0 ? (wins / decidedPicks) * 100 : 0;
    const pnl = wins - losses;

    return {
      totalPicks,
      wins,
      losses,
      pushes,
      pending,
      winRate: winRate.toFixed(1),
      pnl,
    };
  }),
});
