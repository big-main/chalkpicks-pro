/**
 * Twitter/X Bot Service — Direct posting via OAuth 1.0a (User Context)
 * Uses twitter-api-v2 with Consumer Key/Secret + Access Token/Secret
 * No token refresh needed — OAuth 1.0a tokens don't expire
 */
import { TwitterApi } from "twitter-api-v2";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// --- Twitter Client ---
function getTwitterClient(): TwitterApi | null {
  if (!ENV.twitterConsumerKey || !ENV.twitterAccessToken) {
    console.log("[TwitterBot] Missing credentials — skipping post");
    return null;
  }
  return new TwitterApi({
    appKey: ENV.twitterConsumerKey,
    appSecret: ENV.twitterConsumerSecret,
    accessToken: ENV.twitterAccessToken,
    accessSecret: ENV.twitterAccessSecret,
  });
}

// --- Helpers ---
function getSportEmoji(sportKey: string): string {
  const map: Record<string, string> = {
    americanfootball_nfl: "🏈",
    basketball_nba: "🏀",
    baseball_mlb: "⚾",
    icehockey_nhl: "🏒",
    soccer_epl: "⚽",
    soccer_mls: "⚽",
    mma_mixed_martial_arts: "🥊",
    tennis_atp: "🎾",
    golf_pga: "⛳",
  };
  return map[sportKey] ?? "🎯";
}

function getConfidenceBar(score: number | null): string {
  const s = score ?? 0;
  const filled = Math.round(s / 20);
  return "█".repeat(filled) + "░".repeat(5 - filled);
}

function formatOdds(odds: string | number | null): string {
  if (!odds) return "N/A";
  const n = typeof odds === "string" ? parseFloat(odds) : odds;
  if (isNaN(n)) return String(odds);
  return n > 0 ? `+${n}` : String(n);
}

function getToday(): string {
  const now = new Date();
  // Convert to Pacific Time (UTC-7 in summer)
  const pt = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return pt.toISOString().split("T")[0];
}

function getYesterday(): string {
  const now = new Date();
  const pt = new Date(now.getTime() - 7 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return pt.toISOString().split("T")[0];
}

function getTomorrow(): string {
  const now = new Date();
  const pt = new Date(now.getTime() - 7 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
  return pt.toISOString().split("T")[0];
}

// --- Tweet Generators ---
export async function generateMorningTweet(): Promise<string> {
  const today = getToday();
  const db = await getDb();
  if (!db) return `🎯 FREE DAILY PICK\n\nOur AI is crunching today's slate. Pick drops shortly!\n\n🔓 chalkpicks.live/picks\n\n#FreePick #SportsBetting #ChalkPicks`;
  const topPick = await db
    .select()
    .from(picks)
    .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
    .orderBy(desc(picks.confidenceScore))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!topPick) {
    return `🎯 FREE DAILY PICK\n\nOur AI is crunching today's slate. Pick drops shortly!\n\n🔓 Get all picks: chalkpicks.live/picks\n\n#FreePick #SportsBetting #ChalkPicks`;
  }

  const emoji = getSportEmoji(topPick.sportKey);
  const bar = getConfidenceBar(topPick.confidenceScore);
  const odds = formatOdds(topPick.odds);
  const sportTag = topPick.sportKey.split("_")[1]?.toUpperCase() ?? "SPORTS";

  const tweet = `${emoji} FREE DAILY PICK\n\n🏆 ${topPick.pickType.toUpperCase()}: ${topPick.homeTeam ?? ""} vs ${topPick.awayTeam ?? ""}\n📈 Confidence: ${bar} ${topPick.confidenceScore}%\n💰 Odds: ${odds}\n\n${(topPick.recommendation ?? "").slice(0, 80)}...\n\n🔓 Full analysis: chalkpicks.live/picks\n\n#FreePick #SportsBetting #${sportTag}`;
  return tweet.slice(0, 280);
}

export async function generateAfternoonTweet(): Promise<string> {
  const today = getToday();
  const db = await getDb();
  if (!db) return `🔥 SHARP MONEY ALERT\n\nScanning for line movement.\n\n⚡ chalkpicks.live/sharp-money\n\n#SharpMoney #SportsBetting #ChalkPicks`;
  const topEdgePick = await db
    .select()
    .from(picks)
    .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
    .orderBy(desc(picks.edgeScore))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!topEdgePick) {
    return `🔥 SHARP MONEY ALERT\n\nOur steam move detector is scanning 40+ sportsbooks for line movement.\n\n⚡ Get real-time alerts: chalkpicks.live/sharp-money\n\n#SharpMoney #SteamMove #SportsBetting #ChalkPicks`;
  }

  const emoji = getSportEmoji(topEdgePick.sportKey);
  const edgeScore = Number(topEdgePick.edgeScore ?? 0);
  const edgeDisplay = edgeScore > 0 ? `+${edgeScore.toFixed(1)}%` : `${edgeScore.toFixed(1)}%`;

  const tweet = `🔥 SHARP MONEY ALERT ${emoji}\n\n${topEdgePick.homeTeam ?? ""} vs ${topEdgePick.awayTeam ?? ""}\n📊 Edge: ${edgeDisplay}\n💡 ${(topEdgePick.recommendation ?? "Sharp action detected").slice(0, 80)}...\n\n⚡ Real-time alerts: chalkpicks.live/sharp-money\n\n#SharpMoney #SteamMove #SportsBetting`;
  return tweet.slice(0, 280);
}

