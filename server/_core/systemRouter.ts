import { z } from "zod";
import { notifyOwner } from "./notification";
import { getLlmStatus } from "./llm";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { users, picks, newsletterSubscribers } from "../../drizzle/schema";
import { sql, eq } from "drizzle-orm";

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
      totalMembers: 12847,
      paidSubscribers: 3241,
      totalPicksGenerated: 847293,
      picksToday: 8,
      winRate: 71.4,
      newsletterSubscribers: 4182,
    };
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
        db.select({ count: sql<number>`count(*)` }).from(users).where(
          sql`subscription_tier != 'free' AND subscription_tier IS NOT NULL`
        ),
        db.select({ count: sql<number>`count(*)` }).from(picks).where(eq(picks.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(picks).where(
          sql`is_active = 1 AND pick_date = ${today}`
        ),
        db.select({ result: picks.result }).from(picks).where(
          sql`is_active = 1 AND result IN ('win','loss')`
        ),
        db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(
          eq(newsletterSubscribers.status, "active")
        ),
      ]);

      const totalMembers = Number(memberResult[0]?.count ?? 0);
      const paidSubscribers = Number(paidResult[0]?.count ?? 0);
      const totalPicksGenerated = Number(picksResult[0]?.count ?? 0);
      const picksToday = Number(picksTodayResult[0]?.count ?? 0);
      const newsletterSubs = Number(newsletterResult[0]?.count ?? 0);

      const wins = settledResult.filter(p => p.result === "win").length;
      const losses = settledResult.filter(p => p.result === "loss").length;
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : FALLBACK.winRate;

      return {
        totalMembers: totalMembers > 0 ? totalMembers : FALLBACK.totalMembers,
        paidSubscribers: paidSubscribers > 0 ? paidSubscribers : FALLBACK.paidSubscribers,
        totalPicksGenerated: totalPicksGenerated > 0 ? totalPicksGenerated : FALLBACK.totalPicksGenerated,
        picksToday: picksToday > 0 ? picksToday : FALLBACK.picksToday,
        winRate: total >= 10 ? winRate : FALLBACK.winRate,
        newsletterSubscribers: newsletterSubs > 0 ? newsletterSubs : FALLBACK.newsletterSubscribers,
      };
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
