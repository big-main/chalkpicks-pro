/**
 * Daily Social Post Handler
 * Called by Manus Heartbeat cron daily at optimal posting times to generate
 * and queue social media content for Reddit, Twitter, and Discord.
 * Endpoint: POST /api/scheduled/daily-social-post
 *
 * Per periodic-updates.md §4a: This is a project-level Heartbeat (no end-user).
 * The handler trusts the platform gateway which restricts /api/scheduled/* to cron callers only.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, gte } from "drizzle-orm";

const PLATFORMS = ["reddit", "twitter", "discord"] as const;

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  cta: string;
}

async function generateSocialContent(pick: any): Promise<GeneratedPost[]> {
  const prompt = `You are a sports betting social media manager for ChalkPicks Pro (chalkpicks.pro).
Generate engaging social media posts for today's top pick:

Sport: ${pick.sport}
Matchup: ${pick.homeTeam} vs ${pick.awayTeam}
Pick: ${pick.recommendation}
Confidence: ${pick.confidenceScore}%
Analysis: ${pick.aiAnalysis}

Generate 3 posts (one for each platform):
1. Reddit (r/sportsbook style - informative, data-driven, no hard sell)
2. Twitter/X (concise, engaging, with relevant hashtags)
3. Discord (casual, community-focused, with emoji)

Each post should:
- Highlight the pick and confidence score
- Include a subtle CTA to chalkpicks.pro
- Feel authentic, not spammy
- Be under 280 chars for Twitter

Respond with JSON only:
{
  "posts": [
    {"platform": "reddit", "content": "...", "hashtags": ["..."], "cta": "..."},
    {"platform": "twitter", "content": "...", "hashtags": ["..."], "cta": "..."},
    {"platform": "discord", "content": "...", "hashtags": ["..."], "cta": "..."}
  ]
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a sports betting social media expert. Always respond with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_posts",
        strict: true,
        schema: {
          type: "object",
          properties: {
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  content: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  cta: { type: "string" },
                },
                required: ["platform", "content", "hashtags", "cta"],
                additionalProperties: false,
              },
            },
          },
          required: ["posts"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(typeof content === "string" ? content : "{}");
  return parsed.posts || [];
}

export async function dailySocialPostHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  console.warn(`[DailySocialPost] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Get today's top pick (highest confidence)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const topPicks = await db
      .select()
      .from(picks)
      .where(gte(picks.createdAt, today))
      .orderBy(desc(picks.confidenceScore))
      .limit(1);

    if (topPicks.length === 0) {
      console.warn("[DailySocialPost] No picks found for today, skipping");
      return res.json({ ok: true, skipped: "no-picks-today" });
    }

    const topPick = topPicks[0];
    console.warn(
      `[DailySocialPost] Using pick: ${topPick.homeTeam} vs ${topPick.awayTeam} (${topPick.confidenceScore}%)`
    );

    // Generate social content via LLM
    const posts = await generateSocialContent(topPick);
    console.warn(`[DailySocialPost] Generated ${posts.length} posts`);

    // Dispatch posts to n8n social syndication webhook if configured
    const n8nWebhookUrl = process.env.N8N_SOCIAL_WEBHOOK_URL;
    let webhookDispatched = false;
    let webhookError: string | undefined;
    if (n8nWebhookUrl && posts.length > 0) {
      try {
        const payload = {
          posts,
          sport: topPick.sportKey || "sports",
          date: new Date().toISOString().split("T")[0],
          pick: `${topPick.homeTeam} vs ${topPick.awayTeam}`,
          confidence: topPick.confidenceScore,
        };
        const webhookRes = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        webhookDispatched = webhookRes.ok;
        console.warn(
          `[DailySocialPost] n8n webhook: ${webhookRes.status} ${webhookRes.ok ? "OK" : "FAILED"}`
        );
      } catch (err: any) {
        webhookError = err.message;
        console.warn(`[DailySocialPost] n8n webhook error: ${err.message}`);
      }
    } else if (!n8nWebhookUrl) {
      console.warn(
        "[DailySocialPost] N8N_SOCIAL_WEBHOOK_URL not set — skipping webhook dispatch"
      );
    }

    res.json({
      ok: true,
      generated: posts.length,
      pick: `${topPick.homeTeam} vs ${topPick.awayTeam}`,
      confidence: topPick.confidenceScore,
      webhook: { dispatched: webhookDispatched, error: webhookError },
    });
  } catch (error: any) {
    console.error("[DailySocialPost] Error:", error);
    res.status(500).json({
      error: error.message || "Unknown error",
      stack: error.stack,
      context: { url: req.url, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
