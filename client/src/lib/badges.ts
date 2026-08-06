/**
 * Badge class helpers — maps sport keys and tier names to CSS badge classes
 * defined in index.css. All classes use the 5-color palette:
 * NFL=blue, NBA=cyan, MLB=green, NHL=red, NCAAF/NCAAB=gold
 * Tiers: free=slate, daily=blue, monthly=cyan, yearly/premium=gold
 */

/** Canonical sport key → short display label map */
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

export function getSportBadgeClass(
  sportKey: string | null | undefined
): string {
  const key = (sportKey ?? "").toLowerCase();
  if (key.includes("nfl") || key.includes("americanfootball_nfl"))
    return "badge-nfl";
  if (key.includes("nba") || key.includes("basketball_nba")) return "badge-nba";
  if (key.includes("mlb") || key.includes("baseball_mlb")) return "badge-mlb";
  if (key.includes("nhl") || key.includes("icehockey_nhl")) return "badge-nhl";
  if (key.includes("ncaaf") || key.includes("americanfootball_ncaaf"))
    return "badge-ncaaf";
  if (key.includes("ncaab") || key.includes("basketball_ncaab"))
    return "badge-ncaab";
  // fallback — use blue for unknown sports
  return "badge-daily";
}

export function getTierBadgeClass(tier: string | null | undefined): string {
  const t = (tier ?? "free").toLowerCase();
  if (t === "premium" || t === "yearly") return "badge-yearly";
  if (t === "monthly") return "badge-monthly";
  if (t === "daily") return "badge-daily";
  return "badge-free";
}

export function getEVBadgeClass(ev: number | null | undefined): string {
  const val = Number(ev ?? 0);
  if (val >= 5) return "badge-ev-high";
  if (val > 0) return "badge-ev-pos";
  return "badge-ev-neg";
}

export function getConfidenceColor(
  confidence: number | null | undefined
): string {
  const val = Number(confidence ?? 0);
  if (val >= 80) return "#22c55e"; // green — high confidence
  if (val >= 65) return "#f59e0b"; // gold — medium confidence
  return "#ef4444"; // red — low confidence
}
