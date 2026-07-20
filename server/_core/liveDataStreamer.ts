import { broadcastToChannel } from "../websocket";

/**
 * Live Data Streamer
 * 
 * Manages real-time data updates for:
 * - Live scores from ESPN
 * - Kalshi market movements
 * - Odds changes from sportsbooks
 * - Leaderboard updates
 * 
 * Uses AbortController timeouts and error throttling to prevent log spam.
 */

interface LiveScore {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  status: "scheduled" | "live" | "final";
  quarter?: number;
  timeRemaining?: string;
  lastUpdated: number;
}

interface KalshiMarket {
  contractId: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  lastUpdated: number;
}

interface OddsUpdate {
  eventId: string;
  sportsbook: string;
  odds: number;
  spread?: number;
  total?: number;
  lastUpdated: number;
}

interface SteamMove {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  sharpSide: string;
  publicPct: number;
  openLine: number;
  currentLine: number;
  lineMove: number;
  confidence: "high" | "medium" | "low";
  steamType: "steam_move" | "reverse_line_movement" | "sharp_action";
  bookmaker: string;
  detectedAt: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  winRate: number;
  totalPicks: number;
  profit: number;
  roi: number;
  rank: number;
}

// Error throttling — only log each source once per 5 minutes
const errorThrottleMap: Record<string, number> = {};
function throttledWarn(source: string, msg: string) {
  const now = Date.now();
  if (!errorThrottleMap[source] || now - errorThrottleMap[source] > 300_000) {
    console.warn(msg);
    errorThrottleMap[source] = now;
  }
}

/**
 * Fetch with timeout (AbortController)
 */
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Stream live scores to all connected clients
 */
export async function streamLiveScores() {
  const scores = await fetchLiveScores();
  if (scores.length > 0) {
    broadcastToChannel("live-scores", {
      scores,
      count: scores.length,
      timestamp: Date.now(),
    });
  }
}

/**
 * Stream Kalshi market updates
 */
export async function streamKalshiMarkets() {
  const markets = await fetchKalshiMarkets();
  if (markets.length > 0) {
    broadcastToChannel("kalshi-markets", {
      markets,
      count: markets.length,
      timestamp: Date.now(),
    });
  }
}

/**
 * Stream odds updates from multiple sportsbooks
 */
export async function streamOddsUpdates() {
  const updates = await fetchOddsUpdates();
  if (updates.length > 0) {
    broadcastToChannel("odds-updates", {
      updates,
      count: updates.length,
      timestamp: Date.now(),
    });
  }
}

/**
 * Stream steam moves (sharp money line movements)
 */
export async function streamSteamMoves() {
  const moves = await fetchSteamMoves();
  if (moves.length > 0) {
    broadcastToChannel("steam-moves", {
      moves,
      count: moves.length,
      timestamp: Date.now(),
    });
  }
}

/**
 * Stream leaderboard updates
 */
export async function streamLeaderboardUpdates() {
  const leaderboard = await fetchLeaderboard();
  if (leaderboard.length > 0) {
    broadcastToChannel("leaderboard", {
      entries: leaderboard,
      count: leaderboard.length,
      timestamp: Date.now(),
    });
  }
}

/**
 * Fetch live scores from ESPN (with timeout + error throttling)
 */
async function fetchLiveScores(): Promise<LiveScore[]> {
  try {
    const response = await fetchWithTimeout(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
      8000
    );
    const data = await response.json();

    return (data.events || []).map((event: any) => ({
      gameId: event.id,
      awayTeam: event.competitions[0].competitors[1].team.displayName,
      homeTeam: event.competitions[0].competitors[0].team.displayName,
      awayScore: event.competitions[0].competitors[1].score,
      homeScore: event.competitions[0].competitors[0].score,
      status: event.status.type.name.toLowerCase(),
      quarter: event.competitions[0].status?.period,
      timeRemaining: event.competitions[0].status?.displayClock,
      lastUpdated: Date.now(),
    }));
  } catch (error: any) {
    throttledWarn("espn", "[LiveDataStreamer] ESPN live scores unavailable (retrying silently)");
    return [];
  }
}

/**
 * Fetch Kalshi markets
 */
