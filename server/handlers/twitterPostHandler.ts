/**
 * Twitter Post Handler
 * Called by Manus Heartbeat cron 4x/day to post picks, alerts, results, and previews.
 * Endpoint: POST /api/scheduled/twitter-post
 *
 * Slots:
 *   morning  — 8am PT (15:00 UTC) — free daily pick
 *   afternoon — 1pm PT (20:00 UTC) — sharp money / steam alert
 *   evening  — 6pm PT (01:00 UTC) — yesterday results recap
 *   night    — 9pm PT (04:00 UTC) — tomorrow preview
 *
 * Uses Twitter API v2 OAuth 1.0a (consumer key + access token from ENV).
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks, leaderboard } from "../../drizzle/schema";
import { desc, gte, eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

type Slot = "morning" | "afternoon" | "evening" | "night";

// --- OAuth 1.0a helper ---
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

async function postTweet(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  if (!ENV.twitterConsumerKey || !ENV.twitterAccessToken) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text });
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

    const data = await res.json() as any;
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
    }
    return { success: true, tweetId: data?.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function formatOdds(odds: number | null | undefined): string {
  if (!odds) return "N/A";
  return odds > 0 ? `+${odds}` : String(odds);
}

async function buildMorningTweet(db: any): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const topPicks = await db.select().from(picks)
    .where(gte(picks.createdAt, today))
    .orderBy(desc(picks.confidenceScore))
    .limit(1);

  if (!topPicks.length) {
    return `🏆 ChalkPicks AI is scanning today's slate for the sharpest edge.\n\nFull picks + analysis → chalkpicks.live\n#SportsBetting #Picks #AI`;
  }

  const p = topPicks[0];
  const odds = formatOdds(p.odds as number);
  const conf = p.confidenceScore ?? 0;
  const emoji = conf >= 80 ? "🔥" : conf >= 70 ? "⚡" : "🎯";

  return `${emoji} TODAY'S TOP PICK\n\n${p.homeTeam} vs ${p.awayTeam}\n📊 ${p.recommendation} ${odds}\n💯 Confidence: ${conf}%\n\nFull AI analysis → chalkpicks.live\n#SportsBetting #${(p.sportKey ?? "sports").toUpperCase()} #Picks`;
}

async function buildAfternoonTweet(db: any): Promise<string> {
  // Sharp money / steam alert
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sharpPicks = await db.select().from(picks)
    .where(and(gte(picks.createdAt, today), gte(picks.confidenceScore, 75)))
    .orderBy(desc(picks.confidenceScore))
    .limit(3);

  if (!sharpPicks.length) {
    return `📡 Sharp money scanner active — monitoring 40+ sportsbooks for line movement.\n\nCatch steam moves before they close → chalkpicks.live/sharp-money\n#SharpMoney #LineMoves #SportsBetting`;
  }

  const lines = sharpPicks.map((p: any) =>
    `• ${p.homeTeam} vs ${p.awayTeam} — ${p.recommendation} (${p.confidenceScore}%)`
  ).join("\n");

  return `📡 SHARP MONEY ALERT\n\nAI flagged ${sharpPicks.length} high-confidence plays today:\n${lines}\n\nFull analysis → chalkpicks.live\n#SharpMoney #SportsBetting #Picks`;
}

async function buildEveningTweet(db: any): Promise<string> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settled = await db.select().from(picks)
    .where(and(gte(picks.createdAt, yesterday)))
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

async function buildNightTweet(db: any): Promise<string> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  return `🌙 TOMORROW'S PREVIEW\n\nOur AI is analyzing tomorrow's full slate across NFL, NBA, MLB, and more.\n\nEarly picks drop at 8am PT → chalkpicks.live\n\nSet your lineup now 🎯\n#SportsBetting #Picks #AI`;
}

export async function twitterPostHandler(req: Request, res: Response) {
  const slot = (req.body?.slot || req.query?.slot || "morning") as Slot;
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  console.log(`[TwitterPost] Triggered slot=${slot} task=${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    let tweetText: string;
    switch (slot) {
      case "morning":   tweetText = await buildMorningTweet(db); break;
      case "afternoon": tweetText = await buildAfternoonTweet(db); break;
      case "evening":   tweetText = await buildEveningTweet(db); break;
      case "night":     tweetText = await buildNightTweet(db); break;
      default:          tweetText = await buildMorningTweet(db);
    }

    const result = await postTweet(tweetText);

    if (result.success) {
      console.log(`[TwitterPost] Posted slot=${slot} tweetId=${result.tweetId}`);
    } else {
      console.warn(`[TwitterPost] Failed slot=${slot}: ${result.error}`);
    }

    res.json({
      ok: true,
      slot,
      tweetId: result.tweetId,
      success: result.success,
      error: result.error,
      preview: tweetText.substring(0, 100) + (tweetText.length > 100 ? "..." : ""),
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
