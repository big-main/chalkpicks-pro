import { router, protectedProcedure } from "../trpc";
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

      // Check if pick exists
      const pick = await db.query.picks.findFirst({
        where: eq(picks.id, input.pickId),
      });

      if (!pick) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pick not found",
        });
      }

      // Check if already tracked
      const existing = await db.query.userPickTracking.findFirst({
        where: and(
          eq(userPickTracking.userId, ctx.user.id),
          eq(userPickTracking.pickId, input.pickId)
        ),
      });

      if (existing) {
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
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

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
    .query(async ({ ctx, input }) => {
      // Users can only view their own tracked picks
      if (input.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot view other users' tracked picks",
        });
      }

      const db = await getDb();

      const tracked = await db.query.userPickTracking.findMany({
        where: eq(userPickTracking.userId, ctx.user.id),
        with: {
          pick: true,
        },
        orderBy: (table, { desc }) => [desc(table.addedAt)],
      });

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
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

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

    const tracked = await db.query.userPickTracking.findMany({
      where: eq(userPickTracking.userId, ctx.user.id),
      with: {
        pick: true,
      },
    });

    const totalPicks = tracked.length;
    const wonPicks = tracked.filter((t: any) => t.pick.result === "win");
    const lostPicks = tracked.filter((t: any) => t.pick.result === "loss");
    const pushedPicks = tracked.filter((t: any) => t.pick.result === "push");
    const pendingPicks = tracked.filter((t: any) => t.pick.result === "pending");

    const wins = wonPicks.length;
    const losses = lostPicks.length;
    const pushes = pushedPicks.length;
    const pending = pendingPicks.length;

    const decidedPicks = totalPicks - pushes;
    const winRate = decidedPicks > 0 ? (wins / decidedPicks) * 100 : 0;

    // Calculate P&L (simplified: 1 unit per pick)
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
