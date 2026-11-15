import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getAllSportsNews, getNews } from "../services/espnService";

const sportSchema = z.enum(["all", "nfl", "nba", "mlb", "nhl"]);

/**
 * Admin review feed for breaking sports-news research.
 * This is deliberately read-only: articles are source-linked and are never
 * auto-published as picks or social posts from this router.
 */
export const newsRadarRouter = router({
  latest: adminProcedure
    .input(z.object({ sport: sportSchema.default("all") }).optional())
    .query(async ({ input }) => {
      const sport = input?.sport ?? "all";
      const items =
        sport === "all" ? await getAllSportsNews() : await getNews(sport);

      return {
        items,
        sport,
        fetchedAt: new Date().toISOString(),
        source: "ESPN",
        autoPublish: false,
      };
    }),
});
