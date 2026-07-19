import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Estimated commission per referred depositor per book (USD)
const ESTIMATED_CPA: Record<string, number> = {
  draftkings: 200,
  fanduel: 175,
  betmgm: 250,
  caesars: 200,
  espnbet: 150,
  bet365: 100,
  pointsbet: 150,
  betrivers: 125,
  bovada: 75,
  mybookie: 80,
  betonline: 75,
};

const DEFAULT_CPA = 100;

/**
 * Affiliate Clicks Router
 *
 * Tracks clicks on sportsbook affiliate links for analytics.
 * This data helps understand which books users prefer and
 * can be used for revenue attribution.
 */
export const affiliateClicksRouter = router({
  /**
   * Track an affiliate click (fire-and-forget, no auth required)
   */
  track: publicProcedure
    .input(
      z.object({
        sportsbookId: z.string(),
        sportKey: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };

      try {
        await db.execute(
          sql`INSERT INTO affiliate_clicks (sportsbook_id, sport_key, source, clicked_at)
              VALUES (${input.sportsbookId}, ${input.sportKey || "unknown"}, ${input.source || "unknown"}, NOW())`
        );
      } catch (e) {
        console.error("[AffiliateClicks] Track error:", e);
      }

      return { success: true };
    }),

  /**
   * Get total click stats by sportsbook (admin only)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) return { total: 0, byBook: [], bySport: [], bySource: [], daily: [] };

    try {
      const totalRows = await db.execute(sql`SELECT COUNT(*) as total FROM affiliate_clicks`);
      const total = Number((totalRows as any[])[0]?.total ?? 0);

      const byBook = await db.execute(
        sql`SELECT sportsbook_id, COUNT(*) as clicks
            FROM affiliate_clicks
            GROUP BY sportsbook_id
            ORDER BY clicks DESC
            LIMIT 20`
      );

      const bySport = await db.execute(
        sql`SELECT sport_key, COUNT(*) as clicks
            FROM affiliate_clicks
            WHERE sport_key != 'unknown'
            GROUP BY sport_key
            ORDER BY clicks DESC
            LIMIT 10`
      );

      const bySource = await db.execute(
        sql`SELECT source, COUNT(*) as clicks
            FROM affiliate_clicks
            GROUP BY source
            ORDER BY clicks DESC
            LIMIT 10`
      );

      // Last 30 days daily trend
      const daily = await db.execute(
        sql`SELECT DATE(clicked_at) as date, COUNT(*) as clicks
            FROM affiliate_clicks
            WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(clicked_at)
            ORDER BY date ASC`
      );

      // Enrich byBook with estimated revenue
      const byBookEnriched = (byBook as any[]).map((row: any) => ({
        sportsbookId: row.sportsbook_id,
        clicks: Number(row.clicks),
        estimatedCpa: ESTIMATED_CPA[row.sportsbook_id] ?? DEFAULT_CPA,
        // Rough estimate: ~2% of clicks convert to depositors
        estimatedRevenue: Math.round(Number(row.clicks) * 0.02 * (ESTIMATED_CPA[row.sportsbook_id] ?? DEFAULT_CPA)),
      }));

      const totalEstimatedRevenue = byBookEnriched.reduce((sum, b) => sum + b.estimatedRevenue, 0);

      return {
        total,
        totalEstimatedRevenue,
        byBook: byBookEnriched,
        bySport: (bySport as any[]).map((r: any) => ({ sportKey: r.sport_key, clicks: Number(r.clicks) })),
        bySource: (bySource as any[]).map((r: any) => ({ source: r.source, clicks: Number(r.clicks) })),
        daily: (daily as any[]).map((r: any) => ({ date: r.date, clicks: Number(r.clicks) })),
      };
    } catch (e) {
      console.error("[AffiliateClicks] getStats error:", e);
      return { total: 0, totalEstimatedRevenue: 0, byBook: [], bySport: [], bySource: [], daily: [] };
    }
  }),

  /**
   * Get click count for the last 7 days (lightweight, for dashboard widgets)
   */
  getRecentCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) return { count7d: 0, count30d: 0 };

    try {
      const [row7d] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM affiliate_clicks WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ) as any[];
      const [row30d] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM affiliate_clicks WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      ) as any[];

      return {
        count7d: Number(row7d?.cnt ?? 0),
        count30d: Number(row30d?.cnt ?? 0),
      };
    } catch (e) {
      return { count7d: 0, count30d: 0 };
    }
  }),
});
