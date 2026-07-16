/**
 * Welcome Drip Email Handler
 * Sends a 4-email welcome sequence after subscription:
 *   Day 1: Welcome + Quick Start Guide (sent immediately by webhook - sendWelcomeEmail)
 *   Day 2: Tips & Best Practices for using ChalkPicks
 *   Day 3: Referral program invite
 *   Day 7: Annual upgrade nudge (or "one week in" celebration for yearly users)
 *
 * Triggered daily by Heartbeat cron at 10 AM PT.
 * Checks subscriptionOrders created 1-7 days ago and sends the appropriate email.
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
    let day7Sent = 0;

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

    // Day 7 emails: orders created 6-7 days ago (168-144 hours ago)
    const day7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day7End = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const day7Orders = await db.select({
      order: subscriptionOrders,
      user: users,
    }).from(subscriptionOrders)
      .innerJoin(users, eq(subscriptionOrders.userId, users.id))
      .where(
        and(
          gte(subscriptionOrders.createdAt, day7Start),
          lte(subscriptionOrders.createdAt, day7End),
          eq(subscriptionOrders.status, "active")
        )
      );

    for (const { user, order } of day7Orders) {
      if (!user.email) continue;
      const sent = await sendDripEmail({
        email: user.email,
        name: user.name || "Bettor",
        day: 7,
        tier: (order.tier as "daily" | "monthly" | "yearly") || "monthly",
      });
      if (sent) day7Sent++;
    }

    console.log(`[WelcomeDrip] Complete: Day 2=${day2Sent}/${day2Orders.length}, Day 3=${day3Sent}/${day3Orders.length}, Day 7=${day7Sent}/${day7Orders.length}`);
    res.json({ ok: true, day2Sent, day3Sent, day7Sent, timestamp: now.toISOString() });
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
