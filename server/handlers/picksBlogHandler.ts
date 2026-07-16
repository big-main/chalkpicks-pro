/**
 * Picks-to-Blog Auto-Generation Handler
 *
 * Triggered daily after picks are generated. For each new pick that doesn't
 * already have a blog post, this handler:
 *   1. Uses Ollama (via invokeLLM) to generate a 600-800 word SEO article
 *   2. Inserts it into blog_posts as "published" with source="ai-generated"
 *   3. Pings IndexNow so Google/Bing index it within minutes
 *   4. Notifies the owner with a summary
 *
 * This produces 5-15 long-tail SEO articles per day at zero cost.
 * Target keywords: "[Sport] picks today", "[Team] vs [Team] prediction", etc.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks, blogPosts } from "../../drizzle/schema";
import { and, eq, gte, isNull, notInArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

const INDEXNOW_KEY = "chalkpicks2026indexnow";
const INDEXNOW_HOST = "chalkpicks.live";

const SPORT_LABELS: Record<string, string> = {
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAAF",
  basketball_nba: "NBA",
  basketball_ncaab: "NCAAB",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
  mma_mixed_martial_arts: "MMA",
  soccer_epl: "Soccer",
  soccer_usa_mls: "MLS",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    await fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(urls[0])}&key=${INDEXNOW_KEY}`,
      { method: "GET" }
    );
    if (urls.length > 1) {
      await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: INDEXNOW_HOST, key: INDEXNOW_KEY, urlList: urls }),
      });
    }
  } catch (e) {
    console.warn("[PicksBlog] IndexNow ping failed:", e);
  }
}

async function generatePickArticle(pick: {
  sportKey: string;
  homeTeam: string | null;
  awayTeam: string | null;
  recommendation: string;
  confidenceScore: number;
  edgeScore: string | null;
  aiAnalysis: string | null;
  pickType: string;
  pickDate: string;
  odds: number | null;
}): Promise<{ title: string; slug: string; content: string; excerpt: string; seoDescription: string; tags: string } | null> {
  const sport = SPORT_LABELS[pick.sportKey] ?? pick.sportKey.toUpperCase();
  const matchup = pick.homeTeam && pick.awayTeam
    ? `${pick.awayTeam} vs ${pick.homeTeam}`
    : sport;
  const title = `${matchup} Prediction & Pick — ${pick.pickDate} | ChalkPicks AI`;
  const slug = slugify(`${matchup}-prediction-pick-${pick.pickDate}`);

  const prompt = `You are a professional sports betting analyst writing for ChalkPicks, an AI-powered sports betting analytics platform.

Write a 650-750 word SEO-optimized sports betting article about this pick:

Sport: ${sport}
Matchup: ${matchup}
Pick Type: ${pick.pickType}
Recommendation: ${pick.recommendation}
Confidence Score: ${pick.confidenceScore}%
Edge Score: ${pick.edgeScore ?? "N/A"}
Odds: ${pick.odds ? (pick.odds > 0 ? "+" + pick.odds : pick.odds) : "N/A"}
AI Analysis: ${pick.aiAnalysis ?? "Strong statistical edge detected."}
Date: ${pick.pickDate}

Article requirements:
1. Start with a compelling intro about the matchup
2. Include a section on "Why We Like This Pick" with 3 bullet points
3. Include a section on "Key Factors" (injuries, form, line movement)
4. Include a section on "Betting Strategy" (unit size recommendation using Kelly Criterion)
5. End with a clear recommendation and confidence level
6. Use H2 headings for each section
7. Naturally include keywords: "${sport} picks today", "${matchup} prediction", "betting odds", "+EV bet"
8. Write in a confident, analytical tone — not salesy
9. Do NOT include any disclaimers about gambling being risky (that's handled elsewhere)

Return ONLY the markdown article content, no title, no frontmatter.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a professional sports betting analyst. Write detailed, SEO-optimized betting analysis articles in markdown format." },
        { role: "user", content: prompt },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "";
    if (!content || content.length < 200) return null;

    const excerpt = content.replace(/#{1,3} .+\n/g, "").replace(/\n+/g, " ").slice(0, 200).trim() + "...";
    const seoDescription = `${matchup} prediction and betting pick for ${pick.pickDate}. ${pick.confidenceScore}% confidence. AI-powered analysis by ChalkPicks.`.slice(0, 160);
    const tags = [sport, "picks", pick.pickType.replace("_", " "), "AI picks"].join(",");

    return { title, slug, content, excerpt, seoDescription, tags };
  } catch (e) {
    console.error("[PicksBlog] LLM generation failed:", e);
    return null;
  }
}

export async function picksBlogHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  console.log(`[PicksBlog] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Get today's and yesterday's active picks
    const recentPicks = await db
      .select()
      .from(picks)
      .where(
        and(
          eq(picks.isActive, true),
          gte(picks.pickDate, yesterday)
        )
      )
      .limit(20);

    if (recentPicks.length === 0) {
      console.log("[PicksBlog] No recent picks found, skipping.");
      return res.json({ ok: true, generated: 0, skipped: 0 });
    }

    // Find which picks already have a blog post (by checking slug pattern)
    const existingSlugs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.source, "ai-generated"));

    const existingSlugSet = new Set(existingSlugs.map((r) => r.slug));

    let generated = 0;
    let skipped = 0;
    const newUrls: string[] = [];

    for (const pick of recentPicks) {
      // Only generate for matchup picks (moneyline, spread, over_under)
      if (!["moneyline", "spread", "over_under"].includes(pick.pickType)) {
        skipped++;
        continue;
      }

      const sport = SPORT_LABELS[pick.sportKey] ?? pick.sportKey;
      const matchup = pick.homeTeam && pick.awayTeam
        ? `${pick.awayTeam} vs ${pick.homeTeam}`
        : sport;
      const slug = slugify(`${matchup}-prediction-pick-${pick.pickDate}`);

      if (existingSlugSet.has(slug)) {
        skipped++;
        continue;
      }

      const article = await generatePickArticle({
        sportKey: pick.sportKey,
        homeTeam: pick.homeTeam ?? null,
        awayTeam: pick.awayTeam ?? null,
        recommendation: pick.recommendation,
        confidenceScore: pick.confidenceScore,
        edgeScore: pick.edgeScore?.toString() ?? null,
        aiAnalysis: pick.aiAnalysis ?? null,
        pickType: pick.pickType,
        pickDate: pick.pickDate,
        odds: pick.odds ?? null,
      });

      if (!article) {
        skipped++;
        continue;
      }

      await db.insert(blogPosts).values({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        seoDescription: article.seoDescription,
        tags: article.tags,
        source: "ai-generated",
        status: "published",
        publishedAt: new Date(),
      });

      newUrls.push(`https://${INDEXNOW_HOST}/blog/${article.slug}`);
      existingSlugSet.add(article.slug);
      generated++;

      // Throttle to avoid overwhelming the LLM
      await new Promise((r) => setTimeout(r, 500));
    }

    // Ping IndexNow for all new URLs
    if (newUrls.length > 0) {
      await pingIndexNow(newUrls);
      console.log(`[PicksBlog] Pinged IndexNow for ${newUrls.length} URLs`);
    }

    await notifyOwner({
      title: `[PicksBlog] Generated ${generated} new articles`,
      content: `Generated ${generated} pick analysis articles. Skipped ${skipped}. New URLs pinged to IndexNow:\n${newUrls.join("\n")}`,
    });

    console.log(`[PicksBlog] Complete: generated=${generated}, skipped=${skipped}`);
    res.json({ ok: true, generated, skipped, newUrls, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[PicksBlog] Error:", error);
    res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
  }
}
