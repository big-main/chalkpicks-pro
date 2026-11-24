import type Stripe from "stripe";
import { SITE_URL } from "../../shared/seo-routes";

export type PlanTier = "daily" | "monthly" | "yearly";

const PRICE_ENV: Record<PlanTier, string> = {
  daily: "STRIPE_PRICE_DAILY",
  monthly: "STRIPE_PRICE_MONTHLY",
  yearly: "STRIPE_PRICE_YEARLY",
};

/**
 * Stripe price IDs differ between test and live mode. Prefer the deployment's
 * STRIPE_PRICE_* env var and fall back to the ID committed with the plan.
 */
export function resolvePriceId(tier: PlanTier, fallback: string): string {
  return process.env[PRICE_ENV[tier]]?.trim() || fallback;
}

const CANONICAL_HOSTS = new Set([
  "chalkpicks.pro",
  "www.chalkpicks.pro",
  "chalkpicks.live",
  "www.chalkpicks.live",
]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Checkout success/cancel URLs must point at a host we control. The client
 * sends window.location.origin, which is untrusted: accept only ChalkPicks
 * hosts (rewritten to the canonical apex) or localhost for development, and
 * otherwise fall back to the canonical site URL.
 */
export function resolveCheckoutOrigin(requested: string | undefined): string {
  const canonical = (process.env.APP_URL?.trim() || SITE_URL).replace(
    /\/+$/,
    ""
  );
  if (!requested) return canonical;
  try {
    const url = new URL(requested);
    if (
      LOCAL_HOSTS.has(url.hostname) &&
      process.env.NODE_ENV !== "production"
    ) {
      return url.origin;
    }
    if (url.protocol === "https:" && CANONICAL_HOSTS.has(url.hostname)) {
      return canonical;
    }
  } catch {
    // fall through to canonical
  }
  return canonical;
}

/** The discount shape accepted by Checkout Sessions (`discounts[]`). */
export type StripeDiscount = { promotion_code: string } | { coupon: string };

export interface PromoValidation {
  discount?: number;
  discountType?: string;
}

/**
 * How long a self-created coupon discounts a subscription. "once" applies to
 * the first invoice only (first month on monthly plans, first year on yearly).
 */
export const PROMO_COUPON_DURATION = "once" as const;

/**
 * Returns the Stripe discount to attach to a Checkout Session for a promo code
 * that our own validation already accepted.
 *
 * 1. Prefer an active Stripe promotion code with the same code (so anything
 *    configured in the Stripe Dashboard, including its own limits, wins).
 * 2. Otherwise create — or reuse — a deterministic coupon from the validated
 *    values so a code that works on the pricing page can never dead-end at
 *    checkout because nobody mirrored it into Stripe.
 */
export async function ensureStripeDiscount(
  stripe: Stripe,
  code: string,
  validation: PromoValidation
): Promise<StripeDiscount> {
  const normalized = code.trim().toUpperCase();

  const promotionCodes = await stripe.promotionCodes.list({
    code: normalized,
    active: true,
    limit: 1,
  });
  if (promotionCodes.data.length > 0) {
    return { promotion_code: promotionCodes.data[0].id };
  }

  if (!validation.discount || validation.discount <= 0) {
    throw new Error(`Promo code ${normalized} has no discount value`);
  }
  const isPercent = validation.discountType !== "fixed";
  if (isPercent && validation.discount > 100) {
    throw new Error(`Promo code ${normalized} has an invalid percentage`);
  }

  const amountCents = isPercent ? 0 : Math.round(validation.discount * 100);
  const couponId = isPercent
    ? `cp_${normalized.toLowerCase()}_${validation.discount}pct`
    : `cp_${normalized.toLowerCase()}_${amountCents}c`;

  try {
    const existing = await stripe.coupons.retrieve(couponId);
    if (existing.valid) return { coupon: existing.id };
  } catch (err: any) {
    if (err?.code !== "resource_missing") throw err;
  }

  try {
    const coupon = await stripe.coupons.create({
      id: couponId,
      name: normalized,
      duration: PROMO_COUPON_DURATION,
      ...(isPercent
        ? { percent_off: validation.discount }
        : { amount_off: amountCents, currency: "usd" }),
      metadata: { promo_code: normalized, source: "chalkpicks-checkout" },
    });
    return { coupon: coupon.id };
  } catch (err: any) {
    // A concurrent checkout created it first — reuse it.
    if (err?.code === "resource_already_exists") return { coupon: couponId };
    throw err;
  }
}
