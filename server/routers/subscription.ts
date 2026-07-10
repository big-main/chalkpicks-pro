import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { subscriptionOrders, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

// Lazy Stripe client — constructing with an empty key throws at import time,
// which would crash the whole server (and every test) when the env var is
// missing. Fail per-request instead so the rest of the site stays up.
let _stripe: Stripe | null = null;
function requireStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Payments are temporarily unavailable. Please try again shortly.",
    });
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export const PLANS = {
  daily: {
    name: "Basic",
    priceId: "price_1TovuwDksqAHyBc3jOzOvW3p",
    amountCents: 999,
    interval: "month",
    description: "Essential picks for casual bettors",
    features: ["All premium picks daily", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"],
    badge: "Starter",
  },
  monthly: {
    name: "Pro",
    priceId: "price_1TovuxDksqAHyBc3GHCX8Kxx",
    amountCents: 1999,
    interval: "month",
    description: "Best value for serious bettors",
    features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support", "Daily pick alerts"],
    badge: "Most Popular",
    popular: true,
  },
  yearly: {
    name: "Elite",
    priceId: "price_1TovuxDksqAHyBc3yjLLYW9J",
    amountCents: 5999,
    interval: "year",
    description: "Maximum savings for pros",
    features: ["Everything in Pro", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"],
    badge: "Best Value",
    savings: "Save $14/mo vs Pro",
  },
};

export const subscriptionRouter = router({
  plans: publicProcedure.query(() => PLANS),

  createCheckout: protectedProcedure
    .input(z.object({
      tier: z.enum(["daily", "monthly", "yearly"]),
      origin: z.string(),
      promoCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const plan = PLANS[input.tier];
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST" });


      // Look up Stripe promotion code if user provided one
      let stripePromotionCodeId: string | undefined;
      let promoCodeDbId: string = "";

      if (input.promoCode) {
        // Validate against our DB first
        const { validatePromoCode, getPromoCodeByCode, incrementPromoCodeUsage } = await import("../db");
        const validation = await validatePromoCode(input.promoCode, input.tier);

        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.message || "Invalid promo code",
          });
        }

        const promo = await getPromoCodeByCode(input.promoCode);
        if (promo) {
          promoCodeDbId = promo.id.toString();
        }

        // Find the Stripe promotion code by code string
        try {
          const promoCodes = await requireStripe().promotionCodes.list({
            code: input.promoCode.toUpperCase(),
            active: true,
            limit: 1,
          });
          if (promoCodes.data.length > 0) {
            stripePromotionCodeId = promoCodes.data[0].id;
          }
        } catch (err) {
          console.warn("[Checkout] Failed to look up Stripe promo code:", err);
        }
      }

      try {
        // Build session params using actual Stripe price IDs
        const isSubscription = plan.interval === "month" || plan.interval === "year";
        const sessionParams: any = {
          mode: isSubscription ? "subscription" : "payment",
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          line_items: [
            {
              price: plan.priceId,
              quantity: 1,
            },
          ],
          success_url: `${input.origin}/payment/success?tier=${input.tier}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/pricing`,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
            tier: input.tier,
            promoCodeId: promoCodeDbId,
            promoCode: input.promoCode ?? "",
          },
        };

        // Apply the Stripe promotion code discount
        if (stripePromotionCodeId) {
          // When we have a matching Stripe promo code, apply it directly
          sessionParams.discounts = [{ promotion_code: stripePromotionCodeId }];
        } else if (!input.promoCode) {
          // If no promo code provided, allow users to enter one at Stripe checkout
          sessionParams.allow_promotion_codes = true;
        }
        // If user provided a promo code but it's not in Stripe, we apply it via metadata
        // and the webhook will handle recording the discount

        const session = await requireStripe().checkout.sessions.create(sessionParams);

        return { url: session.url };
      } catch (err: any) {
        console.error("[Checkout] Error creating session:", err.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { tier: "free", expiresAt: null, isActive: false, accountBalance: 0 };

    const user = await db.select({
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      stripeSubscriptionId: users.stripeSubscriptionId,
      accountBalance: users.accountBalance,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (!u) return { tier: "free", expiresAt: null, isActive: false, accountBalance: 0 };

    const isActive = (u.subscriptionTier !== "free") && (
      !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
    );

    return {
      tier: u.subscriptionTier === "trial" ? "trial" : u.subscriptionTier,
      expiresAt: u.subscriptionExpiresAt,
      isActive,
      accountBalance: parseFloat(u.accountBalance.toString()),
    };
  }),

  // Called after successful payment
  activate: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      tier: z.enum(["daily", "monthly", "yearly"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let session: Stripe.Checkout.Session | null = null;
      try {
        session = await requireStripe().checkout.sessions.retrieve(input.sessionId);
      } catch {
        // If Stripe not configured, use mock activation
      }

      const now = new Date();
      let expiresAt = new Date(now);
      let subscriptionTier: "daily" | "monthly" | "yearly" = "daily";

      if (input.tier === "daily") {
        subscriptionTier = "daily";
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (input.tier === "monthly") {
        subscriptionTier = "monthly";
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        subscriptionTier = "yearly";
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      await db.update(users).set({
        subscriptionTier,
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: session?.subscription?.toString() ?? null,
      }).where(eq(users.id, ctx.user.id));

      // Record order
      await db.insert(subscriptionOrders).values({
        userId: ctx.user.id,
        stripeSessionId: input.sessionId,
        stripeSubscriptionId: session?.subscription?.toString() ?? null,
        tier: input.tier,
        status: "active",
        amountCents: PLANS[input.tier].amountCents,
        currency: "usd",
        startsAt: now,
        expiresAt,
      });

      return { success: true, tier: input.tier, expiresAt };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const user = await db.select({
      stripeSubscriptionId: users.stripeSubscriptionId,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (u?.stripeSubscriptionId) {
      try {
        await requireStripe().subscriptions.cancel(u.stripeSubscriptionId);
      } catch {
        // Subscription may already be canceled
      }
    }

    await db.update(users).set({
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      stripeSubscriptionId: null,
    }).where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  getBillingPortalUrl: protectedProcedure
    .input(z.object({
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const user = await db.select({
        stripeCustomerId: users.stripeCustomerId,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

      const u = user[0];
      if (!u?.stripeCustomerId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No Stripe customer found" });
      }

      try {
        const session = await requireStripe().billingPortal.sessions.create({
          customer: u.stripeCustomerId,
          configuration: "bpc_1TqPBuDksqAHyBc35muDhWXS",
          return_url: input.origin + "/account-settings",
        });
        return { url: session.url };
      } catch (err) {
        console.error("Stripe billing portal error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create billing portal session" });
      }
    }),
});
