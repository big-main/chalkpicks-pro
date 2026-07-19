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

  // Stream leaderboard updates every 120 seconds
  setInterval(streamLeaderboardUpdates, 120_000);

  console.log("[LiveDataStreamer] Real-time data streaming started (30s/60s/60s/120s intervals)");
}
