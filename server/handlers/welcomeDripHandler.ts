/**
 * Welcome Drip Email Handler
 * Sends a 3-email welcome sequence after subscription:
 *   Day 1: Welcome + Quick Start Guide (sent immediately by webhook - sendWelcomeEmail)
 *   Day 2: Tips & Best Practices for using ChalkPicks
 *   Day 3: Upsell to yearly / referral program invite
 * 
 * Triggered daily by Heartbeat cron at 10 AM PT.
 * Checks subscriptionOrders created 1-3 days ago and sends the appropriate email.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { subscriptionOrders, users } from "../../drizzle/schema";
import { and, gte, lte, eq } from "drizzle-orm";
import { sendDripEmail } from "../email";

export async function welcomeDripHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  console.log(`[WelcomeDrip] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const now = new Date();
    let day2Sent = 0;
    let day3Sent = 0;

    // Day 2 emails: orders created 24-48 hours ago
    const day2Start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const day2End = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const day2Orders = await db.select({
      order: subscriptionOrders,
      user: users,
    }).from(subscriptionOrders)
      .innerJoin(users, eq(subscriptionOrders.userId, users.id))
      .where(
        and(
          gte(subscriptionOrders.createdAt, day2Start),
          lte(subscriptionOrders.createdAt, day2End),
          eq(subscriptionOrders.status, "active")
        )
      );

    for (const { user, order } of day2Orders) {
      if (!user.email) continue;
      const sent = await sendDripEmail({
        email: user.email,
        name: user.name || "Bettor",
        day: 2,
        tier: (order.tier as "daily" | "monthly" | "yearly") || "monthly",
      });
      if (sent) day2Sent++;
    }

    // Day 3 emails: orders created 48-72 hours ago
    const day3Start = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const day3End = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const day3Orders = await db.select({
      order: subscriptionOrders,
      user: users,
    }).from(subscriptionOrders)
      .innerJoin(users, eq(subscriptionOrders.userId, users.id))
      .where(
        and(
          gte(subscriptionOrders.createdAt, day3Start),
          lte(subscriptionOrders.createdAt, day3End),
          eq(subscriptionOrders.status, "active")
        )
      );

    for (const { user, order } of day3Orders) {
      if (!user.email) continue;
      const sent = await sendDripEmail({
        email: user.email,
        name: user.name || "Bettor",
        day: 3,
        tier: (order.tier as "daily" | "monthly" | "yearly") || "monthly",
      });
      if (sent) day3Sent++;
    }

    console.log(`[WelcomeDrip] Complete: Day 2 sent=${day2Sent}/${day2Orders.length}, Day 3 sent=${day3Sent}/${day3Orders.length}`);
    res.json({ ok: true, day2Sent, day3Sent, timestamp: now.toISOString() });
  } catch (error: any) {
    console.error("[WelcomeDrip] Error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
