import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  PROMO_COUPON_DURATION,
  ensureStripeDiscount,
  resolveCheckoutOrigin,
  resolvePriceId,
} from "./services/checkoutHelpers";

function fakeStripe(opts: {
  promotionCodes?: Array<{ id: string }>;
  existingCoupon?: { id: string; valid: boolean } | null;
  createError?: { code: string };
}) {
  const create = vi.fn(async (params: any) => {
    if (opts.createError)
      throw Object.assign(new Error("boom"), opts.createError);
    return { id: params.id, valid: true };
  });
  const retrieve = vi.fn(async () => {
    if (opts.existingCoupon) return opts.existingCoupon;
    throw Object.assign(new Error("No such coupon"), {
      code: "resource_missing",
    });
  });
  const list = vi.fn(async () => ({ data: opts.promotionCodes ?? [] }));
  const stripe = {
    promotionCodes: { list },
    coupons: { create, retrieve },
  } as unknown as Stripe;
  return { stripe, create, retrieve, list };
}

describe("ensureStripeDiscount", () => {
  it("uses an active Stripe promotion code when one exists", async () => {
    const { stripe, create } = fakeStripe({
      promotionCodes: [{ id: "promo_123" }],
    });
    const result = await ensureStripeDiscount(stripe, "bf50", {
      discount: 50,
      discountType: "percentage",
    });
    expect(result).toEqual({ promotion_code: "promo_123" });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a 50% coupon when BF50 is missing from Stripe", async () => {
    const { stripe, create } = fakeStripe({});
    const result = await ensureStripeDiscount(stripe, " bf50 ", {
      discount: 50,
      discountType: "percentage",
    });
    expect(result).toEqual({ coupon: "cp_bf50_50pct" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cp_bf50_50pct",
        percent_off: 50,
        duration: PROMO_COUPON_DURATION,
        name: "BF50",
      })
    );
  });

  it("reuses an existing valid coupon instead of creating a duplicate", async () => {
    const { stripe, create } = fakeStripe({
      existingCoupon: { id: "cp_bf50_50pct", valid: true },
    });
    const result = await ensureStripeDiscount(stripe, "BF50", {
      discount: 50,
      discountType: "percentage",
    });
    expect(result).toEqual({ coupon: "cp_bf50_50pct" });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates fixed-amount coupons in cents", async () => {
    const { stripe, create } = fakeStripe({});
    const result = await ensureStripeDiscount(stripe, "SAVE5", {
      discount: 5,
      discountType: "fixed",
    });
    expect(result).toEqual({ coupon: "cp_save5_500c" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 500, currency: "usd" })
    );
  });

  it("tolerates a concurrent create (resource_already_exists)", async () => {
    const { stripe } = fakeStripe({
      createError: { code: "resource_already_exists" },
    });
    await expect(
      ensureStripeDiscount(stripe, "BF50", {
        discount: 50,
        discountType: "percentage",
      })
    ).resolves.toEqual({ coupon: "cp_bf50_50pct" });
  });

  it("rejects missing or out-of-range discounts", async () => {
    const { stripe } = fakeStripe({});
    await expect(
      ensureStripeDiscount(stripe, "X", { discountType: "percentage" })
    ).rejects.toThrow();
    await expect(
      ensureStripeDiscount(stripe, "X", {
        discount: 150,
        discountType: "percentage",
      })
    ).rejects.toThrow();
  });
});

describe("resolveCheckoutOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the canonical .pro apex when nothing is supplied", () => {
    vi.stubEnv("APP_URL", "");
    expect(resolveCheckoutOrigin(undefined)).toBe("https://chalkpicks.pro");
  });

  it("rewrites www and legacy hosts to the canonical apex", () => {
    vi.stubEnv("APP_URL", "https://chalkpicks.pro");
    expect(resolveCheckoutOrigin("https://www.chalkpicks.pro")).toBe(
      "https://chalkpicks.pro"
    );
    expect(resolveCheckoutOrigin("https://chalkpicks.live")).toBe(
      "https://chalkpicks.pro"
    );
  });

  it("never echoes an attacker-controlled origin", () => {
    vi.stubEnv("APP_URL", "https://chalkpicks.pro");
    expect(resolveCheckoutOrigin("https://evil.example")).toBe(
      "https://chalkpicks.pro"
    );
    expect(resolveCheckoutOrigin("https://chalkpicks.pro.evil.example")).toBe(
      "https://chalkpicks.pro"
    );
    expect(resolveCheckoutOrigin("javascript:alert(1)")).toBe(
      "https://chalkpicks.pro"
    );
  });

  it("allows localhost outside production only", () => {
    vi.stubEnv("APP_URL", "https://chalkpicks.pro");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveCheckoutOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveCheckoutOrigin("http://localhost:3000")).toBe(
      "https://chalkpicks.pro"
    );
  });
});

describe("resolvePriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the STRIPE_PRICE_* env override", () => {
    vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_live_monthly");
    expect(resolvePriceId("monthly", "price_default")).toBe(
      "price_live_monthly"
    );
  });

  it("falls back to the committed price id", () => {
    vi.stubEnv("STRIPE_PRICE_YEARLY", "");
    expect(resolvePriceId("yearly", "price_default")).toBe("price_default");
  });
});
