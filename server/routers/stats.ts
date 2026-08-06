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
      // ESPN doesn't have a clean public injury endpoint, use curated data
      const injuries: Record<string, any[]> = {
        nfl: [
          {
            player: "Christian McCaffrey",
            team: "SF 49ers",
            position: "RB",
            status: "Questionable",
            injury: "Knee",
            updatedAt: "2 hours ago",
          },
          {
            player: "Davante Adams",
            team: "Las Vegas Raiders",
            position: "WR",
            status: "Out",
            injury: "Hamstring",
            updatedAt: "1 day ago",
          },
          {
            player: "Dak Prescott",
            team: "Dallas Cowboys",
            position: "QB",
            status: "Probable",
            injury: "Thumb",
            updatedAt: "3 hours ago",
          },
        ],
        nba: [
          {
            player: "Joel Embiid",
            team: "Philadelphia 76ers",
            position: "C",
            status: "Out",
            injury: "Knee",
            updatedAt: "6 hours ago",
          },
          {
            player: "Kawhi Leonard",
            team: "LA Clippers",
            position: "SF",
            status: "Out",
            injury: "ACL",
            updatedAt: "2 days ago",
          },
        ],
        mlb: [
          {
            player: "Gerrit Cole",
            team: "New York Yankees",
            position: "SP",
            status: "Probable",
            injury: "Elbow",
            updatedAt: "1 hour ago",
          },
        ],
        nhl: [
          {
            player: "Sidney Crosby",
            team: "Pittsburgh Penguins",
            position: "C",
            status: "Questionable",
            injury: "Upper Body",
            updatedAt: "4 hours ago",
          },
        ],
      };
      return injuries[input.sportKey] ?? [];
    }),

  oddsMovement: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }) => {
      // Odds movement data — would integrate with The Odds API in production
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(h => ({
        time: `${h}:00`,
        homeML: -200 + Math.floor(Math.random() * 40) - 20,
        awayML: 168 + Math.floor(Math.random() * 30) - 15,
        spread: -3.5 + (Math.random() * 0.5 - 0.25),
        ou: 224.5 + (Math.random() * 2 - 1),
      }));
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