export async function generateEveningTweet(): Promise<string> {
  const yesterday = getYesterday();
  const db = await getDb();
  if (!db) return `📊 DAILY RESULTS\n\nResults being graded. Check back soon!\n\n📈 chalkpicks.live/picks\n\n#SportsBetting #Results #ChalkPicks`;
  const yesterdayPicks = await db
    .select()
    .from(picks)
    .where(eq(picks.pickDate, yesterday))
    .orderBy(desc(picks.confidenceScore));

  const resolved = yesterdayPicks.filter((p: any) => p.result && p.result !== "pending");
  const wins = resolved.filter((p: any) => p.result === "win").length;
  const losses = resolved.filter((p: any) => p.result === "loss").length;
  const pushes = resolved.filter((p: any) => p.result === "push").length;
  const total = wins + losses + pushes;
  const winRate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

  if (total === 0) {
    return `📊 DAILY RESULTS\n\nYesterday's picks are still being graded. Check back soon!\n\n📈 Track our record: chalkpicks.live/picks\n\n#SportsBetting #Results #ChalkPicks`;
  }

  const record = `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ""}`;
  const resultEmoji = winRate >= 60 ? "🔥" : winRate >= 50 ? "✅" : "📊";

  const tweet = `${resultEmoji} YESTERDAY'S RESULTS\n\n📊 Record: ${record} (${winRate}% win rate)\n${wins > 0 ? `✅ ${wins} WIN${wins > 1 ? "S" : ""}` : ""}${losses > 0 ? `\n❌ ${losses} LOSS${losses > 1 ? "ES" : ""}` : ""}${pushes > 0 ? `\n➡️ ${pushes} PUSH${pushes > 1 ? "ES" : ""}` : ""}\n\n📈 Full history: chalkpicks.live/picks\n🎯 Today's picks are live!\n\n#SportsBetting #Results #ChalkPicks`;
  return tweet.slice(0, 280);
}

export async function generateNightTweet(): Promise<string> {
  const tomorrow = getTomorrow();
  const db = await getDb();
  if (!db) return `🌙 TOMORROW'S PREVIEW\n\nAI analyzing tomorrow's slate. Free pick at 8am PT.\n\n🔔 chalkpicks.live\n\n#SportsBetting #Preview #ChalkPicks`;
  const tomorrowTopPick = await db
    .select()
    .from(picks)
    .where(and(eq(picks.pickDate, tomorrow), eq(picks.isActive, true)))
    .orderBy(desc(picks.confidenceScore))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!tomorrowTopPick) {
    return `🌙 TOMORROW'S PREVIEW\n\nOur AI is analyzing tomorrow's slate overnight. Free daily pick drops at 8am PT.\n\n🔔 Get notified: chalkpicks.live\n\n#SportsBetting #Preview #ChalkPicks`;
  }

  const emoji = getSportEmoji(tomorrowTopPick.sportKey);
  const tweet = `🌙 TOMORROW'S TOP GAME ${emoji}\n\n${tomorrowTopPick.homeTeam ?? ""} vs ${tomorrowTopPick.awayTeam ?? ""}\n🎯 Confidence: ${tomorrowTopPick.confidenceScore}%\n\n${(tomorrowTopPick.recommendation ?? "AI analysis coming soon").slice(0, 80)}...\n\n🔓 Full pick at 8am PT\nchalkpicks.live/picks\n\n#SportsBetting #Preview #ChalkPicks`;
  return tweet.slice(0, 280);
}

// --- Post Tweet ---
export async function postTweet(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const client = getTwitterClient();
  if (!client) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  try {
    const rwClient = client.readWrite;
    const result = await rwClient.v2.tweet(text);
    console.log(`[TwitterBot] Posted tweet: ${result.data.id}`);
    return { success: true, tweetId: result.data.id };
  } catch (err: any) {
    const errorMsg = err?.message ?? String(err);
    console.error(`[TwitterBot] Failed to post tweet:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

// --- Scheduled Post Functions ---
export async function postMorningPick(): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const tweet = await generateMorningTweet();
  console.log(`[TwitterBot] Morning pick tweet (${tweet.length} chars): ${tweet.slice(0, 50)}...`);
  return postTweet(tweet);
}

export async function postAfternoonAlert(): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const tweet = await generateAfternoonTweet();
  console.log(`[TwitterBot] Afternoon alert tweet (${tweet.length} chars): ${tweet.slice(0, 50)}...`);
  return postTweet(tweet);
}

export async function postEveningResults(): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const tweet = await generateEveningTweet();
  console.log(`[TwitterBot] Evening results tweet (${tweet.length} chars): ${tweet.slice(0, 50)}...`);
  return postTweet(tweet);
}

export async function postNightPreview(): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const tweet = await generateNightTweet();
  console.log(`[TwitterBot] Night preview tweet (${tweet.length} chars): ${tweet.slice(0, 50)}...`);
  return postTweet(tweet);
}
