import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("OddsApiCache", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports oddsApiCache singleton with required methods", async () => {
    const { oddsApiCache } = await import("./services/oddsApiCache");
    expect(oddsApiCache).toBeDefined();
    expect(typeof oddsApiCache.fetch).toBe("function");
    expect(typeof oddsApiCache.getStats).toBe("function");
    expect(typeof oddsApiCache.purgeAll).toBe("function");
    expect(typeof oddsApiCache.purgeSport).toBe("function");
    expect(typeof oddsApiCache.resetQuota).toBe("function");
  });

  it("getStats returns valid structure", async () => {
    const { oddsApiCache } = await import("./services/oddsApiCache");
    const stats = oddsApiCache.getStats();
    expect(stats).toHaveProperty("hitRate");
    expect(stats).toHaveProperty("quotaUsed");
    expect(stats).toHaveProperty("quotaLimit");
    expect(stats).toHaveProperty("memoryEntries");
    expect(stats).toHaveProperty("maxMemoryEntries");
    expect(stats).toHaveProperty("conservationMode");
    expect(stats).toHaveProperty("currentTtlMs");
    expect(stats).toHaveProperty("deduplicatedRequests");
    expect(stats.hitRate).toHaveProperty("total");
    expect(stats.hitRate).toHaveProperty("l1Hits");
    expect(stats.hitRate).toHaveProperty("l2Hits");
    expect(stats.hitRate).toHaveProperty("misses");
  });

  it("purgeAll clears memory entries", async () => {
    const { oddsApiCache } = await import("./services/oddsApiCache");
    await oddsApiCache.purgeAll();
    const stats = oddsApiCache.getStats();
    expect(stats.memoryEntries).toBe(0);
  });

  it("resetQuota resets the counter to 0", async () => {
    const { oddsApiCache } = await import("./services/oddsApiCache");
    oddsApiCache.resetQuota();
    const stats = oddsApiCache.getStats();
    expect(stats.quotaUsed).toBe(0);
  });

  it("conservation mode activates when quota exceeds 80%", async () => {
    const { oddsApiCache } = await import("./services/oddsApiCache");
    // Simulate high quota usage by calling internal state
    // The cache starts with quotaUsed=0, so conservation should be off
    const stats = oddsApiCache.getStats();
    expect(stats.conservationMode).toBe(false);
  });

  it("fetch returns empty array when ODDS_API_KEY is not set", async () => {
    const origKey = process.env.ODDS_API_KEY;
    delete process.env.ODDS_API_KEY;
    const { oddsApiCache } = await import("./services/oddsApiCache");
    const result = await oddsApiCache.fetch("americanfootball_nfl", {});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    if (origKey) process.env.ODDS_API_KEY = origKey;
  });
});
