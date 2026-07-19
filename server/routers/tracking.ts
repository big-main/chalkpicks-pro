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
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Check if pick exists
      const pick = await db.select().from(picks).where(eq(picks.id, input.pickId)).limit(1);

      if (!pick || pick.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pick not found",
        });
      }

      // Check if already tracked
      const existing = await db.select().from(userPickTracking).where(
        and(
          eq(userPickTracking.userId, ctx.user.id),
          eq(userPickTracking.pickId, input.pickId)
        )
      ).limit(1);

      if (existing && existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Pick already tracked",
        });
      }

      // Add to tracked
      const result = await db.insert(userPickTracking).values({
        userId: ctx.user.id,
        pickId: input.pickId,
        notes: input.notes,
        addedAt: new Date(),
      });

      return { success: true, id: result[0] };
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
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db.delete(userPickTracking).where(
        and(
          eq(userPickTracking.userId, ctx.user.id),
          eq(userPickTracking.pickId, input.pickId)
        )
      );

      return { success: true };
    }),

  /**
   * Get all tracked picks for the current user
   */
  getTrackedPicks: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      // Users can only view their own tracked picks
      if (input.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot view other users' tracked picks",
        });
      }

      const db = await getDb();
      if (!db) return [];

      const tracked = await db
        .select()
        .from(userPickTracking)
        .where(eq(userPickTracking.userId, ctx.user.id));

      return tracked;
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
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

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
  getTrackedStats: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) return { totalPicks: 0, wins: 0, losses: 0, pushes: 0, pending: 0, winRate: '0', pnl: 0 };

    const tracked = await db
      .select()
      .from(userPickTracking)
      .where(eq(userPickTracking.userId, ctx.user.id));

    // For now, return basic stats from tracked picks table
    // In a real implementation, you'd join with picks table to get result data
    const totalPicks = tracked.length;

    return {
      totalPicks,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      winRate: '0',
      pnl: 0,
    };
  }),
});
