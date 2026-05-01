import express, { Express } from "express";
import { getDb } from "./db";
import { sendSubscriptionConfirmation } from "./notificationService";

/**
 * Register PayPal webhook endpoint
 * Handles subscription and payment events from PayPal
 */
export function registerPayPalWebhook(app: Express) {
  // PayPal webhook endpoint
  app.post("/api/paypal/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("[PayPal Webhook] Event received:", event.event_type);

      // Verify webhook signature (in production, verify with PayPal)
      // For now, accept all events
      if (!event.event_type) {
        return res.status(400).json({ error: "Missing event_type" });
      }

      // Handle different PayPal events
      switch (event.event_type) {
        case "BILLING.SUBSCRIPTION.CREATED":
          await handleSubscriptionCreated(event);
          break;
        case "BILLING.SUBSCRIPTION.UPDATED":
          await handleSubscriptionUpdated(event);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
          await handleSubscriptionCancelled(event);
          break;
        case "PAYMENT.CAPTURE.COMPLETED":
          await handlePaymentCompleted(event);
          break;
        default:
          console.log("[PayPal Webhook] Unhandled event type:", event.event_type);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[PayPal Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription created:", resource.id);

  // Extract subscriber info from PayPal event
  const subscriberEmail = resource.subscriber?.email_address;
  const subscriberName = resource.subscriber?.name?.given_name || "Subscriber";
  const planId = resource.plan_id || resource.plan?.id || "unknown";

  // Map PayPal plan IDs to tier names
  const tierMap: Record<string, string> = {
    "P-DAILY": "Daily",
    "P-MONTHLY": "Monthly",
    "P-YEARLY": "Yearly",
  };
  const tierName = tierMap[planId] || "Premium";

  // Send subscription confirmation notification
  if (subscriberEmail) {
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      await sendSubscriptionConfirmation(0, subscriberEmail, subscriberName, tierName, expiresAt);
      console.log("[PayPal] Subscription confirmation sent to:", subscriberEmail);
    } catch (err) {
      console.error("[PayPal] Failed to send confirmation:", err);
    }
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription updated:", resource.id, "Status:", resource.status);

  // In production, update subscription status in database
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription cancelled:", resource.id);

  // In production, mark subscription as cancelled in database
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Payment completed:", resource.id, "Amount:", resource.amount?.value);

  // In production, record payment in database
}
