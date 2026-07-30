import { describe, it, expect } from "vitest";

const hasAnyVapidKey = Boolean(
  process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PRIVATE_KEY
);

// Validates the deployed VAPID keypair, not application code — meaningless
// without any real key material, so skip cleanly when this environment (e.g.
// a sandbox) has neither configured. Skip only on "neither set", not "either
// set": a broken half-configured keypair (one key present, one missing) must
// still fail the per-key assertions below rather than being silently skipped.
describe.skipIf(!hasAnyVapidKey)("VAPID Keys Validation", () => {
  it("should have VAPID_PUBLIC_KEY set", () => {
    const key = process.env.VAPID_PUBLIC_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(60);
    // VAPID public keys are base64url encoded, 65-byte uncompressed EC point
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should have VAPID_PRIVATE_KEY set", () => {
    const key = process.env.VAPID_PRIVATE_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(30);
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should have VITE_VAPID_PUBLIC_KEY matching VAPID_PUBLIC_KEY", () => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const vitePub = process.env.VITE_VAPID_PUBLIC_KEY;
    expect(vitePub).toBeDefined();
    expect(vitePub).toBe(pub);
  });

  it("should be able to initialize web-push with VAPID keys", async () => {
    const webpush = await import("web-push");
    expect(() => {
      webpush.setVapidDetails(
        "mailto:admin@chalkpicks.live",
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );
    }).not.toThrow();
  });
});
