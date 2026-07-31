/**
 * Cache Warm-Up Handler
 * Pre-fetches odds for the 4 major sports during peak hours (3 PM to 9 PM PT = 22:00 to 04:00 UTC)
 * so users always hit warm cache instead of cold API calls.
 *
 * Endpoint: POST /api/scheduled/cache-warmup
 * Heartbeat: Every 5 minutes (0 /5 * * * *)
 */
import type { Request, Response } from "express";
import { oddsApiCache } from "../services/oddsApiCache";

const WARMUP_SPORTS = [
  "americanfootball_nfl",
  "basketball_nba",
  "baseball_mlb",
  "icehockey_nhl",
];

export async function cacheWarmupHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";

  // Only warm up during peak hours: 3 PM to 9 PM PT = 22:00 to 04:00 UTC
  const hourUTC = new Date().getUTCHours();
  const isPeakHour = hourUTC >= 22 || hourUTC <= 4;

  if (!isPeakHour) {
    return res.json({
      ok: true,
      skipped: true,
      reason: "outside peak hours",
      hourUTC,
      taskUid,
    });
  }

  const stats = oddsApiCache.getStats();

  // Skip if quota exhausted
  if (stats.quotaRemaining === 0) {
    return res.json({
      ok: true,
      skipped: true,
      reason: "quota exhausted",
      quotaRemaining: stats.quotaRemaining,
    });
  }

  // Skip if conservation mode with very low quota
  if (stats.conservationMode && stats.quotaRemaining < 10) {
    return res.json({
      ok: true,
      skipped: true,
      reason: "conservation mode with low quota",
      quotaRemaining: stats.quotaRemaining,
    });
  }

  const results: Record<string, string> = {};
  let warmedCount = 0;
  const skippedCount = 0;

  for (const sport of WARMUP_SPORTS) {
    try {
      // Fetch through cache — returns cached data if fresh, calls API if stale/missing
      await oddsApiCache.fetch(sport, { markets: "h2h" });
      results[sport] = "warmed";
      warmedCount++;
    } catch (err: any) {
      results[sport] = `error: ${err?.message ?? String(err)}`;
    }
  }

  const updatedStats = oddsApiCache.getStats();

  console.warn(
    `[CacheWarmup] task=${taskUid} warmed=${warmedCount} skipped=${skippedCount} quota=${updatedStats.quotaRemaining}`
  );

  return res.json({
    ok: true,
    warmedCount,
    skippedCount,
    results,
    quotaRemaining: updatedStats.quotaRemaining,
    conservationMode: updatedStats.conservationMode,
    taskUid,
  });
}
