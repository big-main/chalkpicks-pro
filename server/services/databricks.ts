/**
 * Analytics Engine — Direct TiDB Queries
 * 
 * Replaces Databricks SQL warehouse (paid, not configured) with direct queries
 * against the existing TiDB Cloud database. Same analytics, zero extra cost.
 * 
 * The picks table already has all the data needed:
 * - sportKey, pickType, result, confidenceScore, edgeScore, odds, pickDate
 * 
 * No external dependencies or credentials required.
 */

import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { sql, eq, and, gte, lte, count, avg } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  sport: string;
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  avgConfidence: number;
  clvAvg: number;
}

interface DashboardAnalytics {
  bySport: AnalyticsSummary[];
  byBetType: { betType: string; winRate: number; roi: number; count: number }[];
  recentTrend: { date: string; winRate: number; roi: number }[];
}

// ─── Helper: Raw SQL via Drizzle ────────────────────────────────────────────

async function rawQuery<T>(sqlStr: string): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const [rows] = await (db as any).execute(sql.raw(sqlStr));
    return (rows ?? []) as T[];
  } catch (err) {
    console.error("[Analytics] Query failed:", (err as Error).message);
    return [];
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get backtesting analytics by sport (and optional date range)
 */
export async function getBacktestAnalytics(
  sport?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AnalyticsSummary[]> {
  const conditions: string[] = ["result != 'pending'"];
  if (sport && sport !== "all") conditions.push(`sportKey = '${sport}'`);
  if (dateFrom) conditions.push(`pickDate >= '${dateFrom}'`);
  if (dateTo) conditions.push(`pickDate <= '${dateTo}'`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await rawQuery<any>(`
    SELECT 
      sportKey as sport,
      COUNT(*) as total_picks,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) as pushes,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(
        SUM(CASE 
          WHEN result = 'win' AND odds > 0 THEN odds / 100.0
          WHEN result = 'win' AND odds < 0 THEN 100.0 / ABS(odds)
          WHEN result = 'loss' THEN -1.0
          ELSE 0
        END) / NULLIF(COUNT(*), 0) * 100, 2
      ) as roi,
      ROUND(AVG(confidenceScore), 1) as avg_confidence,
      ROUND(AVG(CAST(edgeScore AS DECIMAL(5,2))), 2) as clv_avg
    FROM picks
    ${where}
    GROUP BY sportKey
    ORDER BY total_picks DESC
  `);

  return rows.map((row: any) => ({
    sport: row.sport ?? "",
    totalPicks: Number(row.total_picks) || 0,
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
    pushes: Number(row.pushes) || 0,
    winRate: Number(row.win_rate) || 0,
    roi: Number(row.roi) || 0,
    avgConfidence: Number(row.avg_confidence) || 0,
    clvAvg: Number(row.clv_avg) || 0,
  }));
}

/**
 * Get full dashboard analytics: by sport, by bet type, and 30-day trend
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const bySport = await getBacktestAnalytics();

  const byBetTypeRows = await rawQuery<any>(`
    SELECT 
      pickType,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(
        SUM(CASE 
          WHEN result = 'win' AND odds > 0 THEN odds / 100.0
          WHEN result = 'win' AND odds < 0 THEN 100.0 / ABS(odds)
          WHEN result = 'loss' THEN -1.0
          ELSE 0
        END) / NULLIF(COUNT(*), 0) * 100, 2
      ) as roi,
      COUNT(*) as cnt
    FROM picks
    WHERE result != 'pending'
    GROUP BY pickType
    ORDER BY cnt DESC
  `);

  const byBetType = byBetTypeRows.map((row: any) => ({
    betType: row.pickType ?? "",
    winRate: Number(row.win_rate) || 0,
    roi: Number(row.roi) || 0,
    count: Number(row.cnt) || 0,
  }));

  const trendRows = await rawQuery<any>(`
    SELECT 
      pickDate as date,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(
        SUM(CASE 
          WHEN result = 'win' AND odds > 0 THEN odds / 100.0
          WHEN result = 'win' AND odds < 0 THEN 100.0 / ABS(odds)
          WHEN result = 'loss' THEN -1.0
          ELSE 0
        END) / NULLIF(COUNT(*), 0) * 100, 2
      ) as roi
    FROM picks
    WHERE result != 'pending'
      AND pickDate >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), '%Y-%m-%d')
    GROUP BY pickDate
    ORDER BY pickDate DESC
    LIMIT 30
  `);

  const recentTrend = trendRows.map((row: any) => ({
    date: row.date ?? "",
    winRate: Number(row.win_rate) || 0,
    roi: Number(row.roi) || 0,
  }));

  return { bySport, byBetType, recentTrend };
}

/**
 * Get performance for a specific time period (for weekly newsletter, etc.)
 */
export async function getWeeklyPerformance(daysBack: number = 7): Promise<{
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  roi: number;
  topSport: string;
  topBetType: string;
}> {
  const rows = await rawQuery<any>(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(
        SUM(CASE 
          WHEN result = 'win' AND odds > 0 THEN odds / 100.0
          WHEN result = 'win' AND odds < 0 THEN 100.0 / ABS(odds)
          WHEN result = 'loss' THEN -1.0
          ELSE 0
        END) / NULLIF(COUNT(*), 0) * 100, 2
      ) as roi
    FROM picks
    WHERE result != 'pending'
      AND pickDate >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL ${daysBack} DAY), '%Y-%m-%d')
  `);

  const topSportRows = await rawQuery<any>(`
    SELECT sportKey, COUNT(*) as cnt
    FROM picks
    WHERE result = 'win'
      AND pickDate >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL ${daysBack} DAY), '%Y-%m-%d')
    GROUP BY sportKey
    ORDER BY cnt DESC
    LIMIT 1
  `);

  const topBetTypeRows = await rawQuery<any>(`
    SELECT pickType, COUNT(*) as cnt
    FROM picks
    WHERE result = 'win'
      AND pickDate >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL ${daysBack} DAY), '%Y-%m-%d')
    GROUP BY pickType
    ORDER BY cnt DESC
    LIMIT 1
  `);

  const r = rows[0] ?? {};
  return {
    totalPicks: Number(r.total) || 0,
    wins: Number(r.wins) || 0,
    losses: Number(r.losses) || 0,
    winRate: Number(r.win_rate) || 0,
    roi: Number(r.roi) || 0,
    topSport: topSportRows[0]?.sportKey ?? "N/A",
    topBetType: topBetTypeRows[0]?.pickType ?? "N/A",
  };
}

/**
 * Get all-time stats (for landing page social proof)
 */
export async function getAllTimeStats(): Promise<{
  totalPicks: number;
  winRate: number;
  avgROI: number;
  bestStreak: number;
}> {
  const rows = await rawQuery<any>(`
    SELECT 
      COUNT(*) as total,
      ROUND(AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
      ROUND(
        SUM(CASE 
          WHEN result = 'win' AND odds > 0 THEN odds / 100.0
          WHEN result = 'win' AND odds < 0 THEN 100.0 / ABS(odds)
          WHEN result = 'loss' THEN -1.0
          ELSE 0
        END) / NULLIF(COUNT(*), 0) * 100, 2
      ) as roi
    FROM picks
    WHERE result != 'pending'
  `);

  const r = rows[0] ?? {};
  return {
    totalPicks: Number(r.total) || 0,
    winRate: Number(r.win_rate) || 0,
    avgROI: Number(r.roi) || 0,
    bestStreak: 0, // Would need window function — skip for now
  };
}

export default {
  getBacktestAnalytics,
  getDashboardAnalytics,
  getWeeklyPerformance,
  getAllTimeStats,
};
