import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkSportsProviders,
  getCollegeFootballGames,
  getNbaGames,
} from "./services/additionalSportsProviders";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("additional sports providers", () => {
  it("returns an explicit unavailable state when CFBD is not configured", async () => {
    vi.stubEnv("CFBD_API_KEY", "");
    const result = await getCollegeFootballGames({ year: 2026 });
    expect(result).toEqual({
      available: false,
      reason: "CFBD_API_KEY is not configured",
      data: [],
    });
  });

  it("returns an explicit unavailable state when BALLDONTLIE is not configured", async () => {
    vi.stubEnv("BALLDONTLIE_API_KEY", "");
    const result = await getNbaGames("2026-11-15");
    expect(result).toEqual({
      available: false,
      reason: "BALLDONTLIE_API_KEY is not configured",
      data: [],
    });
  });

  it("reports missing credentials without making network calls", async () => {
    vi.stubEnv("CFBD_API_KEY", "");
    vi.stubEnv("BALLDONTLIE_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkSportsProviders();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.map(provider => provider.status)).toEqual([
      "missing_key",
      "missing_key",
    ]);
    fetchSpy.mockRestore();
  });

  it.skipIf(!process.env.CFBD_API_KEY || !process.env.BALLDONTLIE_API_KEY)(
    "accepts the configured provider credentials",
    async () => {
      const result = await checkSportsProviders();
      expect(result).toHaveLength(2);
      expect(result.map(provider => provider.status)).toEqual([
        "healthy",
        "healthy",
      ]);
      expect(result.every(provider => provider.latencyMs !== null)).toBe(true);
    },
    30_000
  );
});
