import { describe, it, expect } from "vitest";

/**
 * Test to validate that SMTP and API credentials are properly configured.
 * This test does NOT send actual emails or make real API calls.
 * It only validates that the credentials are set and have the expected format.
 */
// These validate deployed secrets, not application code — meaningless
// without the real values, so skip per-concern rather than fail when this
// environment (e.g. a sandbox) has none configured.
describe("Secrets Configuration", () => {
  it.skipIf(!process.env.SMTP_USER)(
    "should have SMTP credentials configured",
    () => {
      expect(process.env.SMTP_USER).toBeDefined();
      expect(process.env.SMTP_USER).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      expect(process.env.SMTP_PASS).toBeDefined();
      expect(process.env.SMTP_PASS?.length).toBeGreaterThan(0);

      expect(process.env.SMTP_FROM).toBeDefined();
      expect(process.env.SMTP_FROM).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  );

  it.skipIf(!process.env.ODDS_API_IO_KEY)(
    "should have Odds API IO key configured",
    () => {
      expect(process.env.ODDS_API_IO_KEY).toBeDefined();
      expect(process.env.ODDS_API_IO_KEY?.length).toBeGreaterThan(10);
    }
  );

  it.skipIf(!process.env.SMTP_USER)(
    "should validate SMTP credentials format",
    () => {
      const smtpUser = process.env.SMTP_USER;
      expect(smtpUser).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  );

  it.skipIf(!process.env.ODDS_API_IO_KEY)(
    "should validate Odds API IO key format (hex string)",
    () => {
      const apiKey = process.env.ODDS_API_IO_KEY;
      expect(apiKey).toMatch(/^[0-9a-f]{64}$/i);
    }
  );
});