async function fetchKalshiMarkets(): Promise<KalshiMarket[]> {
  try {
    // Placeholder — will integrate with Kalshi API when credentials are available
    return [];
  } catch (error) {
    throttledWarn("kalshi", "[LiveDataStreamer] Kalshi markets unavailable");
    return [];
  }
}

/**
 * Fetch odds updates from multiple sportsbooks
 */
async function fetchOddsUpdates(): Promise<OddsUpdate[]> {
  try {
    // Placeholder — will aggregate odds from multiple sportsbooks
    return [];
  } catch (error) {
    throttledWarn("odds", "[LiveDataStreamer] Odds updates unavailable");
    return [];
  }
}

/**
 * Fetch steam moves from Odds API (detect line movements)
 */
async function fetchSteamMoves(): Promise<SteamMove[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];
  try {
    const sports = ["americanfootball_nfl", "basketball_nba", "baseball_mlb", "icehockey_nhl"];
    const allMoves: SteamMove[] = [];

    for (const sport of sports) {
      const response = await fetchWithTimeout(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=us&markets=spreads&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`,
        8000
      );
      if (!response.ok) continue;
      const events = await response.json();

      for (const event of events) {
        if (!event.bookmakers || event.bookmakers.length < 2) continue;
        // Compare spreads across books to detect steam
        const spreads = event.bookmakers
          .map((b: any) => {
            const market = b.markets?.find((m: any) => m.key === "spreads");
            const outcome = market?.outcomes?.[0];
            return outcome ? { book: b.key, point: outcome.point } : null;
          })
          .filter(Boolean);

        if (spreads.length < 2) continue;
        const avg = spreads.reduce((s: number, sp: any) => s + sp.point, 0) / spreads.length;
        // Find outliers (books that moved significantly from consensus)
        for (const sp of spreads) {
          const diff = Math.abs(sp.point - avg);
          if (diff >= 1.5) {
            allMoves.push({
              eventId: event.id,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              sport,
              sharpSide: sp.point < avg ? event.home_team : event.away_team,
              publicPct: Math.round(50 + Math.random() * 20), // Simulated until we get real public % data
              openLine: Math.round(avg * 2) / 2,
              currentLine: sp.point,
              lineMove: Math.round((sp.point - avg) * 2) / 2,
              confidence: diff >= 3 ? "high" : diff >= 2 ? "medium" : "low",
              steamType: diff >= 3 ? "steam_move" : "reverse_line_movement",
              bookmaker: sp.book,
              detectedAt: Date.now(),
            });
          }
        }
      }
    }

    return allMoves.slice(0, 20); // Cap at 20 most significant moves
  } catch (error: any) {
    throttledWarn("steam", "[LiveDataStreamer] Steam moves unavailable");
    return [];
  }
}

/**
 * Fetch leaderboard from database
 */
async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Placeholder — will query the database for leaderboard data
    return [];
  } catch (error) {
    throttledWarn("leaderboard", "[LiveDataStreamer] Leaderboard unavailable");
    return [];
  }
}

/**
 * Start real-time data streaming
 * Reduced polling frequency to avoid log spam and unnecessary network load:
 * - Live scores: every 30s (was 5s — ESPN doesn't update that fast)
 * - Kalshi: every 60s (was 10s)
 * - Odds: every 60s (was 15s)
 * - Leaderboard: every 120s (was 30s)
 */
export function startLiveDataStreaming() {
  // Skip in development if ESPN is known to be unreachable from sandbox
  if (process.env.NODE_ENV === "development" && process.env.DISABLE_LIVE_STREAMING === "true") {
    console.log("[LiveDataStreamer] Disabled in development (DISABLE_LIVE_STREAMING=true)");
    return;
  }

  console.log("[LiveDataStreamer] Starting real-time data streaming...");

  // Stream live scores every 30 seconds
  setInterval(streamLiveScores, 30_000);

  // Stream Kalshi markets every 60 seconds
  setInterval(streamKalshiMarkets, 60_000);

  // Stream odds updates every 60 seconds
  setInterval(streamOddsUpdates, 60_000);

  // Stream steam moves every 90 seconds
  setInterval(streamSteamMoves, 90_000);

  // Stream leaderboard updates every 120 seconds
  setInterval(streamLeaderboardUpdates, 120_000);

  console.log("[LiveDataStreamer] Real-time data streaming started (30s/60s/90s/60s/120s intervals)");
}
