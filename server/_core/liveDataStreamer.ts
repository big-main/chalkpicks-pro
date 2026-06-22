import { broadcastToChannel } from "../websocket";

/**
 * Live Data Streamer
 * 
 * Manages real-time data updates for:
 * - Live scores from ESPN
 * - Kalshi market movements
 * - Odds changes from sportsbooks
 * - Leaderboard updates
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

/**
 * Stream live scores to all connected clients
 */
export async function streamLiveScores() {
  // Fetch from ESPN API
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
  // Fetch from Kalshi API
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
  // Fetch from multiple sportsbook APIs
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
  // Fetch from database
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
 * Fetch live scores from ESPN
 */
async function fetchLiveScores(): Promise<LiveScore[]> {
  try {
    const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
    const data = await response.json();

    return data.events.map((event: any) => ({
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
  } catch (error) {
    console.error("[LiveDataStreamer] Error fetching live scores:", error);
    return [];
  }
}

/**
 * Fetch Kalshi markets
 */
async function fetchKalshiMarkets(): Promise<KalshiMarket[]> {
  try {
    // This would use the Kalshi API
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error("[LiveDataStreamer] Error fetching Kalshi markets:", error);
    return [];
  }
}

/**
 * Fetch odds updates from multiple sportsbooks
 */
async function fetchOddsUpdates(): Promise<OddsUpdate[]> {
  try {
    // This would aggregate odds from multiple sportsbooks
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error("[LiveDataStreamer] Error fetching odds updates:", error);
    return [];
  }
}

/**
 * Fetch leaderboard from database
 */
async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // This would query the database for leaderboard data
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error("[LiveDataStreamer] Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Start real-time data streaming
 * Runs every 5 seconds to update all clients
 */
export function startLiveDataStreaming() {
  console.log("[LiveDataStreamer] Starting real-time data streaming...");

  // Stream live scores every 5 seconds
  setInterval(streamLiveScores, 5000);

  // Stream Kalshi markets every 10 seconds
  setInterval(streamKalshiMarkets, 10000);

  // Stream odds updates every 15 seconds
  setInterval(streamOddsUpdates, 15000);

  // Stream leaderboard updates every 30 seconds
  setInterval(streamLeaderboardUpdates, 30000);

  console.log("[LiveDataStreamer] Real-time data streaming started");
}
