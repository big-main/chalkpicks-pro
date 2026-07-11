import express from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { users, subscriptionOrders } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendWelcomeEmail } from "./email";
import { PLANS } from "./routers/subscription";

// Lazy Stripe client — avoids crashing the entire server at boot when
// STRIPE_SECRET_KEY is absent (tests, CI, misconfigured deploys).
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

// Grant in-app access matching each plan's actual billing interval. The tier
// KEYS (daily/monthly/yearly) are legacy; the real cadence lives in PLANS
// (e.g. the "daily" key is now the monthly "Basic" plan). Keying off the plan
// interval prevents a paid monthly subscriber's access from lapsing after a day.
function tierToExpiry(tier: "daily" | "monthly" | "yearly", from: Date): Date {
  const expiresAt = new Date(from);
  if (PLANS[tier].interval === "year") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt;
}

export function registerStripeWebhook(app: express.Application) {
  // MUST be registered BEFORE express.json() middleware (needs raw body)
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripe = getStripe();

      // Fail closed: never process unverified webhook payloads. Accepting
      // unsigned events would let anyone grant themselves a subscription.
      if (!stripe || !webhookSecret) {
        console.error(
          "[Webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured — rejecting event. " +
            "Stripe will retry once secrets are set."
        );
        return res.status(500).json({ error: "Webhook not configured" });
      }
      if (!sig) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      let event: Stripe.Event;
      try {
        const sigHeader = Array.isArray(sig) ? sig[0] : sig;
        event = stripe.webhooks.constructEvent(req.body, sigHeader, webhookSecret);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Handle Stripe CLI / dashboard test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Received: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0");
            const tier = (session.metadata?.tier ?? "monthly") as "daily" | "monthly" | "yearly";

            if (!userId) break;

            const db = await getDb();
            if (!db) break;

            // Idempotency: Stripe retries webhooks. If we already recorded
            // this session, skip so credits are never double-granted.
            const existingOrder = await db
              .select({ id: subscriptionOrders.id })
              .from(subscriptionOrders)
              .where(eq(subscriptionOrders.stripeSessionId, session.id))
              .limit(1);
            if (existingOrder.length > 0) {
              console.log(`[Webhook] Session ${session.id} already processed, skipping`);
              break;
            }

            // Read user state BEFORE mutating it, so email uses correct info.
            const userBefore = await db.select().from(users).where(eq(users.id, userId)).limit(1);

            const now = new Date();
            const expiresAt = tierToExpiry(tier, now);

            // Grant $100 credit bonus if payment is $5 or more
            const amountPaid = session.amount_total ?? 0;
            const creditBonus = amountPaid >= 500 ? 100 : 0; // $5 = 500 cents

            await db
              .update(users)
              .set({
                subscriptionTier: tier,
                subscriptionExpiresAt: expiresAt,
                stripeSubscriptionId: session.subscription?.toString() ?? null,
                // Persist the Stripe customer id so the billing portal
                // (getBillingPortalUrl) can find the customer later. Without
                // this, "Manage Billing" always failed with "No Stripe customer".
                stripeCustomerId: session.customer?.toString() ?? null,
                // INCREMENT the balance — never overwrite what the user already has.
                ...(creditBonus > 0
                  ? { accountBalance: sql`${users.accountBalance} + ${creditBonus}` }
                  : {}),
              })
              .where(eq(users.id, userId));

            if (creditBonus > 0) {
              console.log(
                `[Webhook] Granted $${creditBonus} credit bonus to user ${userId} (payment: $${(amountPaid / 100).toFixed(2)})`
              );
            }

            // Record order
            await db
              .insert(subscriptionOrders)
              .values({
                userId,
                stripeSessionId: session.id,
                stripeSubscriptionId: session.subscription?.toString() ?? null,
                tier,
                status: "active",
                amountCents: session.amount_total ?? 0,
                currency: session.currency ?? "usd",
                startsAt: now,
                expiresAt,
              })
              .catch(() => {
                // Ignore duplicate key errors — already recorded by activate mutation
              });

            // Send welcome email using the pre-update snapshot
            if (userBefore[0]?.email && userBefore[0]?.name) {
              const emailSent = await sendWelcomeEmail({
                email: userBefore[0].email,
                name: userBefore[0].name,
                tier,
                expiresAt,
              });
              if (emailSent) {
                console.log(`[Webhook] Welcome email sent to ${userBefore[0].email}`);
              }
            }

            console.log(`[Webhook] Activated ${tier} for user ${userId}`);
            break;
          }

          // Renewals: Stripe bills the subscription each period. Without this,
          // access lapses in-app after the first period while the card keeps
          // being charged — the #1 driver of chargebacks.
          case "invoice.paid":
          case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            const subId: string | undefined =
              (invoice as any).subscription?.toString?.() ??
              (invoice as any).parent?.subscription_details?.subscription?.toString?.();
            if (!subId) break;

            const db = await getDb();
            if (!db) break;

            const userResult = await db
              .select()
              .from(users)
              .where(eq(users.stripeSubscriptionId, subId))
              .limit(1);
            if (!userResult[0]) break;

            // Prefer Stripe's own period end; fall back to tier math.
            const periodEnd: number | undefined = invoice.lines?.data?.[0]?.period?.end;
            const currentTier = userResult[0].subscriptionTier;
            const tier: "daily" | "monthly" | "yearly" =
              currentTier === "daily" || currentTier === "yearly" ? currentTier : "monthly";
            const expiresAt = periodEnd
              ? new Date(periodEnd * 1000)
              : tierToExpiry(tier, new Date());

            await db
              .update(users)
              .set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt })
              .where(eq(users.id, userResult[0].id));
            console.log(
              `[Webhook] Renewed ${tier} for user ${userResult[0].id} through ${expiresAt.toISOString()}`
            );
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (!db) break;

            // Find user by stripeSubscriptionId and downgrade to free
            const userResult = await db
              .select()
              .from(users)
              .where(eq(users.stripeSubscriptionId, sub.id))
              .limit(1);
            if (userResult[0]) {
              await db
                .update(users)
                .set({
                  subscriptionTier: "free",
                  subscriptionExpiresAt: null,
                  stripeSubscriptionId: null,
                })
                .where(eq(users.id, userResult[0].id));
              console.log(`[Webhook] Cancelled subscription for user ${userResult[0].id}`);
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.warn(`[Webhook] Payment failed for invoice ${invoice.id}`);
            break;
          }

          default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Internal error" });
      }

      return res.json({ received: true });
    }
  );
}
