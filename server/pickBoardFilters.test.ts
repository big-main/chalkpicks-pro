import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  americanOddsToDecimal,
  filterAndSortPickBoard,
  getPickBoardDateRange,
  getPickGameTime,
  sanitizePickBoardFilters,
  type FilterState,
  type PickBoardPick,
} from "../shared/pickBoardFilters";

const now = new Date(2026, 10, 13, 12);
const filters = (overrides: Partial<FilterState> = {}): FilterState => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});
const pick = (id: number, overrides: Partial<PickBoardPick> = {}) => ({
  id,
  sportKey: "nba",
  tier: "premium",
  pickType: "moneyline",
  result: "pending",
  homeTeam: "Los Angeles Lakers",
  awayTeam: "Boston Celtics",
  recommendation: "Lakers ML",
  pickDate: "2026-11-13",
  confidenceScore: 85,
  edgeScore: "6.00",
  odds: -110,
  createdAt: new Date(2026, 10, 13, 8),
  ...overrides,
});
const ids = (picks: ReturnType<typeof pick>[]) => picks.map(p => p.id);

// Fixtures test filtering only; none are injected into the live board.
describe("pick board local-calendar ranges", () => {
  it.each([
    ["today", "2026-11-13", "2026-11-13"],
    ["tomorrow", "2026-11-14", "2026-11-14"],
    ["next7", "2026-11-13", "2026-11-19"],
    ["upcoming", "2026-11-13", "2026-11-27"],
  ] as const)("resolves %s inclusively", (datePreset, dateFrom, dateTo) => {
    expect(getPickBoardDateRange(filters({ datePreset }), now)).toEqual({
      dateFrom,
      dateTo,
    });
  });

  it("rolls tomorrow across year boundaries using local dates", () => {
    expect(
      getPickBoardDateRange(
        filters({ datePreset: "tomorrow" }),
        new Date(2026, 11, 31, 23)
      )
    ).toEqual({
      dateFrom: "2027-01-01",
      dateTo: "2027-01-01",
    });
  });

  it("supports a single-day custom range", () => {
    expect(
      getPickBoardDateRange(
        filters({
          datePreset: "custom",
          customDateFrom: "2026-11-14",
          customDateTo: "2026-11-14",
        }),
        now
      )
    ).toEqual({ dateFrom: "2026-11-14", dateTo: "2026-11-14" });
  });

  it.each([
    ["", "2026-11-14"],
    ["2026-11-14", ""],
    ["2026-11-15", "2026-11-14"],
    ["2026-02-30", "2026-11-14"],
    ["not-a-date", "2026-11-14"],
  ])(
    "rejects invalid/incomplete range %s – %s",
    (customDateFrom, customDateTo) => {
      const state = filters({
        datePreset: "custom",
        customDateFrom,
        customDateTo,
      });
      expect(getPickBoardDateRange(state, now)).toBeNull();
      expect(filterAndSortPickBoard([pick(1)], state, now)).toEqual([]);
    }
  );
});

describe("persisted board filters", () => {
  it.each([null, undefined, [], "bad storage", 7])(
    "handles non-object storage (%s)",
    input => {
      expect(sanitizePickBoardFilters(input)).toEqual(DEFAULT_FILTERS);
    }
  );

  it("migrates legacy filters with defaults for new fields and pending-only results", () => {
    expect(
      sanitizePickBoardFilters({
        sport: "nba",
        datePreset: "today",
        result: "win",
      })
    ).toEqual({
      ...DEFAULT_FILTERS,
      sport: "nba",
      datePreset: "today",
    });
  });

  it("preserves valid search, custom dates and game start sorting", () => {
    const state = filters({
      searchQuery: "Lakers",
      datePreset: "custom",
      customDateFrom: "2026-11-14",
      customDateTo: "2026-11-15",
      sortBy: "game_time_desc",
    });
    expect(sanitizePickBoardFilters(state)).toEqual(state);
  });

  it("sanitizes enum values, dates, thresholds and search types", () => {
    expect(
      sanitizePickBoardFilters({
        sport: {},
        tier: "monthly",
        pickType: 2,
        sportsbook: [],
        sortBy: "invalid",
        datePreset: "last30",
        searchQuery: {},
        minConfidence: Infinity,
        minEdge: -10,
        customDateFrom: "2026-02-30",
        customDateTo: 123,
        unknown: "discard me",
      })
    ).toEqual(DEFAULT_FILTERS);
    expect(
      sanitizePickBoardFilters({
        minConfidence: 200,
        minEdge: 20,
        searchQuery: "a".repeat(300),
      })
    ).toMatchObject({
      minConfidence: 95,
      minEdge: 9,
      searchQuery: "a".repeat(200),
    });
  });

  it("reset defaults clear search/custom ranges and restore the default sort", () => {
    expect(sanitizePickBoardFilters(DEFAULT_FILTERS)).toEqual({
      ...DEFAULT_FILTERS,
      searchQuery: "",
      customDateFrom: "",
      customDateTo: "",
      sortBy: "confidence_desc",
      datePreset: "upcoming",
    });
  });
});

