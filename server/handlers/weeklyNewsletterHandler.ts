/**
 * Weekly Newsletter Handler
 * Sends a weekly picks summary to all subscribed users.
 * Triggered by Heartbeat cron every Sunday at 9 AM PT (4 PM UTC).
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks, newsletterSubscribers } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, gte, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmailRaw } from "../email";

export async function weeklyNewsletterHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  console.log(`[WeeklyNewsletter] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Get picks from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyPicks = await db.select().from(picks)
      .where(gte(picks.createdAt, weekAgo))
      .orderBy(desc(picks.confidenceScore));

    if (weeklyPicks.length === 0) {
      console.log("[WeeklyNewsletter] No picks this week, skipping");
      return res.json({ ok: true, skipped: "no-picks-this-week" });
    }

    // Calculate weekly stats
    const wins = weeklyPicks.filter(p => p.result === "win").length;
    const losses = weeklyPicks.filter(p => p.result === "loss").length;
    const pending = weeklyPicks.filter(p => !p.result || p.result === "pending").length;
    const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "N/A";
    const topPicks = weeklyPicks.slice(0, 5);
    const sportsThisWeek = Array.from(new Set(weeklyPicks.map(p => p.sportKey))).join(", ");

    // Generate newsletter summary via LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a sports betting newsletter writer for ChalkPicks Pro. Write engaging, concise weekly summaries in HTML format. Use <h2>, <p>, <strong>, <ul>/<li> tags. Keep it professional but exciting. Max 250 words of content."
        },
        {
          role: "user",
          content: `Write a weekly newsletter email body for ChalkPicks Pro subscribers.

Stats this week:
- Total picks: ${weeklyPicks.length}
- Wins: ${wins}, Losses: ${losses}, Pending: ${pending}
- Win rate: ${winRate}%
- Top pick: ${topPicks[0]?.homeTeam} vs ${topPicks[0]?.awayTeam} (${topPicks[0]?.confidenceScore}% confidence)
- Sports covered: ${sportsThisWeek}

Top 3 picks:
${topPicks.slice(0, 3).map((p, i) => `${i + 1}. ${p.homeTeam} vs ${p.awayTeam} — ${p.pickType} ${p.recommendation} (${p.confidenceScore}% confidence, result: ${p.result || "pending"})`).join("\n")}

Include:
1. Brief performance recap with stats
2. Highlight top 3 picks with details
3. Teaser for next week
4. CTA: "Upgrade to Pro for real-time alerts and +EV picks"
Output HTML only (no markdown).`
        }
      ],
      complexity: "high",
    });

    const newsletterBody = response.choices[0].message.content || "<p>Weekly summary unavailable.</p>";

    // Build full HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#39ff14;font-size:28px;margin:0;">ChalkPicks Pro</h1>
      <p style="color:#8b8ba3;font-size:14px;margin:4px 0 0;">Weekly Picks Recap</p>
    </div>
    <div style="background:#12122a;border:1px solid #1e1e3a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;text-align:center;margin-bottom:20px;">
        <div style="flex:1;"><span style="color:#39ff14;font-size:24px;font-weight:700;">${wins}</span><br><span style="color:#8b8ba3;font-size:12px;">Wins</span></div>
        <div style="flex:1;"><span style="color:#ef4444;font-size:24px;font-weight:700;">${losses}</span><br><span style="color:#8b8ba3;font-size:12px;">Losses</span></div>
        <div style="flex:1;"><span style="color:#f59e0b;font-size:24px;font-weight:700;">${pending}</span><br><span style="color:#8b8ba3;font-size:12px;">Pending</span></div>
        <div style="flex:1;"><span style="color:#39ff14;font-size:24px;font-weight:700;">${winRate}%</span><br><span style="color:#8b8ba3;font-size:12px;">Win Rate</span></div>
      </div>
    </div>
    <div style="color:#e0e0f0;font-size:15px;line-height:1.6;">
      ${newsletterBody}
    </div>
    <div style="text-align:center;margin-top:32px;">
      <a href="https://chalkpicks.live/pricing" style="display:inline-block;background:#39ff14;color:#000;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">Upgrade to Pro →</a>
    </div>
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #1e1e3a;">
      <p style="color:#5a5a7a;font-size:12px;margin:0;">
        <a href="https://chalkpicks.live" style="color:#5a5a7a;">ChalkPicks.live</a> | 
        <a href="https://chalkpicks.live/picks" style="color:#5a5a7a;">Today's Picks</a> | 
        <a href="https://chalkpicks.live/tools" style="color:#5a5a7a;">Free Tools</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    // Get all active newsletter subscribers
    const subscribers = await db.select().from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active"));

    const subject = `📊 ChalkPicks Weekly: ${wins}W-${losses}L (${winRate}% Win Rate) — Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    // Send to all subscribers
    let sent = 0;
    let failed = 0;
    for (const sub of subscribers) {
      try {
        const success = await sendEmailRaw(sub.email, subject, emailHtml);
        if (success) sent++;
        else failed++;
      } catch (e) {
        failed++;
        console.error(`[WeeklyNewsletter] Failed to send to ${sub.email}:`, e);
      }
    }

    // Notify owner
    await notifyOwner({
      title: `📧 Weekly Newsletter Sent (${wins}W-${losses}L)`,
      content: `Win Rate: ${winRate}%\nTotal Picks: ${weeklyPicks.length}\nSent: ${sent}/${subscribers.length} subscribers\nFailed: ${failed}\n\nSubject: ${subject}`
    });

    console.log(`[WeeklyNewsletter] Sent to ${sent}/${subscribers.length} subscribers (${failed} failed)`);

    res.json({
      ok: true,
      stats: { wins, losses, pending, winRate, totalPicks: weeklyPicks.length },
      emailsSent: sent,
      emailsFailed: failed,
      subscriberCount: subscribers.length,
    });
  } catch (err) {
    console.error("[WeeklyNewsletter] Error:", err);
    res.status(500).json({
      error: "Newsletter generation failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
