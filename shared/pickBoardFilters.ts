export type DatePreset = "today" | "tomorrow" | "next7" | "upcoming" | "custom";
export type SortOption =
  | "confidence_desc"
  | "confidence_asc"
  | "edge_desc"
  | "edge_asc"
  | "newest"
  | "oldest"
  | "odds_best"
  | "game_time_asc"
  | "game_time_desc";

export interface FilterState {
  sport: string;
  tier: string;
  pickType: string;
  result: string;
  minConfidence: number;
  minEdge: number;
  sortBy: SortOption;
  sportsbook: string;
  datePreset: DatePreset;
  searchQuery: string;
  customDateFrom: string;
  customDateTo: string;
}

export const DEFAULT_FILTERS: FilterState = {
  sport: "all",
  tier: "all",
  pickType: "all",
  result: "pending",
  minConfidence: 0,
  minEdge: 0,
  sortBy: "confidence_desc",
  sportsbook: "all",
  datePreset: "upcoming",
  searchQuery: "",
  customDateFrom: "",
  customDateTo: "",
};

const SORT_VALUES: readonly SortOption[] = [
  "confidence_desc",
  "confidence_asc",
  "edge_desc",
  "edge_asc",
  "newest",
  "oldest",
  "odds_best",
  "game_time_asc",
  "game_time_desc",
];
const DATE_VALUES: readonly DatePreset[] = [
  "today",
  "tomorrow",
  "next7",
  "upcoming",
  "custom",
];

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}

/** Whitelist persisted fields rather than trusting localStorage JSON. */
export function sanitizePickBoardFilters(input: unknown): FilterState {
  const stored =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const option = (
    value: unknown,
    allowed: readonly string[],
    fallback: string
  ) =>
    typeof value === "string" && allowed.includes(value) ? value : fallback;
  const threshold = (value: unknown, max: number) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(max, Math.max(0, value))
      : 0;

  return {
    sport: option(
      stored.sport,
      [
        "all",
        "nfl",
        "nba",
        "mlb",
        "nhl",
        "ncaaf",
        "ncaab",
        "soccer",
        "tennis",
        "mma",
      ],
      "all"
    ),
    tier: option(stored.tier, ["all", "free", "premium"], "all"),
    pickType: option(
      stored.pickType,
      ["all", "moneyline", "spread", "over_under", "player_prop", "parlay"],
      "all"
    ),
    result: "pending",
    minConfidence: threshold(stored.minConfidence, 95),
    minEdge: threshold(stored.minEdge, 9),
    sortBy: option(
      stored.sortBy,
      SORT_VALUES,
      DEFAULT_FILTERS.sortBy
    ) as SortOption,
    sportsbook: option(
      stored.sportsbook,
      [
        "all",
        "DraftKings",
        "FanDuel",
        "BetMGM",
        "Caesars",
        "PointsBet",
        "BetRivers",
        "WynnBET",
        "Barstool",
      ],
      "all"
    ),
    datePreset: option(
      stored.datePreset,
      DATE_VALUES,
      DEFAULT_FILTERS.datePreset
    ) as DatePreset,
    searchQuery:
      typeof stored.searchQuery === "string"
        ? stored.searchQuery.slice(0, 200)
        : "",
    customDateFrom: isCalendarDate(stored.customDateFrom)
      ? stored.customDateFrom
      : "",
    customDateTo: isCalendarDate(stored.customDateTo)
      ? stored.customDateTo
      : "",
  };
}

/** Inclusive local-calendar ranges; null prevents queries for incomplete/reversed custom ranges. */
export function getPickBoardDateRange(
  filters: Pick<FilterState, "datePreset" | "customDateFrom" | "customDateTo">,
  now = new Date()
): { dateFrom: string; dateTo: string } | null {
  if (filters.datePreset === "custom") {
    const { customDateFrom: dateFrom, customDateTo: dateTo } = filters;
    return isCalendarDate(dateFrom) &&
      isCalendarDate(dateTo) &&
      dateFrom <= dateTo
      ? { dateFrom, dateTo }
      : null;
  }
  const start = new Date(now);
  if (filters.datePreset === "tomorrow") start.setDate(start.getDate() + 1);
  const end = new Date(start);
  // Next 7 Days includes today and the following six calendar days.
  if (filters.datePreset === "next7") end.setDate(end.getDate() + 6);
  if (filters.datePreset === "upcoming") end.setDate(end.getDate() + 14);
  return { dateFrom: localDate(start), dateTo: localDate(end) };
}

