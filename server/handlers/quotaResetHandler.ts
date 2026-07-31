/**
 * Monthly Quota Reset Handler
 * Resets the Odds API quota counter on the 1st of each month (when The Odds API billing cycle resets).
 *
 * Endpoint: POST /api/scheduled/quota-reset
 * Heartbeat: 1st of each month at 00:05 UTC (0 5 0 1 * *)
 */
import type { Request, Response } from "express";
import { oddsApiCache } from "../services/oddsApiCache";

export async function quotaResetHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";

  const now = new Date();
  const dayOfMonth = now.getUTCDate();

  // Safety check: only reset on the 1st (cron should guarantee this, but be defensive)
  if (dayOfMonth !== 1 && req.body?.force !== true) {
    return res.json({
      ok: true,
      skipped: true,
      reason: `Not the 1st of the month (day=${dayOfMonth}). Pass force:true to override.`,
      taskUid,
    });
  }

  const statsBefore = oddsApiCache.getStats();

  // Reset the quota counter in the cache service
  oddsApiCache.resetQuota();

  const statsAfter = oddsApiCache.getStats();

  console.warn(
    `[QuotaReset] task=${taskUid} quotaBefore=${statsBefore.quotaUsed} quotaAfter=${statsAfter.quotaUsed} conservationMode=${statsAfter.conservationMode}`
  );

  return res.json({
    ok: true,
    message: "Odds API quota counter reset for new billing cycle",
    quotaBefore: {
      used: statsBefore.quotaUsed,
      remaining: statsBefore.quotaRemaining,
      conservationMode: statsBefore.conservationMode,
    },
    quotaAfter: {
      used: statsAfter.quotaUsed,
      remaining: statsAfter.quotaRemaining,
      conservationMode: statsAfter.conservationMode,
    },
    resetAt: now.toISOString(),
    taskUid,
  });
}
