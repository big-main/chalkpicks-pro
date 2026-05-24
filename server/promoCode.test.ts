import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Promo Code System", () => {
  const testCode = "TEST_PROMO_" + Date.now();

  beforeAll(async () => {
    // Create a test promo code
    await db.createPromoCode({
      code: testCode,
      discountType: "percentage",
      discountValue: "50",
      tier: "monthly",
      maxUses: 10,
      source: "test",
      isActive: true,
    });
  });

  it("should validate an active promo code", async () => {
    const result = await db.validatePromoCode(testCode, "monthly");
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(50);
    expect(result.discountType).toBe("percentage");
  });

  it("should reject code for wrong tier", async () => {
    const result = await db.validatePromoCode(testCode, "daily");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("not valid");
  });

  it("should reject non-existent code", async () => {
    const result = await db.validatePromoCode("NONEXISTENT_CODE", "monthly");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("Invalid");
  });

  it("should retrieve promo code by code", async () => {
    const promo = await db.getPromoCodeByCode(testCode);
    expect(promo).toBeDefined();
    expect(promo?.code).toBe(testCode);
    expect(promo?.discountType).toBe("percentage");
  });

  it("should increment usage count", async () => {
    const before = await db.getPromoCodeByCode(testCode);
    const beforeCount = before?.currentUses || 0;

    await db.incrementPromoCodeUsage(before!.id);

    const after = await db.getPromoCodeByCode(testCode);
    expect(after?.currentUses).toBe(beforeCount + 1);
  });

  it("should reject code when max uses reached", async () => {
    const promo = await db.getPromoCodeByCode(testCode);
    if (promo) {
      // Increment to max uses
      for (let i = promo.currentUses; i < promo.maxUses!; i++) {
        await db.incrementPromoCodeUsage(promo.id);
      }

      const result = await db.validatePromoCode(testCode, "monthly");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("limit");
    }
  });

  afterAll(async () => {
    // Cleanup: deactivate test code
    const promo = await db.getPromoCodeByCode(testCode);
    if (promo) {
      await db.deactivatePromoCode(promo.id);
    }
  });
});
