import {
  protectedProcedure,
  publicProcedure,
  router,
  premiumProcedure,
} from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { leaderboard, users } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

export const leaderboardRouter = router({
  list: premiumProcedure
    .input(
      z.object({
        period: z.enum(["all", "monthly", "weekly"]).optional().default("all"),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const entries = await db
        .select({
          id: leaderboard.id,
          userId: leaderboard.userId,
          displayName: leaderboard.displayName,
          totalBets: leaderboard.totalBets,
          wins: leaderboard.wins,
          losses: leaderboard.losses,
          winRate: leaderboard.winRate,
          roi: leaderboard.roi,
          totalProfit: leaderboard.totalProfit,
          streak: leaderboard.streak,
          rank: leaderboard.rank,
          badge: leaderboard.badge,
        })
        .from(leaderboard)
        .orderBy(desc(leaderboard.roi))
        .limit(input.limit);

      return entries;
    }),

  myRank: premiumProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const entry = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.userId, ctx.user.id))
      .limit(1);
    return entry[0] ?? null;
  }),

  // Public profile lookup by displayName — powers /leaderboard/:username sharing
  getByUsername: publicProcedure
    .input(z.object({ displayName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [entry] = await db
        .select({
          id: leaderboard.id,
          userId: leaderboard.userId,
          displayName: leaderboard.displayName,
          totalBets: leaderboard.totalBets,
          wins: leaderboard.wins,
          losses: leaderboard.losses,
          winRate: leaderboard.winRate,
          roi: leaderboard.roi,
          totalProfit: leaderboard.totalProfit,
          streak: leaderboard.streak,
          rank: leaderboard.rank,
          badge: leaderboard.badge,
        })
        .from(leaderboard)
        .where(eq(leaderboard.displayName, input.displayName))
        .limit(1);
      return entry ?? null;
    }),

  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalBettors: 0,
        avgWinRate: 0,
        avgRoi: 0,
        topROI: 0,
        totalPicksTracked: 0,
      };
    }

    const [summary] = await db
      .select({
        totalBettors: sql<number>`count(*)`,
        wins: sql<number>`coalesce(sum(${leaderboard.wins}), 0)`,
        losses: sql<number>`coalesce(sum(${leaderboard.losses}), 0)`,
        totalPicksTracked: sql<number>`coalesce(sum(${leaderboard.totalBets}), 0)`,
        avgRoi: sql<number>`coalesce(avg(${leaderboard.roi}), 0)`,
        topROI: sql<number>`coalesce(max(${leaderboard.roi}), 0)`,
      })
      .from(leaderboard);

    const wins = Number(summary?.wins ?? 0);
    const losses = Number(summary?.losses ?? 0);
    const gradedPicks = wins + losses;

    return {
      totalBettors: Number(summary?.totalBettors ?? 0),
      avgWinRate:
        gradedPicks > 0 ? Math.round((wins / gradedPicks) * 1000) / 10 : 0,
      avgRoi: Number(summary?.avgRoi ?? 0),
      topROI: Number(summary?.topROI ?? 0),
      totalPicksTracked: Number(summary?.totalPicksTracked ?? 0),
    };
  }),
});