describe("pick board filtering", () => {
  it.each(["  lAkErS  ", "boston", "ML"])(
    "searches either team and recommendations case-insensitively (%s)",
    searchQuery => {
      expect(
        ids(
          filterAndSortPickBoard(
            [
              pick(1),
              pick(2, { homeTeam: null, awayTeam: null, recommendation: null }),
            ],
            filters({ searchQuery }),
            now
          )
        )
      ).toEqual([1]);
    }
  );

  it("combines existing filters and keeps only active pending picks", () => {
    const state = filters({
      sport: "nba",
      tier: "premium",
      pickType: "moneyline",
      minConfidence: 80,
      minEdge: 5,
      sportsbook: "DraftKings",
      searchQuery: "Lakers",
    });
    expect(
      ids(
        filterAndSortPickBoard(
          [
            pick(1, { bookmakerName: "DraftKings" }),
            pick(2, { aiAnalysis: "Available at draftkings" }),
            pick(3, { bookmakerName: "DraftKings", result: "win" }),
            pick(4, { bookmakerName: "DraftKings", confidenceScore: 70 }),
            pick(5, { bookmakerName: "DraftKings", edgeScore: "4.5" }),
            pick(6, { bookmakerName: "FanDuel" }),
            pick(7, { bookmakerName: "DraftKings", pickType: "spread" }),
            pick(8, { bookmakerName: "DraftKings", sportKey: "nfl" }),
            pick(9, { bookmakerName: "DraftKings", tier: "free" }),
          ],
          state,
          now
        )
      )
    ).toEqual([1, 2]);
  });

  it("uses inclusive custom boundaries and excludes other dates", () => {
    const state = filters({
      datePreset: "custom",
      customDateFrom: "2026-11-14",
      customDateTo: "2026-11-15",
    });
    expect(
      ids(
        filterAndSortPickBoard(
          [
            pick(1),
            pick(2, { pickDate: "2026-11-14" }),
            pick(3, { pickDate: "2026-11-15" }),
            pick(4, { pickDate: "2026-11-16" }),
          ],
          state,
          now
        )
      )
    ).toEqual([2, 3]);
  });

  it("filters by actual local game day when a start time is available", () => {
    expect(
      ids(
        filterAndSortPickBoard(
          [pick(1, { gameTime: new Date(2026, 10, 14, 20) }), pick(2)],
          filters({ datePreset: "tomorrow" }),
          now
        )
      )
    ).toEqual([1]);
  });
});

describe("pick board sorting", () => {
  it("sorts soonest/latest by real game start, falling back to pickDate, not createdAt", () => {
    const picks = [
      pick(1, { pickDate: "2026-11-14", createdAt: new Date(2026, 10, 1) }),
      pick(2, { gameTime: new Date(2026, 10, 13, 20) }),
      pick(3, { gameTime: new Date(2026, 10, 13, 12) }),
      pick(4, { gameTime: "invalid", pickDate: "2026-11-15" }),
    ];
    expect(
      ids(
        filterAndSortPickBoard(picks, filters({ sortBy: "game_time_asc" }), now)
      )
    ).toEqual([3, 2, 1, 4]);
    expect(
      ids(
        filterAndSortPickBoard(
          picks,
          filters({ sortBy: "game_time_desc" }),
          now
        )
      )
    ).toEqual([4, 1, 2, 3]);
    expect(
      getPickGameTime({ gameTime: "invalid", pickDate: "2026-11-14" })
    ).toBe(new Date(2026, 10, 14).getTime());
    expect(getPickGameTime({ pickDate: "invalid", createdAt: now })).toBeNull();
  });

  it("converts both signs of American odds to comparable payout values", () => {
    expect(americanOddsToDecimal(150)).toBe(2.5);
    expect(americanOddsToDecimal("-200")).toBe(1.5);
    expect(americanOddsToDecimal("+100")).toBe(2);
    expect(americanOddsToDecimal(-100)).toBe(2);
  });

  it.each([null, undefined, "", "   ", "invalid", 0, Infinity, -50, 99])(
    "rejects missing/invalid odds (%s)",
    odds => {
      expect(americanOddsToDecimal(odds)).toBeNull();
    }
  );

  it("ranks payouts correctly across positive/negative odds, with missing odds last", () => {
    const picks = [
      pick(1, { odds: -200 }),
      pick(2, { odds: null }),
      pick(3, { odds: 150 }),
      pick(4, { odds: -110 }),
      pick(5, { odds: 100 }),
      pick(6, { odds: 0 }),
    ];
    expect(
      ids(filterAndSortPickBoard(picks, filters({ sortBy: "odds_best" }), now))
    ).toEqual([3, 5, 4, 1, 2, 6]);
    expect(ids(picks)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each([
    ["confidence_desc", [2, 1]],
    ["confidence_asc", [1, 2]],
    ["edge_desc", [2, 1]],
    ["edge_asc", [1, 2]],
    ["newest", [2, 1]],
    ["oldest", [1, 2]],
  ] as const)("preserves %s sorting", (sortBy, expected) => {
    expect(
      ids(
        filterAndSortPickBoard(
          [
            pick(1, {
              confidenceScore: 70,
              edgeScore: "2",
              createdAt: new Date(2026, 10, 13, 8),
            }),
            pick(2, {
              confidenceScore: 90,
              edgeScore: "8",
              createdAt: new Date(2026, 10, 13, 10),
            }),
          ],
          filters({ sortBy }),
          now
        )
      )
    ).toEqual(expected);
  });
});
