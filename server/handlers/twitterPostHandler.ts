/**
 * Twitter Post Handler
 * Called by Manus Heartbeat cron 4x/day to post picks, alerts, results, and previews.
 * Endpoint: POST /api/scheduled/twitter-post
 *
 * Slots:
 *   morning   — 8am PT (15:00 UTC) — free daily pick (thread for high-confidence)
 *   afternoon — 1pm PT (20:00 UTC) — sharp money / steam alert
 *   evening   — 6pm PT (01:00 UTC) — yesterday results recap
 *   night     — 9pm PT (04:00 UTC) — tomorrow preview
 *
 * High-confidence picks (≥80%) post as a 3-tweet thread:
 *   Tweet 1: Headline + recommendation
 *   Tweet 2: AI analysis snippet + key factors
 *   Tweet 3: CTA + link
 *
 * Uses Twitter API v2 OAuth 1.0a (consumer key + access token from ENV).
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { desc, gte, eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

type Slot = "morning" | "afternoon" | "evening" | "night";

// ─── OAuth 1.0a helper ────────────────────────────────────────────────────────
function oauthHeader(method: string, url: string, params: Record<string, string>): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: ENV.twitterConsumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ENV.twitterAccessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const sigBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join("&");

  const sigKey = `${encodeURIComponent(ENV.twitterConsumerSecret)}&${encodeURIComponent(ENV.twitterAccessSecret)}`;
  const signature = crypto.createHmac("sha1", sigKey).update(sigBase).digest("base64");

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

// ─── Post a single tweet ──────────────────────────────────────────────────────
async function postTweet(
  text: string,
  replyToId?: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  if (!ENV.twitterConsumerKey || !ENV.twitterAccessToken) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  const url = "https://api.twitter.com/2/tweets";
  const bodyObj: Record<string, any> = { text };
  if (replyToId) {
    bodyObj.reply = { in_reply_to_tweet_id: replyToId };
  }
  const body = JSON.stringify(bodyObj);
  const auth = oauthHeader("POST", url, {});

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(15000),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
    }
    return { success: true, tweetId: data?.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Post a thread (array of tweet texts) ────────────────────────────────────
async function postThread(
  tweets: string[]
): Promise<{ success: boolean; tweetIds: string[]; error?: string }> {
  const tweetIds: string[] = [];
  let lastId: string | undefined;

  for (const text of tweets) {
    const result = await postTweet(text, lastId);
    if (!result.success) {
      return { success: false, tweetIds, error: result.error };
    }
    tweetIds.push(result.tweetId!);
    lastId = result.tweetId;
    // Small delay between thread tweets to avoid rate limit
    await new Promise((r) => setTimeout(r, 1200));
  }

  return { success: true, tweetIds };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatOdds(odds: number | null | undefined): string {
  if (!odds) return "N/A";
  return odds > 0 ? `+${odds}` : String(odds);
}

function confidenceBar(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function sportHashtag(sportKey: string | null | undefined): string {
  const map: Record<string, string> = {
    americanfootball_nfl: "#NFL",
    basketball_nba: "#NBA",
    baseball_mlb: "#MLB",
    icehockey_nhl: "#NHL",
    americanfootball_ncaaf: "#NCAAF",
    basketball_ncaab: "#NCAAB",
    mma_mixed_martial_arts: "#MMA #UFC",
    soccer_epl: "#EPL #Soccer",
  };
  return map[sportKey ?? ""] ?? "#SportsBetting";
}

// ─── Morning: single tweet or 3-tweet thread for high-confidence picks ────────
async function buildMorningContent(
  db: any
): Promise<{ isThread: boolean; tweets: string[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const topPicks = await db
    .select()
    .from(picks)
    .where(gte(picks.createdAt, today))
    .orderBy(desc(picks.confidenceScore))
    .limit(1);

  if (!topPicks.length) {
    return {
      isThread: false,
      tweets: [
        `🏆 ChalkPicks AI is scanning today's slate for the sharpest edge.\n\nFull picks + analysis → chalkpicks.live\n#SportsBetting #Picks #AI`,
      ],
    };
  }

  const p = topPicks[0];
  const odds = formatOdds(p.odds as number);
  const conf = p.confidenceScore ?? 0;
  const emoji = conf >= 80 ? "🔥" : conf >= 70 ? "⚡" : "🎯";
  const sport = sportHashtag(p.sportKey);

  // High-confidence: post as a 3-tweet thread
  if (conf >= 80) {
    const keyFactors: string[] = (() => {
      try {
        const parsed = JSON.parse(p.keyFactors as string ?? "[]");
        return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
      } catch {
        return [];
      }
    })();

    const tweet1 = `${emoji} HIGH-CONFIDENCE PICK — ${conf}% AI Confidence\n\n${p.homeTeam} vs ${p.awayTeam}\n📊 ${p.recommendation} ${odds}\n\n[1/3] Full breakdown below 👇\n${sport} #Picks #SharpMoney`;

    const tweet2 =
      keyFactors.length > 0
        ? `📈 KEY FACTORS:\n\n${keyFactors.map((f: string) => `• ${f}`).join("\n")}\n\nConfidence: ${confidenceBar(conf)} ${conf}%\n\n[2/3]`
        : `📈 AI ANALYSIS:\n\n${(p.aiAnalysis as string ?? "").substring(0, 180)}...\n\nConfidence: ${confidenceBar(conf)} ${conf}%\n\n[2/3]`;

    const tweet3 = `🔗 Full AI analysis, edge %, and best odds:\nchalkpicks.live/picks/${p.id}\n\nJoin 2,000+ sharp bettors using ChalkPicks Pro 🎯\n\n[3/3] ${sport} #SportsBetting`;

    return { isThread: true, tweets: [tweet1, tweet2, tweet3] };
  }

  // Standard single tweet
  return {
    isThread: false,
    tweets: [
      `${emoji} TODAY'S TOP PICK\n\n${p.homeTeam} vs ${p.awayTeam}\n📊 ${p.recommendation} ${odds}\n💯 Confidence: ${conf}%\n\nFull AI analysis → chalkpicks.live\n${sport} #Picks`,
    ],
  };
}

async function buildAfternoonTweet(db: any): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sharpPicks = await db
    .select()
    .from(picks)
    .where(and(gte(picks.createdAt, today), gte(picks.confidenceScore, 75)))
    .orderBy(desc(picks.confidenceScore))
    .limit(3);

  if (!sharpPicks.length) {
    return `📡 Sharp money scanner active — monitoring 40+ sportsbooks for line movement.\n\nCatch steam moves before they close → chalkpicks.live/sharp-money\n#SharpMoney #LineMoves #SportsBetting`;
  }

  const lines = sharpPicks
    .map((p: any) => `• ${p.homeTeam} vs ${p.awayTeam} — ${p.recommendation} (${p.confidenceScore}%)`)
    .join("\n");

  return `📡 SHARP MONEY ALERT\n\nAI flagged ${sharpPicks.length} high-confidence plays today:\n${lines}\n\nFull analysis → chalkpicks.live\n#SharpMoney #SportsBetting #Picks`;
}

async function buildEveningTweet(db: any): Promise<string> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const settled = await db
    .select()
    .from(picks)
    .where(gte(picks.createdAt, yesterday))
    .orderBy(desc(picks.createdAt))
    .limit(10);

  const wins = settled.filter((p: any) => p.result === "win").length;
  const losses = settled.filter((p: any) => p.result === "loss").length;
  const total = wins + losses;

  if (total === 0) {
    return `📊 Results pending for today's picks. Check back tonight for the full recap.\n\nTrack every pick → chalkpicks.live\n#SportsBetting #Results`;
  }

  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const emoji = winRate >= 60 ? "🔥" : winRate >= 50 ? "✅" : "📊";

  return `${emoji} YESTERDAY'S RESULTS\n\n${wins}W - ${losses}L (${winRate}% win rate)\n\nAll picks tracked with full transparency → chalkpicks.live\n#SportsBetting #Results #Picks`;
}

async function buildNightTweet(_db: any): Promise<string> {
  return `🌙 TOMORROW'S PREVIEW\n\nOur AI is analyzing tomorrow's full slate across NFL, NBA, MLB, and more.\n\nEarly picks drop at 8am PT → chalkpicks.live\n\nSet your lineup now 🎯\n#SportsBetting #Picks #AI`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function twitterPostHandler(req: Request, res: Response) {
  const slot = (req.body?.slot || req.query?.slot || "morning") as Slot;
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  console.log(`[TwitterPost] Triggered slot=${slot} task=${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    let result: { success: boolean; tweetIds?: string[]; tweetId?: string; error?: string };
    let preview: string;
    let isThread = false;

    if (slot === "morning") {
      const content = await buildMorningContent(db);
      isThread = content.isThread;
      preview = content.tweets[0].substring(0, 100) + "...";

      if (content.isThread) {
        const threadResult = await postThread(content.tweets);
        result = { success: threadResult.success, tweetIds: threadResult.tweetIds, error: threadResult.error };
        console.log(`[TwitterPost] Thread posted slot=${slot} tweetIds=${threadResult.tweetIds.join(",")}`);
      } else {
        const singleResult = await postTweet(content.tweets[0]);
        result = { success: singleResult.success, tweetId: singleResult.tweetId, error: singleResult.error };
        console.log(`[TwitterPost] Single tweet posted slot=${slot} tweetId=${singleResult.tweetId}`);
      }
    } else {
      let tweetText: string;
      switch (slot) {
        case "afternoon": tweetText = await buildAfternoonTweet(db); break;
        case "evening":   tweetText = await buildEveningTweet(db); break;
        case "night":     tweetText = await buildNightTweet(db); break;
        default:          tweetText = await buildNightTweet(db);
      }
      preview = tweetText.substring(0, 100) + (tweetText.length > 100 ? "..." : "");
      const singleResult = await postTweet(tweetText);
      result = { success: singleResult.success, tweetId: singleResult.tweetId, error: singleResult.error };

      if (result.success) {
        console.log(`[TwitterPost] Posted slot=${slot} tweetId=${result.tweetId}`);
      } else {
        console.warn(`[TwitterPost] Failed slot=${slot}: ${result.error}`);
      }
    }

    res.json({
      ok: true,
      slot,
      isThread,
      tweetId: result.tweetId,
      tweetIds: result.tweetIds,
      success: result.success,
      error: result.error,
      preview,
    });
  } catch (error: any) {
    console.error("[TwitterPost] Error:", error);
    res.status(500).json({
      error: error.message || "Unknown error",
      slot,
      timestamp: new Date().toISOString(),
    });
  }
}
