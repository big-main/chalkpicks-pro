import { describe, expect, it } from "vitest";
import {
  filterAndSortLiveOdds,
  type LiveOddsFilterRow,
} from "../shared/liveOddsFilters";

const rows: LiveOddsFilterRow[] = [
  {
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    sportsbook: "DraftKings",
    marketType: "spreads",
    selection: "Lakers -3.5",
    oddsAmerican: -105,
    line: -3.5,
    timestamp: "2026-11-15T12:00:00Z",
    direction: "up",
  },
  {
    homeTeam: "Chiefs",
    awayTeam: "Bills",
    sportsbook: "FanDuel",
    marketType: "moneyline",
    selection: "Chiefs ML",
    oddsAmerican: 125,
    line: null,
    timestamp: "2026-11-15T12:02:00Z",
    direction: "stable",
  },
  {
    homeTeam: "Lakers",
    awayTeam: "Warriors",
    sportsbook: "DraftKings",
    marketType: "totals",
    selection: "Over 224.5",
    oddsAmerican: -115,
    line: 224.5,
    timestamp: "2026-11-15T12:04:00Z",
    direction: "down",
  },
];

const base = {
  search: "",
  sportsbook: "all",
  market: "all",
  movementOnly: false,
  sort: "latest" as const,
};

describe("live odds filters", () => {
  it("filters across teams, selections, books, and markets", () => {
    expect(
      filterAndSortLiveOdds(rows, {
        ...base,
        search: "lakers",
        sportsbook: "DraftKings",
        market: "spreads",
      })
    ).toHaveLength(1);
  });

  it("can isolate moving lines", () => {
    expect(
      filterAndSortLiveOdds(rows, { ...base, movementOnly: true })
    ).toHaveLength(2);
  });

  it("sorts latest updates first and supports numeric odds ordering", () => {
    expect(filterAndSortLiveOdds(rows, base).map(row => row.homeTeam)).toEqual([
      "Lakers",
      "Chiefs",
      "Lakers",
    ]);
    expect(
      filterAndSortLiveOdds(rows, { ...base, sort: "odds_desc" }).map(
        row => row.oddsAmerican
      )
    ).toEqual([125, -105, -115]);
  });
});
