import { describe, it, expect } from "vitest";

/**
 * Test to validate that SMTP and API credentials are properly configured.
 * This test does NOT send actual emails or make real API calls.
 * It only validates that the credentials are set and have the expected format.
 */
describe("Secrets Configuration", () => {
  it("should have SMTP credentials configured", () => {
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_USER).toBe("admin@chalkpicks.live");
    
    expect(process.env.SMTP_PASS).toBeDefined();
    expect(process.env.SMTP_PASS?.length).toBeGreaterThan(0);
    
    expect(process.env.SMTP_FROM).toBeDefined();
    expect(process.env.SMTP_FROM).toBe("admin@chalkpicks.live");
  });

  it("should have BabyLoveGrowth API key configured", () => {
    expect(process.env.BABYLOVEGROWTH_API_KEY).toBeDefined();
    expect(process.env.BABYLOVEGROWTH_API_KEY).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("should validate SMTP credentials format", () => {
    const smtpUser = process.env.SMTP_USER;
    expect(smtpUser).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("should validate BabyLoveGrowth API key format (UUID)", () => {
    const apiKey = process.env.BABYLOVEGROWTH_API_KEY;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(apiKey).toMatch(uuidRegex);
  });
});