type DateValue = Date | string | number | null;
export interface PickBoardPick {
  sportKey?: string | null;
  tier?: string | null;
  pickType?: string | null;
  result?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  recommendation?: string | null;
  confidenceScore?: number | string | null;
  edgeScore?: number | string | null;
  odds?: number | string | null;
  bookmakerName?: string | null;
  aiAnalysis?: string | null;
  gameTime?: DateValue;
  pickDate?: string | null;
  createdAt?: DateValue;
}

function timestamp(value: DateValue | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getPickGameTime(pick: PickBoardPick): number | null {
  // Prefer verified game start timestamps; fall back to the published pick date, never creation time.
  return (
    timestamp(pick.gameTime) ??
    (isCalendarDate(pick.pickDate)
      ? timestamp(`${pick.pickDate}T00:00:00`)
      : null)
  );
}

export function americanOddsToDecimal(
  odds: number | string | null | undefined
): number | null {
  if (
    odds === null ||
    odds === undefined ||
    (typeof odds === "string" && !odds.trim())
  )
    return null;
  const value = Number(odds);
  if (!Number.isFinite(value) || Math.abs(value) < 100) return null;
  return value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
}

/** Missing/invalid values always sort last, in either direction. */
function compareValues(
  a: number | null,
  b: number | null,
  descending = false
): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return descending ? b - a : a - b;
}

export function filterAndSortPickBoard<T extends PickBoardPick>(
  picks: readonly T[],
  filters: FilterState,
  now = new Date()
): T[] {
  const range = getPickBoardDateRange(filters, now);
  if (!range) return [];
  const search = filters.searchQuery.trim().toLowerCase();
  const sportsbook = filters.sportsbook.toLowerCase();
  const filtered = picks.filter(pick => {
    if (pick.result && pick.result !== "pending") return false;
    if (filters.sport !== "all" && pick.sportKey !== filters.sport)
      return false;
    if (filters.tier !== "all" && pick.tier !== filters.tier) return false;
    if (filters.pickType !== "all" && pick.pickType !== filters.pickType)
      return false;
    if (
      filters.minConfidence > 0 &&
      !(Number(pick.confidenceScore ?? 0) >= filters.minConfidence)
    )
      return false;
    if (
      filters.minEdge > 0 &&
      !(Number(pick.edgeScore ?? 0) >= filters.minEdge)
    )
      return false;
    if (
      filters.sportsbook !== "all" &&
      !pick.bookmakerName?.toLowerCase().includes(sportsbook) &&
      !pick.aiAnalysis?.toLowerCase().includes(sportsbook)
    )
      return false;
    if (
      search &&
      ![pick.homeTeam, pick.awayTeam, pick.recommendation]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
      return false;
    const gameTime = getPickGameTime(pick);
    if (gameTime === null) return false;
    const date = localDate(new Date(gameTime));
    return date >= range.dateFrom && date <= range.dateTo;
  });

  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "confidence_desc":
        return Number(b.confidenceScore ?? 0) - Number(a.confidenceScore ?? 0);
      case "confidence_asc":
        return Number(a.confidenceScore ?? 0) - Number(b.confidenceScore ?? 0);
      case "edge_desc":
        return Number(b.edgeScore ?? 0) - Number(a.edgeScore ?? 0);
      case "edge_asc":
        return Number(a.edgeScore ?? 0) - Number(b.edgeScore ?? 0);
      case "newest":
        return compareValues(
          timestamp(a.createdAt),
          timestamp(b.createdAt),
          true
        );
      case "oldest":
        return compareValues(timestamp(a.createdAt), timestamp(b.createdAt));
      case "game_time_asc":
        return compareValues(getPickGameTime(a), getPickGameTime(b));
      case "game_time_desc":
        return compareValues(getPickGameTime(a), getPickGameTime(b), true);
      case "odds_best":
        return compareValues(
          americanOddsToDecimal(a.odds),
          americanOddsToDecimal(b.odds),
          true
        );
      default:
        return 0;
    }
  });
}
