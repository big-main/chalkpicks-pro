/**
 * Reddit Daily Pick Handler
 *
 * Posts a daily tools-first or pick-verification post to:
 *   - r/sportsbook
 *   - r/sportsbetting
 *
 * Strategy: tools-first angle (free odds calculator, verify hash) to avoid
 * spam filters. Never posts guaranteed outcomes or win-rate claims.
 *
 * Endpoint: POST /api/scheduled/reddit-pick
 * Heartbeat: Daily at 9 AM PT = 16:00 UTC (0 0 16 * * *)
 *
 * Requires env vars:
 *   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { formatSportLabel } from "../../shared/sportLabels";

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID ?? "";
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET ?? "";
const REDDIT_USERNAME = process.env.REDDIT_USERNAME ?? "";
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD ?? "";
const REDDIT_USER_AGENT = "ChalkPicksBot/1.0 by ChalkPicks_Pro";

// Subreddits to post to
const TARGET_SUBS = ["sportsbook", "sportsbetting"];

// Rotate through 3 post templates to avoid repetition
const POST_TEMPLATES = [
  {
    title: "Free sports betting odds calculator — no signup required",
    body: (pick: any) =>
      `We built a free odds converter + EV calculator at **chalkpicks.pro/tools/odds-calculator** — no account needed.\n\nAlso has ROI tracker, Kelly criterion, and parlay calculator.\n\nToday's featured pick (hash-locked before game time for transparency):\n\n**${pick.awayTeam} @ ${pick.homeTeam}**\n${pick.recommendation}${pick.odds ? ` (${pick.odds > 0 ? "+" : ""}${pick.odds})` : ""}\n\nVerify it was locked pre-game: chalkpicks.pro/verify/${pick.contentHash || ""}\n\nFeedback welcome — what tools do you actually use?`,
  },
  {
    title: "How we hash-lock picks before games to prevent retroactive edits",
    body: (pick: any) =>
      `Most picks sites can claim any win rate they want — there's no way to verify the pick existed before the game.\n\nWe SHA-256 hash every pick at publish time and expose a public verify path:\n\n**chalkpicks.pro/verify/${pick.contentHash || ""}**\n\nToday's example:\n- **${pick.awayTeam} @ ${pick.homeTeam}**\n- ${pick.recommendation}${pick.odds ? ` at ${pick.odds > 0 ? "+" : ""}${pick.odds}` : ""}\n- Locked: ${pick.lockedAt ? new Date(pick.lockedAt).toLocaleString() : "pre-game"}\n\nFree tools (no signup): chalkpicks.pro/tools\n\nCurious if anyone else tracks CLV systematically?`,
  },
  {
    title: "Sports picks with CLV tracking — free tool",
    body: (pick: any) =>
      `Built a CLV tracker to measure process quality, not just win rate.\n\nToday's ${formatSportLabel(pick.sportKey)} pick:\n**${pick.awayTeam} @ ${pick.homeTeam}** — ${pick.recommendation}${pick.odds ? ` (${pick.odds > 0 ? "+" : ""}${pick.odds})` : ""}\n\nClosing line value (CLV) tells you if you got the better of the market, regardless of outcome. Positive CLV over time = good process.\n\nFree tools at chalkpicks.pro/tools — no account needed.\n\nWhat's your CLV over the last 100 bets?`,
  },
];

async function getRedditToken(): Promise<string | null> {
  if (
    !REDDIT_CLIENT_ID ||
    !REDDIT_CLIENT_SECRET ||
    !REDDIT_USERNAME ||
    !REDDIT_PASSWORD
  ) {
    return null;
  }
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: REDDIT_USERNAME,
        password: REDDIT_PASSWORD,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function postToReddit(
  token: string,
  subreddit: string,
  title: string,
  text: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        sr: subreddit,
        kind: "self",
        title,
        text,
        nsfw: "false",
        spoiler: "false",
        resubmit: "true",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    if (data?.json?.errors?.length > 0) {
      return {
        success: false,
        error: data.json.errors[0]?.[1] ?? "Unknown error",
      };
    }
    const url = data?.json?.data?.url ?? null;
    return { success: true, url };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function getPTDate(): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 7);
  return d.toISOString().split("T")[0];
}

export async function redditPickHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const results: Record<
    string,
    { success: boolean; url?: string; error?: string }
  > = {};

  try {
    // 1. Get today's top pick
    const db = await getDb();
    const today = getPTDate();
    let topPick: any = null;

    if (db) {
      const rows = await db
        .select()
        .from(picks)
        .where(eq(picks.pickDate, today))
        .orderBy(desc(picks.confidenceScore))
        .limit(1);
      topPick = rows[0] ?? null;
    }

    if (!topPick) {
      // No pick today — post a tools-only post
      topPick = {
        awayTeam: "your team",
        homeTeam: "opponent",
        recommendation: "Check our free tools",
        sportKey: "nfl",
        odds: null,
        contentHash: null,
        lockedAt: null,
      };
    }

    // 2. Get Reddit token
    const token = await getRedditToken();
    if (!token) {
      // No Reddit credentials — generate the post content and notify owner
      const template =
        POST_TEMPLATES[new Date().getDate() % POST_TEMPLATES.length];
      const postBody = template.body(topPick);
      await notifyOwner({
        title: "📋 Daily Reddit Post (manual — no credentials)",
        content: `**Title:** ${template.title}\n\n**Body:**\n${postBody}\n\n**Subreddits:** r/sportsbook, r/sportsbetting`,
      });
      return res.json({
        ok: true,
        mode: "manual",
        message:
          "Reddit credentials not configured — post content sent to owner notifications",
        elapsed: Date.now() - startTime,
      });
    }

    // 3. Select template (rotate by day of month)
    const templateIdx = new Date().getDate() % POST_TEMPLATES.length;
    const template = POST_TEMPLATES[templateIdx];
    const title =
      typeof template.title === "function"
        ? (template.title as any)(topPick)
        : template.title;
    const body = template.body(topPick);

    // 4. Post to each subreddit
    for (const sub of TARGET_SUBS) {
      results[sub] = await postToReddit(token, sub, title, body);
      // Rate limit: 2s between posts
      if (TARGET_SUBS.indexOf(sub) < TARGET_SUBS.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 5. Notify owner of results
    const successCount = Object.values(results).filter(r => r.success).length;
    await notifyOwner({
      title: `Reddit Daily Post: ${successCount}/${TARGET_SUBS.length} succeeded`,
      content: Object.entries(results)
        .map(
          ([sub, r]) =>
            `r/${sub}: ${r.success ? `✅ ${r.url}` : `❌ ${r.error}`}`
        )
        .join("\n"),
    });

    return res.json({
      ok: true,
      results,
      pick: {
        sport: formatSportLabel(topPick.sportKey),
        matchup: `${topPick.awayTeam} @ ${topPick.homeTeam}`,
      },
      elapsed: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[RedditPick] Handler error:", err);
    return res
      .status(500)
      .json({ error: String(err), elapsed: Date.now() - startTime });
  }
}
