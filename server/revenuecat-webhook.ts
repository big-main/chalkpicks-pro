/**
 * RevenueCat Webhook Handler
 *
 * Handles server-side subscription events from RevenueCat (App Store / Google Play).
 * RevenueCat sends events when users subscribe, renew, cancel, or expire.
 *
 * Setup:
 *  1. Go to app.revenuecat.com → Project → Integrations → Webhooks
 *  2. Add webhook URL: https://chalkpicks.pro/api/revenuecat/webhook
 *  3. Set the Authorization header to REVENUECAT_WEBHOOK_SECRET env var
 *
 * Docs: https://www.revenuecat.com/docs/webhooks
 */
import express from "express";
import { getDb } from "./db";
import { users, subscriptionOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Map RevenueCat product IDs → ChalkPicks subscription tiers
const RC_PRODUCT_TO_TIER: Record<string, "daily" | "monthly" | "yearly"> = {
  chalkpicks_basic_monthly: "daily", // $9.99/mo Basic
  chalkpicks_pro_monthly: "monthly", // $19.99/mo Pro
  chalkpicks_elite_yearly: "yearly", // $59.99/yr Elite
};

// Map RevenueCat product IDs → expiry duration
function getExpiryFromProductId(productId: string, from: Date): Date {
  const expiresAt = new Date(from);
  if (productId === "chalkpicks_elite_yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

interface RCWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    environment?: string;
    store?: string;
  };
  api_version: string;
}

export function registerRevenueCatWebhook(app: express.Application) {
  app.post("/api/revenuecat/webhook", express.json(), async (req, res) => {
    // Validate authorization header
    const authHeader = req.headers["authorization"];
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!webhookSecret && process.env.NODE_ENV === "production") {
      console.error(
        "[RCWebhook] REVENUECAT_WEBHOOK_SECRET unset in production — refusing request"
      );
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (webhookSecret && authHeader !== webhookSecret) {
      console.error("[RCWebhook] Unauthorized request — invalid secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body as RCWebhookEvent;
    if (!body?.event?.type) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { type, app_user_id, product_id, expiration_at_ms } = body.event;
    console.warn(
      `[RCWebhook] Event: ${type} | user: ${app_user_id} | product: ${product_id}`
    );

    // Skip sandbox/test events in production
    if (
      body.event.environment === "SANDBOX" &&
      process.env.NODE_ENV === "production"
    ) {
      console.warn("[RCWebhook] Skipping sandbox event in production");
      return res.json({ ok: true, skipped: "sandbox" });
    }

    try {
      const db = await getDb();
      if (!db) {
        console.error("[RCWebhook] Database unavailable");
        return res.status(500).json({ error: "Database unavailable" });
      }

      // Look up user by RevenueCat app_user_id (our user's numeric ID)
      const userId = parseInt(app_user_id, 10);
      if (isNaN(userId)) {
        console.warn(`[RCWebhook] Invalid app_user_id: ${app_user_id}`);
        return res.json({ ok: true, skipped: "invalid-user-id" });
      }

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRows.length === 0) {
        console.warn(`[RCWebhook] User not found: ${app_user_id}`);
        return res.json({ ok: true, skipped: "user-not-found" });
      }

      const user = userRows[0];
      const tier = RC_PRODUCT_TO_TIER[product_id];

      switch (type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE": {
          if (!tier) {
            console.warn(`[RCWebhook] Unknown product: ${product_id}`);
            return res.json({ ok: true, skipped: "unknown-product" });
          }

          const now = new Date();
          const expiresAt = expiration_at_ms
            ? new Date(expiration_at_ms)
            : getExpiryFromProductId(product_id, now);

          // Update user subscription
          await db
            .update(users)
            .set({
              subscriptionTier: tier,
              subscriptionExpiresAt: expiresAt,
            })
            .where(eq(users.id, user.id));

          // Record the order (use stripeSessionId field to store RC event reference)
          await db.insert(subscriptionOrders).values({
            userId: user.id,
            tier,
            amountCents:
              tier === "yearly" ? 5999 : tier === "monthly" ? 1999 : 999,
            status: "active",
            stripeSessionId: `rc_${type.toLowerCase()}_${Date.now()}`,
            startsAt: now,
            expiresAt,
          });

          console.warn(
            `[RCWebhook] Granted ${tier} to user ${user.id} until ${expiresAt.toISOString()}`
          );
          break;
        }

        case "CANCELLATION":
        case "EXPIRATION": {
          // Don't immediately revoke — let the current period expire naturally
          console.warn(
            `[RCWebhook] ${type} for user ${user.id} — access expires at ${user.subscriptionExpiresAt}`
          );
          break;
        }

        case "BILLING_ISSUE": {
          console.warn(`[RCWebhook] Billing issue for user ${user.id}`);
          break;
        }

        default:
          console.warn(`[RCWebhook] Unhandled event type: ${type}`);
      }

      res.json({ ok: true, type, userId: user.id });
    } catch (err: any) {
      console.error("[RCWebhook] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
