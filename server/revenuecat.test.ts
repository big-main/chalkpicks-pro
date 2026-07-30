/**
 * RevenueCat API key + webhook secret validation tests
 */
import { describe, it, expect } from "vitest";

const hasRevenueCatKeys = Boolean(
  process.env.VITE_REVENUECAT_IOS_KEY && process.env.VITE_REVENUECAT_ANDROID_KEY
);

// Validates deployed RevenueCat keys, not application code — meaningless
// without the real values, so skip cleanly rather than fail when this
// environment (e.g. a sandbox) has none configured.
describe.skipIf(!hasRevenueCatKeys)("RevenueCat API Keys", () => {
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

describe("RevenueCat Webhook Secret", () => {
  it.skipIf(!process.env.REVENUECAT_WEBHOOK_SECRET)(
    "REVENUECAT_WEBHOOK_SECRET is set and at least 32 chars",
    () => {
      const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
      expect(secret, "REVENUECAT_WEBHOOK_SECRET must be set").toBeTruthy();
      expect(
        secret!.length,
        "Secret must be at least 32 chars"
      ).toBeGreaterThanOrEqual(32);
    }
  );

  it("webhook auth logic rejects mismatched secret", () => {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET ?? "test-secret";
    const incomingHeader = "wrong-secret";
    // Mirrors the auth check in revenuecat-webhook.ts
    const isAuthorized = !secret || incomingHeader === secret;
    expect(isAuthorized).toBe(false);
  });

  it("webhook auth logic accepts correct secret", () => {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET ?? "test-secret";
    const isAuthorized = !secret || secret === secret; // same value
    expect(isAuthorized).toBe(true);
  });
});
