/**
 * Global Data Site (SportsData.io) API Client
 * 
 * Provides real-time odds, scores, player stats, and game data
 * for NFL, NBA, MLB, NHL integration.
 * 
 * API Keys (set in env):
 *   GLOBAL_DATA_SITE_KEY - Primary subscription key (Ocp-Apim-Subscription-Key header)
 *   GLOBAL_DATA_SITE_SECRET - Secret key for premium endpoints
 * 
 * Docs: https://sportsdata.io/developers/api-documentation
 */

const BASE_URL = "https://api.sportsdata.io/v3";

interface GameScore {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "Scheduled" | "InProgress" | "Final" | "Postponed";
  dateTime: string;
}

interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
}

interface OddsData {
  gameId: string;
  sportsbook: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  overUnder: number;
  timestamp: string;
}

function getApiKey(): string {
  const key = process.env.GLOBAL_DATA_SITE_KEY || process.env.BABYLOVEGROWTH_API_KEY || "";
  if (!key) {
    console.warn("[GlobalDataSite] No API key configured");
  }
  return key;
}

async function apiRequest<T>(path: string, sport: string = "nfl"): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = `${BASE_URL}/${sport}/scores/json/${path}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      console.error(`[GlobalDataSite] ${resp.status} ${resp.statusText} for ${path}`);
      return null;
    }
    return (await resp.json()) as T;
  } catch (err) {
    console.error(`[GlobalDataSite] Request failed for ${path}:`, err);
    return null;
  }
}

/**
 * Check if any games are currently in progress for a sport
 */
export async function areGamesInProgress(sport: string = "nfl"): Promise<boolean> {
  const result = await apiRequest<boolean>("AreAnyGamesInProgress", sport);
  return result ?? false;
}

/**
 * Get today's scores for a sport
 */
export async function getTodayScores(sport: string = "nfl"): Promise<GameScore[]> {
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const result = await apiRequest<any[]>(`ScoresByDate/${today}`, sport);
  if (!result) return [];
  return result.map((g) => ({
    gameId: g.GameID?.toString() ?? g.ScoreID?.toString() ?? "",
    homeTeam: g.HomeTeam ?? "",
    awayTeam: g.AwayTeam ?? "",
    homeScore: g.HomeScore ?? 0,
    awayScore: g.AwayScore ?? 0,
    status: g.Status ?? "Scheduled",
    dateTime: g.DateTime ?? "",
  }));
}

/**
 * Get live odds for upcoming games
 */
export async function getLiveOdds(sport: string = "nfl"): Promise<OddsData[]> {
  const result = await apiRequest<any[]>("GameOddsByWeek/2024REG/1", sport);
  if (!result) return [];
  return result.flatMap((g) =>
    (g.PregameOdds ?? []).map((o: any) => ({
      gameId: g.GameID?.toString() ?? "",
      sportsbook: o.Sportsbook ?? "",
      homeMoneyline: o.HomeMoneyLine ?? 0,
      awayMoneyline: o.AwayMoneyLine ?? 0,
      spread: o.HomePointSpread ?? 0,
      overUnder: o.OverUnder ?? 0,
      timestamp: o.Created ?? "",
    }))
  );
}

/**
 * Get player stats for a specific game
 */
export async function getPlayerStats(
  sport: string,
  gameId: string
): Promise<PlayerStats[]> {
  const result = await apiRequest<any[]>(`PlayerGameStatsByGame/${gameId}`, sport);
  if (!result) return [];
  return result.map((p) => ({
    playerId: p.PlayerID ?? 0,
    name: p.Name ?? "",
    team: p.Team ?? "",
    position: p.Position ?? "",
    stats: {
      points: p.Points ?? p.FantasyPoints ?? 0,
      assists: p.Assists ?? 0,
      rebounds: p.Rebounds ?? 0,
    },
  }));
}

export default {
  areGamesInProgress,
  getTodayScores,
  getLiveOdds,
  getPlayerStats,
};
