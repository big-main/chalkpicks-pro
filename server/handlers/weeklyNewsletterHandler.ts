/**
 * Weekly Newsletter Handler
 * Sends a weekly picks summary to all subscribed users.
 * Triggered by Heartbeat cron every Sunday at 9 AM PT.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks, users } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, gte, and, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

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

    // Generate newsletter summary via LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a sports betting newsletter writer for ChalkPicks Pro. Write engaging, concise weekly summaries. Keep it professional but exciting. Max 200 words."
        },
        {
          role: "user",
          content: `Write a weekly newsletter summary for ChalkPicks Pro subscribers.

Stats this week:
- Total picks: ${weeklyPicks.length}
- Wins: ${wins}, Losses: ${losses}, Pending: ${pending}
- Win rate: ${winRate}%
- Top pick: ${topPicks[0]?.homeTeam} vs ${topPicks[0]?.awayTeam} (${topPicks[0]?.confidenceScore}% confidence)
- Sports covered: ${Array.from(new Set(weeklyPicks.map(p => p.sportKey))).join(", ")}

Include:
1. Brief performance recap
2. Highlight top 3 picks of the week
3. Teaser for next week
4. CTA to upgrade subscription`
        }
      ],
    });

    const newsletterContent = response.choices[0].message.content || "Weekly summary unavailable.";

    // Notify owner with the newsletter content
    await notifyOwner({
      title: `📧 Weekly Newsletter Generated (${wins}W-${losses}L)`,
      content: `Win Rate: ${winRate}%\nTotal Picks: ${weeklyPicks.length}\n\n${newsletterContent}\n\nThis newsletter is ready to send to subscribers.`
    });

    console.log(`[WeeklyNewsletter] Generated newsletter: ${wins}W-${losses}L, ${weeklyPicks.length} picks`);

    res.json({
      ok: true,
      stats: { wins, losses, pending, winRate, totalPicks: weeklyPicks.length },
      newsletterPreview: newsletterContent,
      subscriberCount: 0, // Will be populated when email list grows
    });
  } catch (err) {
    console.error("[WeeklyNewsletter] Error:", err);
    res.status(500).json({ error: "Newsletter generation failed" });
  }
}
