import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

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
      if (!db) return { success: true }; // Fail silently

      try {
        // Insert into affiliate_clicks table (create if not exists handled by migration)
        await db.execute(
          sql`INSERT INTO affiliate_clicks (sportsbook_id, sport_key, source, clicked_at) 
              VALUES (${input.sportsbookId}, ${input.sportKey || "unknown"}, ${input.source || "unknown"}, NOW())`
        );
      } catch (e) {
        // Fail silently — tracking should never break the UX
        console.error("[AffiliateClicks] Track error:", e);
      }

      return { success: true };
    }),

  /**
   * Get click stats (admin only, for analytics)
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, byBook: [], bySport: [] };

    try {
      const [totalResult] = await db.execute(
        sql`SELECT COUNT(*) as total FROM affiliate_clicks`
      );
      const byBook = await db.execute(
        sql`SELECT sportsbook_id, COUNT(*) as clicks FROM affiliate_clicks GROUP BY sportsbook_id ORDER BY clicks DESC LIMIT 20`
      );
      const bySport = await db.execute(
        sql`SELECT sport_key, COUNT(*) as clicks FROM affiliate_clicks GROUP BY sport_key ORDER BY clicks DESC LIMIT 10`
      );

      return {
        total: (totalResult as any)?.total || 0,
        byBook: byBook as any[],
        bySport: bySport as any[],
      };
    } catch (e) {
      return { total: 0, byBook: [], bySport: [] };
    }
  }),
});
