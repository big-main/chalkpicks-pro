/**
 * Shared sport label utility — usable from both server and client.
 * Maps any sport key format to a clean short display label.
 */

const SPORT_LABEL_MAP: Record<string, string> = {
  // Odds API / The Odds API format
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAAF",
  basketball_nba: "NBA",
  basketball_ncaab: "NCAAB",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
  soccer_epl: "EPL",
  soccer_usa_mls: "MLS",
  soccer: "Soccer",
  mma: "MMA",
  boxing: "Boxing",
  tennis: "Tennis",
  golf: "Golf",
  // SharpAPI / short format
  nfl: "NFL",
  nba: "NBA",
  mlb: "MLB",
  nhl: "NHL",
  ncaaf: "NCAAF",
  ncaab: "NCAAB",
  epl: "EPL",
  mls: "MLS",
};

/**
 * Convert any sport key format to a clean short display label.
 * e.g. "americanfootball_nfl" → "NFL", "basketball_nba" → "NBA"
 */
export function formatSportLabel(sportKey: string | null | undefined): string {
  if (!sportKey) return "";
  const key = sportKey.toLowerCase().trim();
  if (SPORT_LABEL_MAP[key]) return SPORT_LABEL_MAP[key];
  // Fallback: strip known prefixes and uppercase
  return key
    .replace(
      /^americanfootball_|^basketball_|^baseball_|^icehockey_|^soccer_/i,
      ""
    )
    .toUpperCase();
}
