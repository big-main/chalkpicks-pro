/**
 * Twitter Pick Result Handler
 * Auto-tweets pick results to @chalkpickspro when picks resolve (win/loss).
 * Triggered by the game results resolution scheduler.
 * Endpoint: POST /api/scheduled/twitter-pick-results
 *
 * Flow:
 *   1. Find picks resolved in the last 1 hour (result = 'win' or 'loss')
 *   2. Check if already tweeted (via twitter_result_posted flag)
 *   3. Format tweet with pick details, odds, and running record
 *   4. Post to Twitter API v2
 *   5. Mark as tweeted
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { desc, eq, and, sql, gte } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

// --- OAuth 1.0a helper (reuse from twitterPostHandler) ---
function oauthHeader(
  method: string,
  url: string,
  params: Record<string, string>
): string {
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
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const sigBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join("&");

  const sigKey = `${encodeURIComponent(ENV.twitterConsumerSecret)}&${encodeURIComponent(ENV.twitterAccessSecret)}`;
  const signature = crypto
    .createHmac("sha1", sigKey)
    .update(sigBase)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(
      k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`
    )
    .join(", ");

  return `OAuth ${headerParts}`;
}

async function postTweet(
  text: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
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

    const data = (await res.json()) as any;
    if (!res.ok) {
      return {
        success: false,
        error: data.detail?.[0]?.message || data.title || "Unknown error",
      };
    }

    return { success: true, tweetId: data.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function twitterPickResultHandler(req: Request, res: Response) {
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database unavailable" });
  }

  try {
    // Find picks resolved in the last hour that haven't been tweeted yet
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentResults = await db
      .select()
      .from(picks)
      .where(
        and(
          sql`${picks.result} IN ('win', 'loss')`,
          gte(picks.updatedAt, oneHourAgo),
          eq(picks.twitterResultPosted, false)
        )
      )
      .orderBy(desc(picks.updatedAt))
      .limit(5); // Tweet up to 5 results per run to avoid rate limits

    if (recentResults.length === 0) {
      return res.json({ tweeted: 0, message: "No new results to tweet" });
    }

    // Get overall record for context
    const allSettled = await db
      .select()
      .from(picks)
      .where(sql`${picks.result} IN ('win', 'loss')`);

    const wins = allSettled.filter(p => p.result === "win").length;
    const losses = allSettled.filter(p => p.result === "loss").length;
    const winRate =
      allSettled.length > 0 ? Math.round((wins / allSettled.length) * 100) : 0;

    let tweeted = 0;
    const results: any[] = [];

    for (const pick of recentResults) {
      const resultEmoji = pick.result === "win" ? "✅" : "❌";
      const oddsText = pick.odds
        ? ` ${pick.odds > 0 ? "+" : ""}${pick.odds}`
        : "";
      const pickText =
        pick.recommendation || `${pick.homeTeam} vs ${pick.awayTeam}`;

      const tweet = `${resultEmoji} ${pick.result.toUpperCase()} — ${pickText}${oddsText}\n\n📊 Season: ${wins}-${losses} (${winRate}% win rate)\n\n🔥 Get daily AI picks at chalkpicks.pro`;

      const postResult = await postTweet(tweet);

      if (postResult.success) {
        // Mark as tweeted in DB
        await db
          .update(picks)
          .set({ twitterResultPosted: true })
          .where(eq(picks.id, pick.id));

        tweeted++;
        results.push({
          pickId: pick.id,
          result: pick.result,
          tweetId: postResult.tweetId,
          success: true,
        });
      } else {
        results.push({
          pickId: pick.id,
          result: pick.result,
          error: postResult.error,
          success: false,
        });
      }
    }

    return res.json({
      tweeted,
      total: recentResults.length,
      results,
      record: { wins, losses, winRate: `${winRate}%` },
    });
  } catch (err: any) {
    console.error("[TwitterPickResult]", err);
    return res.status(500).json({ error: err.message });
  }
}
