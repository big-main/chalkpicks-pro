import { protectedProcedure, publicProcedure, router, premiumProcedure } from "../_core/trpc";
import { z } from "zod/v4";
import { getLiveScores, getNews, getAllSportsNews, getTopAthletes, type LiveGame, type NewsItem } from "../services/espnService";
import { getInjuries } from "../services/globalDataSite";
import { getDb } from "../db";
import { picks, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Real-time stats router using ESPN public API ────────────────────────────

export const statsRouter = router({
  liveGames: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba") }))
    .query(async ({ input }) => {
      const sport = input.sportKey as any;
      const games = await getLiveScores(sport);
      return games;
    }),

  allGames: publicProcedure.query(async () => {
    const sports = ["nfl", "nba", "mlb", "nhl"] as const;
    const results = await Promise.allSettled(
      sports.map(s => getLiveScores(s))
    );
    const allGames: LiveGame[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        allGames.push(...r.value.map(g => ({ ...g, sport: sports[i] })));
      }
    });
    return allGames;
  }),

  topPlayers: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba"), limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      const athletes = await getTopAthletes(input.sportKey as any);
      return athletes.slice(0, input.limit);
    }),

  news: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba"), limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const news = await getNews(input.sportKey as any);
      return news.slice(0, input.limit);
    }),

  allNews: publicProcedure.query(async () => {
    return await getAllSportsNews();
  }),

  // Real injury data from API-Sports.io (ESPN fallback) — see globalDataSite.ts.
  // Previously returned hand-typed fake players/timestamps to every premium
  // subscriber; that data never changed and wasn't sourced from any real feed.
  injuryReport: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl") }))
    .query(async ({ input }) => {
      try {
        return await getInjuries(input.sportKey);
      } catch {
        return [];
      }
    }),

  // Real platform stats computed from settled picks and registered users.
  // Previously hardcoded (73.1% win rate, +18.4% ROI, "12,847 members") and
  // exposed unconditionally via this public procedure — a compliance risk
  // since it's discoverable through the documented tRPC/OpenAPI surface.
  platformStats: publicProcedure.query(async () => {
    const EMPTY = { winRate: "0%", avgRoi: "0%", members: "0", picksGenerated: "0", sportStats: [] as { label: string; winRate: string; roi: string; games: string }[] };
    const db = await getDb();
    if (!db) return EMPTY;

    const [allPicks, allUsers] = await Promise.all([
      db.select({ result: picks.result, sportKey: picks.sportKey, odds: picks.odds }).from(picks).where(eq(picks.isActive, true)),
      db.select({ id: users.id }).from(users),
    ]);

    const settled = allPicks.filter(p => p.result !== "pending");
    const wins = settled.filter(p => p.result === "win").length;
    const losses = settled.filter(p => p.result === "loss").length;
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : 0;

    const unitProfit = (result: string, odds: number | null): number => {
      if (result === "push" || odds == null) return 0;
      if (result === "loss") return -1;
      return odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    };
    const roiFor = (rows: typeof settled): number => {
      const decided = rows.filter(p => p.result !== "push");
      if (decided.length === 0) return 0;
      const profit = decided.reduce((sum, p) => sum + unitProfit(p.result, p.odds), 0);
      return Math.round((profit / decided.length) * 1000) / 10;
    };

    const sportMap: Record<string, typeof settled> = {};
    for (const p of settled) (sportMap[p.sportKey.toUpperCase()] ??= []).push(p);
    const sportStats = Object.entries(sportMap).map(([sport, rows]) => {
      const w = rows.filter(p => p.result === "win").length;
      const l = rows.filter(p => p.result === "loss").length;
      return {
        label: sport,
        winRate: `${w + l > 0 ? Math.round((w / (w + l)) * 1000) / 10 : 0}%`,
        roi: `${roiFor(rows) >= 0 ? "+" : ""}${roiFor(rows)}%`,
        games: rows.length.toLocaleString(),
      };
    });

    return {
      winRate: `${winRate}%`,
      avgRoi: `${roiFor(settled) >= 0 ? "+" : ""}${roiFor(settled)}%`,
      members: allUsers.length.toLocaleString(),
      picksGenerated: allPicks.length.toLocaleString(),
      sportStats,
    };
  }),
});
