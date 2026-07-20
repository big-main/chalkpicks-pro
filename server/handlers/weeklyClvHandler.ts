/**
 * Weekly CLV Handler
 * Sends a per-user "Your Week in CLV" email to premium subscribers who logged
 * tracked bets in the last 7 days. Triggered by Heartbeat cron every Sunday.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { users, userBets } from "../../drizzle/schema";
import { and, gte, gt, isNull, ne, or, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmailRaw } from "../email";

function oddsToDecimal(americanOdds: number): number {
  return americanOdds > 0 ? 1 + americanOdds / 100 : 1 + 100 / Math.abs(americanOdds);
}

function calculateAverageCLV(bets: (typeof userBets.$inferSelect)[]): number {
  const withClv = bets.filter(b => b.clvValue !== null);
  if (withClv.length === 0) return 0;
  return withClv.reduce((sum, b) => sum + parseFloat(b.clvValue?.toString() || "0"), 0) / withClv.length;
}

export async function weeklyClvHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  console.log(`[WeeklyCLV] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const premiumUsers = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.subscriptionTier, "free"),
          or(isNull(users.subscriptionExpiresAt), gt(users.subscriptionExpiresAt, new Date()))
        )
      );

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of premiumUsers) {
      if (!user.email) {
        skipped++;
        continue;
      }

      const bets = await db
        .select()
        .from(userBets)
        .where(and(eq(userBets.userId, user.id), gte(userBets.createdAt, weekAgo)));

      if (bets.length === 0) {
        skipped++;
        continue;
      }

      const wins = bets.filter(b => b.result === "win").length;
      const losses = bets.filter(b => b.result === "loss").length;
      const betsWithClv: { bet: typeof bets[number]; clv: number }[] = [];
      for (const b of bets) {
        if (b.clvValue !== null) betsWithClv.push({ bet: b, clv: parseFloat(b.clvValue.toString()) });
      }
      const positiveClvBets = betsWithClv.filter(b => b.clv > 0);
      const negativeClvBets = betsWithClv.filter(b => b.clv < 0);
      const avgClv = calculateAverageCLV(bets);
      const totalProfit = bets.reduce((sum, b) => sum + parseFloat(b.profit?.toString() || "0"), 0);
      const bestBet = [...betsWithClv].sort((a, b) => b.clv - a.clv)[0];

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#39ff14;font-size:28px;margin:0;">ChalkPicks Pro</h1>
      <p style="color:#8b8ba3;font-size:14px;margin:4px 0 0;">Your Week in CLV</p>
    </div>
    <div style="background:#12122a;border:1px solid #1e1e3a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;text-align:center;margin-bottom:20px;">
        <div style="flex:1;"><span style="color:#39ff14;font-size:24px;font-weight:700;">${bets.length}</span><br><span style="color:#8b8ba3;font-size:12px;">Bets Tracked</span></div>
        <div style="flex:1;"><span style="color:${avgClv >= 0 ? "#39ff14" : "#ef4444"};font-size:24px;font-weight:700;">${avgClv >= 0 ? "+" : ""}${avgClv.toFixed(2)}%</span><br><span style="color:#8b8ba3;font-size:12px;">Avg CLV</span></div>
        <div style="flex:1;"><span style="color:#39ff14;font-size:24px;font-weight:700;">${positiveClvBets.length}</span><br><span style="color:#8b8ba3;font-size:12px;">+CLV Bets</span></div>
        <div style="flex:1;"><span style="color:#ef4444;font-size:24px;font-weight:700;">${negativeClvBets.length}</span><br><span style="color:#8b8ba3;font-size:12px;">-CLV Bets</span></div>
      </div>
      <div style="text-align:center;padding-top:16px;border-top:1px solid #1e1e3a;">
        <span style="color:#8b8ba3;font-size:13px;">Record: </span>
        <span style="color:#e0e0f0;font-size:13px;font-weight:600;">${wins}W-${losses}L</span>
        <span style="color:#8b8ba3;font-size:13px;"> &middot; Profit: </span>
        <span style="color:${totalProfit >= 0 ? "#39ff14" : "#ef4444"};font-size:13px;font-weight:600;">${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}u</span>
      </div>
    </div>
    <div style="color:#e0e0f0;font-size:15px;line-height:1.6;">
      ${
        betsWithClv.length === 0
          ? `<p>You tracked ${bets.length} bet${bets.length === 1 ? "" : "s"} this week, but none have closing line data yet. Log the closing odds on your bets to unlock your CLV edge.</p>`
          : `<p>You beat the closing line on <strong>${positiveClvBets.length} of ${betsWithClv.length}</strong> tracked bets this week${bestBet ? `, with your best line move on <strong>${bestBet.bet.description}</strong> (${bestBet.clv > 0 ? "+" : ""}${bestBet.clv.toFixed(2)}% CLV)` : ""}.</p>
        <p>${avgClv > 0 ? "Positive average CLV means you're consistently getting better numbers than the market closes at — that's the strongest predictor of long-run profitability." : "A negative average CLV this week means the market moved against your bet prices on average — worth a look at bet timing."}</p>`
      }
    </div>
    <div style="text-align:center;margin-top:32px;">
      <a href="https://chalkpicks.live/clv-tracker" style="display:inline-block;background:#39ff14;color:#000;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">View Full CLV Tracker →</a>
    </div>
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #1e1e3a;">
      <p style="color:#5a5a7a;font-size:12px;margin:0;">
        <a href="https://chalkpicks.live" style="color:#5a5a7a;">ChalkPicks.live</a> |
        <a href="https://chalkpicks.live/picks" style="color:#5a5a7a;">Today's Picks</a> |
        <a href="https://chalkpicks.live/performance" style="color:#5a5a7a;">Track Record</a>
      </p>
    </div>
  </div>
</body>
</html>`;

      const subject = `📈 Your Week in CLV: ${avgClv >= 0 ? "+" : ""}${avgClv.toFixed(1)}% avg (${bets.length} bet${bets.length === 1 ? "" : "s"} tracked)`;

      try {
        const success = await sendEmailRaw(user.email, subject, emailHtml);
        if (success) sent++;
        else failed++;
      } catch (e) {
        failed++;
        console.error(`[WeeklyCLV] Failed to send to ${user.email}:`, e);
      }
    }

    await notifyOwner({
      title: `📈 Weekly CLV Emails Sent`,
      content: `Premium users: ${premiumUsers.length}\nSent: ${sent}\nSkipped (no bets this week): ${skipped}\nFailed: ${failed}`,
    });

    console.log(`[WeeklyCLV] Sent ${sent}, skipped ${skipped}, failed ${failed} (of ${premiumUsers.length} premium users)`);

    res.json({ ok: true, premiumUsers: premiumUsers.length, sent, skipped, failed });
  } catch (err) {
    console.error("[WeeklyCLV] Error:", err);
    res.status(500).json({
      error: "Weekly CLV email generation failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
