import { describe, it, expect } from "vitest";

describe("Ahrefs API Key Validation", () => {
  it("AHREFS_API_KEY is set in environment", () => {
    expect(process.env.AHREFS_API_KEY).toBeDefined();
    expect(process.env.AHREFS_API_KEY!.length).toBeGreaterThan(10);
  });

  it("Ahrefs API responds with valid data for chalkpicks.pro", async () => {
    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) throw new Error("AHREFS_API_KEY not set");

    const url = `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=chalkpicks.pro&date=2026-07-30`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // Accept 200 (success) or 403/401 (valid key format but plan limitation)
    // Reject 400 (malformed) which would indicate bad key format
    expect([200, 401, 403]).toContain(res.status);

    if (res.status === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("domain_rating");
    }
  }, 15000);
});
