import {
  protectedProcedure,
  publicProcedure,
  router,
  premiumProcedure,
} from "../_core/trpc";
import { z } from "zod/v4";
import {
  getLiveScores,
  getNews,
  getAllSportsNews,
  getTopAthletes,
  type LiveGame,
  type NewsItem,
} from "../services/espnService";
import { getDb } from "../db";
import { getInjuries } from "../services/globalDataSite";
import { sql } from "drizzle-orm";

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
    const results = await Promise.allSettled(sports.map(s => getLiveScores(s)));
    const allGames: LiveGame[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        allGames.push(...r.value.map(g => ({ ...g, sport: sports[i] })));
      }
    });
    return allGames;
  }),

  topPlayers: publicProcedure
    .input(
      z.object({
        sportKey: z.string().optional().default("nba"),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input }) => {
      const athletes = await getTopAthletes(input.sportKey as any);
      return athletes.slice(0, input.limit);
    }),

  news: publicProcedure
    .input(
      z.object({
        sportKey: z.string().optional().default("nba"),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const news = await getNews(input.sportKey as any);
      return news.slice(0, input.limit);
    }),

  allNews: publicProcedure.query(async () => {
    return await getAllSportsNews();
  }),

  injuryReport: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl") }))
    .query(async ({ input }) => {
      // Provider-sourced only. Empty means unavailable; never use sample players.
      const injuries = await getInjuries(input.sportKey);
      const fetchedAt = new Date().toISOString();
      return injuries.map(injury => ({
        player: injury.playerName,
        team: injury.team,
        status: injury.status,
        injury: injury.description,
        sport: injury.sport,
        source: injury.source ?? "provider",
        fetchedAt,
        verificationStatus: "provider_reported" as const,
      }));
    }),

  oddsMovement: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(() => {
      // No synthetic line histories. Return empty until timestamped book snapshots exist.
      return [];
    }),

  // Platform stats — real DB-backed data from picks + pick_ledger
  platformStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Total picks and graded results
      const picksStats = await db.execute(sql`
        SELECT
          COUNT(*) AS totalPicks,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
          SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) AS pushes,
          SUM(CASE WHEN result IN ('win','loss','push') THEN 1 ELSE 0 END) AS graded
        FROM picks
      `);
      const ps = ((picksStats as any)[0]?.[0] ?? (picksStats as any)[0]) as any;
      const totalPicks = Number(ps?.totalPicks ?? 0);
      const wins = Number(ps?.wins ?? 0);
      const graded = Number(ps?.graded ?? 0);
      const winRate =
        graded > 0 ? ((wins / graded) * 100).toFixed(1) + "%" : "—";

      // Total ledger entries (proof of transparency)
      const ledgerStats = await db.execute(sql`
        SELECT COUNT(*) AS total FROM pick_ledger WHERE isPublic = 1
      `);
      const ls = ((ledgerStats as any)[0]?.[0] ??
        (ledgerStats as any)[0]) as any;
      const ledgerTotal = Number(ls?.total ?? 0);

      // Total users
      const userStats = await db.execute(
        sql`SELECT COUNT(*) AS total FROM user`
      );
      const us = ((userStats as any)[0]?.[0] ?? (userStats as any)[0]) as any;
      const totalUsers = Number(us?.total ?? 0);

      // Per-sport breakdown
      const sportBreakdown = await db.execute(sql`
        SELECT
          sportKey,
          COUNT(*) AS total,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN result IN ('win','loss','push') THEN 1 ELSE 0 END) AS graded
        FROM picks
        WHERE sportKey IN ('americanfootball_nfl','basketball_nba','baseball_mlb','icehockey_nhl')
        GROUP BY sportKey
      `);
      const sportRows = ((sportBreakdown as any)[0] ?? sportBreakdown) as any[];
      const SPORT_LABELS: Record<string, string> = {
        americanfootball_nfl: "NFL",
        basketball_nba: "NBA",
        baseball_mlb: "MLB",
        icehockey_nhl: "NHL",
      };
      const sportStats = Array.isArray(sportRows)
        ? sportRows.map((r: any) => ({
            label: SPORT_LABELS[r.sportKey] ?? r.sportKey,
            winRate:
              Number(r.graded) > 0
                ? ((Number(r.wins) / Number(r.graded)) * 100).toFixed(1) + "%"
                : "—",
            games: Number(r.total).toLocaleString(),
          }))
        : [];

      return {
        winRate,
        totalPicks: totalPicks.toLocaleString(),
        ledgerEntries: ledgerTotal.toLocaleString(),
        members: totalUsers.toLocaleString(),
        sportStats,
      };
    } catch {
      // Fallback to safe empty state
      return {
        winRate: "—",
        totalPicks: "—",
        ledgerEntries: "—",
        members: "—",
        sportStats: [],
      };
    }
  }),
});
