import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const QUANT_SIDECAR_URL = process.env.QUANT_SIDECAR_URL || "http://35.237.81.82:8091";

async function quantFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${QUANT_SIDECAR_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Quant sidecar error ${res.status}: ${text}`,
    });
  }
  return res.json() as Promise<T>;
}

export const quantRouter = router({
  /**
   * Health check for the quant sidecar
   */
  health: publicProcedure.query(async () => {
    try {
      const data = await quantFetch<{ status: string; timestamp: string }>("/health");
      return { online: data.status === "ok", timestamp: data.timestamp };
    } catch {
      return { online: false, timestamp: new Date().toISOString() };
    }
  }),

  /**
   * Get Elo power ratings for a sport
   */
  eloRatings: publicProcedure
    .input(z.object({
      sport: z.enum(["nfl", "nba", "mlb", "nhl"]).default("nfl"),
    }))
    .query(async ({ input }) => {
      const data = await quantFetch<{
        sport: string;
        ratings: Array<{ team: string; rating: number; wins: number; losses: number; streak: number }>;
        updated_at: string;
      }>(`/elo/ratings?sport=${input.sport}`);
      return data;
    }),

  /**
   * Predict win probability between two teams using Elo
   */
  eloPredict: publicProcedure
    .input(z.object({
      home_team: z.string(),
      away_team: z.string(),
      sport: z.enum(["nfl", "nba", "mlb", "nhl"]).default("nfl"),
      home_advantage: z.number().optional().default(65),
    }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        home_team: input.home_team,
        away_team: input.away_team,
        sport: input.sport,
        home_advantage: String(input.home_advantage),
      });
      const data = await quantFetch<{
        home_team: string;
        away_team: string;
        home_win_prob: number;
        away_win_prob: number;
        home_elo: number;
        away_elo: number;
        implied_spread: number;
      }>(`/elo/predict?${params}`);
      return data;
    }),

  /**
   * Run a backtesting simulation using the quant sidecar
   */
  runBacktest: protectedProcedure
    .input(z.object({
      sport: z.enum(["nfl", "nba", "mlb", "nhl", "all"]).default("nfl"),
      strategy: z.enum(["kelly", "quarter_kelly", "flat"]).default("kelly"),
      initial_bankroll: z.number().min(100).max(1000000).default(10000),
      min_ev: z.number().min(0).max(1).default(0.05),
      min_confidence: z.number().min(50).max(100).default(65),
      num_bets: z.number().min(10).max(500).default(100),
    }))
    .mutation(async ({ input }) => {
      const data = await quantFetch<{
        strategy: string;
        total_bets: number;
        wins: number;
        losses: number;
        win_rate: number;
        starting_bankroll: number;
        ending_bankroll: number;
        profit: number;
        roi_pct: number;
        max_drawdown_pct: number;
        avg_bet_size: number;
        sharpe_ratio: number;
        bankroll_history: number[];
      }>("/backtest/run", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    }),

  /**
   * Run a Monte Carlo bankroll simulation
   */
  monteCarlo: protectedProcedure
    .input(z.object({
      initial_bankroll: z.number().min(100).max(1000000).default(1000),
      win_rate: z.number().min(0.1).max(0.9).default(0.55),
      avg_odds: z.number().default(-110),
      bets_per_week: z.number().min(1).max(50).default(5),
      weeks: z.number().min(4).max(104).default(26),
      simulations: z.number().min(100).max(5000).default(1000),
      kelly_fraction: z.number().min(0.05).max(1).default(0.25),
    }))
    .mutation(async ({ input }) => {
      const data = await quantFetch<{
        median_final_bankroll: number;
        mean_final_bankroll: number;
        p10_final_bankroll: number;
        p90_final_bankroll: number;
        ruin_probability: number;
        median_roi_pct: number;
        percentile_paths: {
          p10: number[];
          p50: number[];
          p90: number[];
        };
        weeks: number;
      }>("/simulation/monte-carlo", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    }),

  /**
   * Get NFL player stats from nflverse
   */
  nflPlayerStats: protectedProcedure
    .input(z.object({
      season: z.number().optional().default(2024),
      position: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({ season: String(input.season) });
      if (input.position) params.set("position", input.position);
      const data = await quantFetch<{
        season: number;
        players: Array<Record<string, unknown>>;
        count: number;
      }>(`/nfl/player-stats?${params}`);
      return data;
    }),

  /**
   * Get MLB pitcher stats from pybaseball
   */
  mlbPitcherStats: protectedProcedure
    .input(z.object({
      season: z.number().optional().default(2024),
      min_ip: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        season: String(input.season),
        min_ip: String(input.min_ip),
      });
      const data = await quantFetch<{
        season: number;
        pitchers: Array<Record<string, unknown>>;
        count: number;
      }>(`/mlb/pitcher-stats?${params}`);
      return data;
    }),
});
