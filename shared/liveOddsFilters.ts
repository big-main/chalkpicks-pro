export type LiveOddsSort =
  | "latest"
  | "odds_desc"
  | "odds_asc"
  | "line_desc"
  | "line_asc"
  | "team";

export interface LiveOddsFilterState {
  search: string;
  sportsbook: string;
  market: string;
  movementOnly: boolean;
  sort: LiveOddsSort;
}

export interface LiveOddsFilterRow {
  homeTeam?: string | null;
  awayTeam?: string | null;
  sportsbook?: string | null;
  marketType?: string | null;
  selection?: string | null;
  oddsAmerican?: number | string | null;
  line?: number | string | null;
  timestamp?: string | number | Date | null;
  direction?: "up" | "down" | "stable" | null;
}

function numberOrNull(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function timeOrNull(value: LiveOddsFilterRow["timestamp"]): number | null {
  if (value === null || value === undefined || value === "") return null;
  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function compareNullable(
  a: number | null,
  b: number | null,
  descending = false
) {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return descending ? b - a : a - b;
}

export function filterAndSortLiveOdds<T extends LiveOddsFilterRow>(
  rows: readonly T[],
  filters: LiveOddsFilterState
): T[] {
  const search = filters.search.trim().toLowerCase();
  const sportsbook = filters.sportsbook.toLowerCase();
  const market = filters.market.toLowerCase();

  return rows
    .filter(row => {
      if (
        search &&
        ![
          row.homeTeam,
          row.awayTeam,
          row.sportsbook,
          row.marketType,
          row.selection,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      )
        return false;
      if (
        filters.sportsbook !== "all" &&
        row.sportsbook?.toLowerCase() !== sportsbook
      )
        return false;
      if (filters.market !== "all" && row.marketType?.toLowerCase() !== market)
        return false;
      if (
        filters.movementOnly &&
        (!row.direction || row.direction === "stable")
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "odds_desc":
          return compareNullable(
            numberOrNull(a.oddsAmerican),
            numberOrNull(b.oddsAmerican),
            true
          );
        case "odds_asc":
          return compareNullable(
            numberOrNull(a.oddsAmerican),
            numberOrNull(b.oddsAmerican)
          );
        case "line_desc":
          return compareNullable(
            numberOrNull(a.line),
            numberOrNull(b.line),
            true
          );
        case "line_asc":
          return compareNullable(numberOrNull(a.line), numberOrNull(b.line));
        case "team":
          return `${a.awayTeam ?? ""} ${a.homeTeam ?? ""}`.localeCompare(
            `${b.awayTeam ?? ""} ${b.homeTeam ?? ""}`
          );
        case "latest":
        default:
          return compareNullable(
            timeOrNull(a.timestamp),
            timeOrNull(b.timestamp),
            true
          );
      }
    });
}
