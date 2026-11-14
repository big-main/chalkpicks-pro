import { z } from "zod";
import { notifyOwner } from "./notification";
import { getLlmStatus } from "./llm";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { users, picks, newsletterSubscribers } from "../../drizzle/schema";
import { sql, eq } from "drizzle-orm";

type SiteStats = {
  totalMembers: number;
  paidSubscribers: number;
  totalPicksGenerated: number;
  picksToday: number;
  winRate: number;
  newsletterSubscribers: number;
};

let siteStatsCache: { expiresAt: number; value: SiteStats } | null = null;

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  llmStatus: publicProcedure.query(() => {
    return getLlmStatus();
  }),

  /**
   * Public site-wide stats for social proof on Home + Pricing pages.
   * Cached-friendly: returns real DB counts with graceful fallback.
   */
  siteStats: publicProcedure.query(async () => {
    const FALLBACK = {
      totalMembers: 0,
      paidSubscribers: 0,
      totalPicksGenerated: 0,
      picksToday: 0,
      winRate: 0,
      newsletterSubscribers: 0,
    };
    if (siteStatsCache && siteStatsCache.expiresAt > Date.now()) {
      return siteStatsCache.value;
    }

    try {
      const db = await getDb();
      if (!db) return FALLBACK;

      const today = new Date().toISOString().split("T")[0];

      const [
        memberResult,
        paidResult,
        picksResult,
        picksTodayResult,
        settledResult,
        newsletterResult,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            sql`${users.subscriptionTier} IN ('daily', 'monthly', 'yearly') AND ${users.subscriptionExpiresAt} > UTC_TIMESTAMP()`
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(picks)
          .where(eq(picks.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(picks)
          .where(sql`${picks.isActive} = 1 AND ${picks.pickDate} = ${today}`),
        db
          .select({
            wins: sql<number>`sum(case when ${picks.result} = 'win' then 1 else 0 end)`,
            losses: sql<number>`sum(case when ${picks.result} = 'loss' then 1 else 0 end)`,
          })
          .from(picks)
          .where(
            sql`${picks.isActive} = 1 AND ${picks.result} IN ('win','loss')`
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.status, "active")),
      ]);

      const totalMembers = Number(memberResult[0]?.count ?? 0);
      const paidSubscribers = Number(paidResult[0]?.count ?? 0);
      const totalPicksGenerated = Number(picksResult[0]?.count ?? 0);
      const picksToday = Number(picksTodayResult[0]?.count ?? 0);
      const newsletterSubs = Number(newsletterResult[0]?.count ?? 0);

      const wins = Number(settledResult[0]?.wins ?? 0);
      const losses = Number(settledResult[0]?.losses ?? 0);
      const total = wins + losses;
      const winRate =
        total > 0 ? Math.round((wins / total) * 1000) / 10 : FALLBACK.winRate;

      const value: SiteStats = {
        totalMembers,
        paidSubscribers,
        totalPicksGenerated,
        picksToday,
        winRate,
        newsletterSubscribers: newsletterSubs,
      };
      siteStatsCache = { expiresAt: Date.now() + 60_000, value };
      return value;
    } catch {
      return FALLBACK;
    }
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
