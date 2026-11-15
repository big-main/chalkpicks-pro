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

  it("normalizes CFBD and BALLDONTLIE records into the shared game contract", async () => {
    vi.stubEnv("CFBD_API_KEY", "test-cfbd-key");
    vi.stubEnv("BALLDONTLIE_API_KEY", "test-bdl-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 42,
            start_date: "2099-09-01T19:00:00Z",
            completed: false,
            away_team: "Away U",
            home_team: "Home U",
            away_score: null,
            home_score: null,
            venue: "Test Stadium",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 7,
              date: "2099-09-02T00:00:00Z",
              status: "Final",
              visitor_team: { full_name: "Away NBA" },
              home_team: { full_name: "Home NBA" },
              visitor_team_score: 101,
              home_team_score: 99,
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const [cfbd, nba] = await Promise.all([
      getCollegeFootballGames({ year: 2099 }),
      getNbaGames("2099-09-02"),
    ]);
    expect(cfbd.data[0]).toMatchObject({
      provider: "CollegeFootballData",
      sport: "ncaaf",
      awayTeam: "Away U",
      homeTeam: "Home U",
    });
    expect(nba.data[0]).toMatchObject({
      provider: "BALLDONTLIE",
      sport: "nba",
      awayTeam: "Away NBA",
      homeTeam: "Home NBA",
      awayScore: 101,
      homeScore: 99,
    });
    vi.unstubAllGlobals();
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
