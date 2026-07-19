/**
 * Sports Data Provider — Multi-Source Free API Layer
 * 
 * Replaces SportsData.io (paid, keys expired) with free alternatives:
 * 
 * 1. API-Sports.io (100 req/day free forever) — Player stats, injuries, standings
 *    - NFL: https://v1.american-football.api-sports.io
 *    - NBA: https://v1.basketball.api-sports.io
 *    - MLB: https://v1.baseball.api-sports.io
 *    - NHL: https://v1.hockey.api-sports.io
 * 
 * 2. ESPN (unofficial, unlimited) — Scores, schedules, injuries, standings
 * 
 * Env: API_SPORTS_KEY (free key from https://dashboard.api-football.com/)
 *       If not set, falls back to ESPN-only data (still works).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GameScore {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "Scheduled" | "InProgress" | "Final" | "Postponed";
  dateTime: string;
}

export interface PlayerStats {
  playerId: number;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
}

export interface InjuryReport {
  playerName: string;
  team: string;
  status: "Out" | "Doubtful" | "Questionable" | "Probable" | "Day-to-Day";
  description: string;
  sport: string;
}

export interface TeamStanding {
  team: string;
  wins: number;
  losses: number;
  winPct: number;
  conference: string;
  division: string;
}

// ─── API-Sports Config ──────────────────────────────────────────────────────

const API_SPORTS_HOSTS: Record<string, string> = {
  nfl: "v1.american-football.api-sports.io",
  nba: "v1.basketball.api-sports.io",
  mlb: "v1.baseball.api-sports.io",
  nhl: "v1.hockey.api-sports.io",
};

const CURRENT_SEASONS: Record<string, string> = {
  nfl: "2025",
  nba: "2025-2026",
  mlb: "2026",
  nhl: "2025-2026",
};

const LEAGUE_IDS: Record<string, number> = {
  nfl: 1,
  nba: 12,
  mlb: 1,
  nhl: 57,
};

// ─── Rate Limiter (100 req/day) ─────────────────────────────────────────────

let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 95;

function checkRateLimit(): boolean {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
  return dailyRequestCount < DAILY_LIMIT;
}

// ─── In-Memory Cache ────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  if (cache.size > 200) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].expires - b[1].expires)
      .slice(0, 50);
    oldest.forEach(([k]) => cache.delete(k));
  }
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ─── Core Request ───────────────────────────────────────────────────────────

async function apiSportsRequest<T>(
  sport: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const apiKey = process.env.API_SPORTS_KEY;
  if (!apiKey) return null;
  if (!checkRateLimit()) {
    console.warn("[SportsData] Daily rate limit reached (100 req/day)");
    return null;
  }

  const host = API_SPORTS_HOSTS[sport.toLowerCase()];
  if (!host) return null;

  const cacheKey = `${sport}:${endpoint}:${JSON.stringify(params)}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const queryString = new URLSearchParams(params).toString();
  const url = `https://${host}/${endpoint}${queryString ? `?${queryString}` : ""}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    dailyRequestCount++;

    if (!response.ok) {
      console.error(`[SportsData] API-Sports ${response.status}: ${url}`);
      return null;
    }

    const json = (await response.json()) as { response?: T; errors?: unknown };
    if (json.errors && Object.keys(json.errors as object).length > 0) {
      console.error(`[SportsData] API error:`, json.errors);
      return null;
    }

    const data = json.response ?? null;
    setCache(cacheKey, data, 30 * 60 * 1000);
    return data as T;
  } catch (err) {
    console.error(`[SportsData] Fetch failed: ${(err as Error).message}`);
    return null;
  }
}

// ─── ESPN Fallback (free, unlimited) ────────────────────────────────────────

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_SPORT_MAP: Record<string, string> = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl",
};

async function espnRequest<T>(sport: string, endpoint: string): Promise<T | null> {
  const espnPath = ESPN_SPORT_MAP[sport.toLowerCase()];
  if (!espnPath) return null;

  const cacheKey = `espn:${sport}:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${ESPN_BASE}/${espnPath}/${endpoint}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = (await response.json()) as T;
    setCache(cacheKey, data, 5 * 60 * 1000);
    return data;
  } catch {
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function areGamesInProgress(sport: string = "nfl"): Promise<boolean> {
  const scores = await getTodayScores(sport);
  return scores.some((g) => g.status === "InProgress");
}

export async function getTodayScores(sport: string = "nfl"): Promise<GameScore[]> {
  const espnData = await espnRequest<any>(sport, "scoreboard");
  if (espnData?.events) {
    return espnData.events.map((event: any) => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
      const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
      const statusType = comp?.status?.type?.name;
      let status: GameScore["status"] = "Scheduled";
      if (statusType === "STATUS_IN_PROGRESS") status = "InProgress";
      else if (statusType === "STATUS_FINAL") status = "Final";
      else if (statusType === "STATUS_POSTPONED") status = "Postponed";
      return {
        gameId: event.id ?? "",
        homeTeam: home?.team?.displayName ?? "",
        awayTeam: away?.team?.displayName ?? "",
        homeScore: Number(home?.score) || 0,
        awayScore: Number(away?.score) || 0,
        status,
        dateTime: event.date ?? "",
      };
    });
  }
  return [];
}

export async function getInjuries(sport: string = "nfl"): Promise<InjuryReport[]> {
  const season = CURRENT_SEASONS[sport.toLowerCase()];
  const leagueId = LEAGUE_IDS[sport.toLowerCase()];
  if (!season || !leagueId) return [];

  const data = await apiSportsRequest<any[]>(sport, "injuries", {
    league: leagueId.toString(),
    season,
  });

  if (data && Array.isArray(data)) {
    return data.map((injury: any) => ({
      playerName: injury.player?.name ?? "Unknown",
      team: injury.team?.name ?? "",
      status: mapInjuryStatus(injury.player?.status ?? ""),
      description: injury.player?.reason ?? "",
      sport,
    }));
  }

  // ESPN fallback
  const espnData = await espnRequest<any>(sport, "injuries");
  if (!espnData?.items) return [];
  return espnData.items.slice(0, 50).map((item: any) => ({
    playerName: item.athlete?.displayName ?? "Unknown",
    team: item.team?.displayName ?? "",
    status: mapInjuryStatus(item.status ?? ""),
    description: item.longComment ?? item.shortComment ?? "",
    sport,
  }));
}

export async function getStandings(sport: string = "nfl"): Promise<TeamStanding[]> {
  const season = CURRENT_SEASONS[sport.toLowerCase()];
  const leagueId = LEAGUE_IDS[sport.toLowerCase()];
  if (!season || !leagueId) return [];

  const data = await apiSportsRequest<any[]>(sport, "standings", {
    league: leagueId.toString(),
    season,
  });

  if (data && Array.isArray(data)) {
    return data.flatMap((group: any) => {
      const teams = group?.table ?? group ?? [];
      if (!Array.isArray(teams)) return [];
      return teams.map((t: any) => ({
        team: t.team?.name ?? "",
        wins: Number(t.games?.win?.total ?? t.won ?? 0),
        losses: Number(t.games?.lose?.total ?? t.lost ?? 0),
        winPct: t.games?.win?.total
          ? Number(t.games.win.total) / (Number(t.games.win.total) + Number(t.games.lose.total))
          : 0,
        conference: group.conference ?? group.group?.name ?? "",
        division: group.division ?? "",
      }));
    });
  }

  // ESPN fallback
  const espnData = await espnRequest<any>(sport, "standings");
  if (!espnData?.children) return [];
  return espnData.children.flatMap((conf: any) =>
    (conf.standings?.entries ?? []).map((entry: any) => {
      const wins = Number(entry.stats?.find((s: any) => s.name === "wins")?.value ?? 0);
      const losses = Number(entry.stats?.find((s: any) => s.name === "losses")?.value ?? 0);
      return {
        team: entry.team?.displayName ?? "",
        wins,
        losses,
        winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
        conference: conf.name ?? "",
        division: "",
      };
    })
  );
}

export async function getPlayerStats(sport: string, gameId: string): Promise<PlayerStats[]> {
  const data = await apiSportsRequest<any[]>(sport, "games/statistics", { id: gameId });
  if (!data) return [];
  return data.flatMap((team: any) => {
    const players = team.players ?? [];
    return players.map((p: any) => ({
      playerId: Number(p.player?.id) || 0,
      name: p.player?.name ?? "Unknown",
      team: team.team?.name ?? "",
      position: p.player?.position ?? "",
      stats: flattenStats(p.statistics ?? p.stats ?? {}),
    }));
  });
}

export function getRemainingRequests(): { used: number; remaining: number; limit: number } {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
  return { used: dailyRequestCount, remaining: DAILY_LIMIT - dailyRequestCount, limit: DAILY_LIMIT };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapInjuryStatus(status: string): InjuryReport["status"] {
  const s = status.toLowerCase();
  if (s.includes("out")) return "Out";
  if (s.includes("doubtful")) return "Doubtful";
  if (s.includes("questionable")) return "Questionable";
  if (s.includes("probable")) return "Probable";
  return "Day-to-Day";
}

function flattenStats(stats: any): Record<string, number> {
  const flat: Record<string, number> = {};
  if (Array.isArray(stats)) {
    stats.forEach((group: any) => {
      if (group && typeof group === "object") {
        Object.entries(group).forEach(([k, v]) => {
          if (typeof v === "number") flat[k] = v;
          else if (typeof v === "string" && !isNaN(Number(v))) flat[k] = Number(v);
        });
      }
    });
  } else if (typeof stats === "object") {
    Object.entries(stats).forEach(([k, v]) => {
      if (typeof v === "number") flat[k] = v;
      else if (typeof v === "string" && !isNaN(Number(v))) flat[k] = Number(v);
    });
  }
  return flat;
}

export default {
  areGamesInProgress,
  getTodayScores,
  getInjuries,
  getStandings,
  getPlayerStats,
  getRemainingRequests,
};
