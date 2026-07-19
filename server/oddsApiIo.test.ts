import { describe, it, expect } from "vitest";

describe("odds-api.io integration", () => {
  it("should have ODDS_API_IO_KEY set in environment", () => {
    const key = process.env.ODDS_API_IO_KEY;
    expect(key).toBeTruthy();
    expect(key?.length).toBeGreaterThan(20);
  });

  it("should fetch upcoming MLB events from odds-api.io", async () => {
    const key = process.env.ODDS_API_IO_KEY;
    if (!key) {
      console.warn("ODDS_API_IO_KEY not set — skipping live API test");
      return;
    }

    const res = await fetch(
      `https://api.odds-api.io/v3/events?apiKey=${key}&sport=baseball`,
      { signal: AbortSignal.timeout(10000) }
    );

    expect(res.ok).toBe(true);
    const data = await res.json() as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Verify the response shape matches what fetchOddsFromIo expects
    const first = data[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("home");
    expect(first).toHaveProperty("away");
    expect(first).toHaveProperty("date");
    expect(first).toHaveProperty("status");
    expect(first).toHaveProperty("league");
  }, 15000);
});
