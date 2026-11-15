/**
 * Additional server-side sports providers. Keys never leave this module.
 * Free-tier requests are cached to reduce quota consumption.
 */
export type ProviderCheck = {
  provider: string;
  configured: boolean;
  status: "healthy" | "missing_key" | "error";
  checkedAt: string | null;
  latencyMs: number | null;
  message: string;
};

export type ProviderGame = {
  id: string;
  provider: "CollegeFootballData" | "BALLDONTLIE";
  sport: "ncaaf" | "nba";
  startTime: string | null;
  status: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  venue: string | null;
};

type CacheEntry = { expiresAt: number; value: unknown };
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function requestJson<T>(
  provider: string,
  url: string,
  headers: Record<string, string>,
  cacheKey: string,
  ttlMs = CACHE_TTL_MS
): Promise<T> {
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const response = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `${provider} request failed: ${response.status === 429 ? "rate limited" : `HTTP ${response.status}`}`
    );
  }

  const value = (await response.json()) as T;
  responseCache.set(cacheKey, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function getCollegeFootballGames(input: {
  year: number;
  week?: number;
  seasonType?: "regular" | "postseason" | "both";
}) {
  const key = process.env.CFBD_API_KEY;
  if (!key) {
    return {
      available: false as const,
      reason: "CFBD_API_KEY is not configured",
      data: [],
    };
  }

  const params = new URLSearchParams({ year: String(input.year) });
  if (input.week !== undefined) params.set("week", String(input.week));
  if (input.seasonType) params.set("seasonType", input.seasonType);

  const data = await requestJson<unknown[]>(
    "CollegeFootballData",
    `https://api.collegefootballdata.com/games?${params}`,
    { Authorization: `Bearer ${key}` },
    `cfbd:games:${params}`,
    10 * 60 * 1000
  );
  return {
    available: true as const,
    provider: "CollegeFootballData",
    fetchedAt: new Date().toISOString(),
    data: data.map(normalizeCfbdGame),
  };
}

export async function getNbaGames(date: string) {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) {
    return {
      available: false as const,
      reason: "BALLDONTLIE_API_KEY is not configured",
      data: [],
    };
  }

  const params = new URLSearchParams();
  params.append("dates[]", date);
  params.set("per_page", "100");
  const result = await requestJson<{ data?: unknown[]; meta?: unknown }>(
    "BALLDONTLIE",
    `https://api.balldontlie.io/v1/games?${params}`,
    { Authorization: key },
    `balldontlie:games:${date}`,
    2 * 60 * 1000
  );
  return {
    available: true as const,
    provider: "BALLDONTLIE",
    fetchedAt: new Date().toISOString(),
    data: (result.data ?? []).map(normalizeNbaGame),
    pagination: result.meta ?? null,
  };
}

function normalizeCfbdGame(value: unknown): ProviderGame {
  const game = value as Record<string, unknown>;
  return {
    id: String(
      game.id ??
        `${game.away_id}-${game.home_id}-${game.start_date ?? "unknown"}`
    ),
    provider: "CollegeFootballData",
    sport: "ncaaf",
    startTime: typeof game.start_date === "string" ? game.start_date : null,
    status: game.completed === true ? "final" : "scheduled",
    awayTeam: String(game.away_team ?? "Away team"),
    homeTeam: String(game.home_team ?? "Home team"),
    awayScore: toNullableNumber(game.away_score),
    homeScore: toNullableNumber(game.home_score),
    venue: typeof game.venue === "string" ? game.venue : null,
  };
}

function normalizeNbaGame(value: unknown): ProviderGame {
  const game = value as Record<string, unknown>;
  const away = (game.visitor_team ?? {}) as Record<string, unknown>;
  const home = (game.home_team ?? {}) as Record<string, unknown>;
  return {
    id: String(game.id ?? "unknown"),
    provider: "BALLDONTLIE",
    sport: "nba",
    startTime: typeof game.date === "string" ? game.date : null,
    status:
      typeof game.status === "string" ? game.status.toLowerCase() : "scheduled",
    awayTeam: String(away.full_name ?? away.abbreviation ?? "Away team"),
    homeTeam: String(home.full_name ?? home.abbreviation ?? "Home team"),
    awayScore: toNullableNumber(game.visitor_team_score),
    homeScore: toNullableNumber(game.home_team_score),
    venue: null,
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function checkSportsProviders(): Promise<ProviderCheck[]> {
  return Promise.all([
    checkOne(
      "CollegeFootballData",
      process.env.CFBD_API_KEY,
      "https://api.collegefootballdata.com/teams",
      key => ({ Authorization: `Bearer ${key}` })
    ),
    checkOne(
      "BALLDONTLIE",
      process.env.BALLDONTLIE_API_KEY,
      "https://api.balldontlie.io/v1/teams",
      key => ({ Authorization: key })
    ),
  ]);
}

async function checkOne(
  provider: string,
  key: string | undefined,
  url: string,
  makeHeaders: (key: string) => Record<string, string>
): Promise<ProviderCheck> {
  if (!key) {
    return {
      provider,
      configured: false,
      status: "missing_key",
      checkedAt: new Date().toISOString(),
      latencyMs: null,
      message: "API key not configured",
    };
  }

  const started = Date.now();
  try {
    await requestJson(
      provider,
      url,
      makeHeaders(key),
      `health:${provider}`,
      60_000
    );
    return {
      provider,
      configured: true,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      message: "Provider responded successfully",
    };
  } catch (error) {
    return {
      provider,
      configured: true,
      status: "error",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      message:
        error instanceof Error ? error.message : "Provider request failed",
    };
  }
}
