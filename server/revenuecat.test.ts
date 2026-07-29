/**
 * RevenueCat API key validation test
 * Verifies that the VITE_REVENUECAT_IOS_KEY and VITE_REVENUECAT_ANDROID_KEY
 * environment variables are set and have the correct format (sk_... prefix).
 */
import { describe, it, expect } from "vitest";

describe("RevenueCat API Keys", () => {
  it("VITE_REVENUECAT_IOS_KEY should be set and valid", () => {
    const key = process.env.VITE_REVENUECAT_IOS_KEY;
    expect(key, "VITE_REVENUECAT_IOS_KEY must be set").toBeTruthy();
    expect(key?.length, "Key must be at least 10 chars").toBeGreaterThan(10);
    // RevenueCat keys start with sk_ (secret) or appl_ (public iOS) or goog_ (public Android)
    expect(
      key?.startsWith("sk_") ||
        key?.startsWith("appl_") ||
        key?.startsWith("goog_"),
      "Key should start with sk_, appl_, or goog_"
    ).toBe(true);
  });

  it("VITE_REVENUECAT_ANDROID_KEY should be set and valid", () => {
    const key = process.env.VITE_REVENUECAT_ANDROID_KEY;
    expect(key, "VITE_REVENUECAT_ANDROID_KEY must be set").toBeTruthy();
    expect(key?.length, "Key must be at least 10 chars").toBeGreaterThan(10);
    expect(
      key?.startsWith("sk_") ||
        key?.startsWith("appl_") ||
        key?.startsWith("goog_"),
      "Key should start with sk_, appl_, or goog_"
    ).toBe(true);
  });

  it("Both keys should be the same value (shared secret key)", () => {
    const iosKey = process.env.VITE_REVENUECAT_IOS_KEY;
    const androidKey = process.env.VITE_REVENUECAT_ANDROID_KEY;
    expect(iosKey).toBe(androidKey);
  });
});
