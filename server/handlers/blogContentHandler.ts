/**
 * Blog Content Generation Handler
 *
 * Triggered daily after picks are generated. Replaces the BabyLoveGrowth
 * integration with a self-contained AI pipeline:
 *
 *   1. Fetch today's + yesterday's active picks from the DB
 *   2. For each pick without an existing blog post, call invokeLLM (Ollama
 *      qwen2.5:7b on the cloud computer — zero cost) to write a 650-750 word
 *      SEO article
 *   3. Insert as "published" with source="ai-generated"
 *   4. Ping IndexNow + Google sitemap for instant indexing
 *   5. Notify owner with summary
 *
 * Produces 3-15 long-tail SEO articles per day at zero cost.
 * Target keywords: "[Sport] picks today", "[Team A] vs [Team B] prediction", etc.
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks, blogPosts } from "../../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";
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

const TAG_KEYWORDS: Array<{ tag: string; keywords: RegExp }> = [
  { tag: "NFL",         keywords: /\bNFL\b|football|quarterback|touchdown|super bowl/i },
  { tag: "NBA",         keywords: /\bNBA\b|basketball|point guard|three.pointer/i },
  { tag: "MLB",         keywords: /\bMLB\b|baseball|pitcher|home run|batting/i },
  { tag: "NHL",         keywords: /\bNHL\b|hockey|goalie|puck|ice/i },
  { tag: "NCAAF",       keywords: /\bNCAAF\b|college football|bowl game/i },
  { tag: "NCAAB",       keywords: /\bNCAAB\b|college basketball|march madness/i },
  { tag: "arbitrage",   keywords: /arbitrage|arb bet|sure bet|no.risk/i },
  { tag: "parlay",      keywords: /parlay|accumulator|multi.bet/i },
  { tag: "prop bets",   keywords: /prop bet|player prop|anytime scorer/i },
  { tag: "bankroll",    keywords: /bankroll|kelly criterion|staking|unit size/i },
  { tag: "+EV",         keywords: /\+EV|positive expected value|expected value/i },
  { tag: "sharp money", keywords: /sharp money|steam move|line move|reverse line/i },
  { tag: "strategy",    keywords: /strategy|system|method|approach|technique/i },
  { tag: "AI picks",    keywords: /AI pick|machine learning|algorithm|model predict/i },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function extractTags(title: string, content: string): string {
  const text = `${title} ${content}`;
  const matched: string[] = [];
  for (const { tag, keywords } of TAG_KEYWORDS) {
    if (keywords.test(text)) matched.push(tag);
    if (matched.length >= 5) break;
  }
  return matched.join(",");
}

async function pingIndexNow(slugs: string[]): Promise<void> {
  if (slugs.length === 0) return;
  const urls = slugs.map((s) => `https://${INDEXNOW_HOST}/blog/${s}`);
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    console.log(`[BlogContent] IndexNow pinged ${urls.length} URL(s)`);
  } catch (e: any) {
    console.warn("[BlogContent] IndexNow ping failed:", e.message);
  }
}

async function pingGoogleSitemap(): Promise<void> {
  for (const sm of ["/sitemap.xml", "/sitemap-blog.xml"]) {
    try {
      await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(`https://${INDEXNOW_HOST}${sm}`)}`,
        { method: "GET" }
      );
    } catch (_) { /* non-fatal */ }
  }
}

async function generateArticle(pick: {
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
  const oddsStr = pick.odds ? (pick.odds > 0 ? `+${pick.odds}` : String(pick.odds)) : "N/A";

  const prompt = `You are a professional sports betting analyst writing for ChalkPicks, an AI-powered sports analytics platform.

Write a 650-750 word SEO-optimized sports betting article about this pick:

Sport: ${sport}
Matchup: ${matchup}
Pick Type: ${pick.pickType}
Recommendation: ${pick.recommendation}
Confidence Score: ${pick.confidenceScore}%
Edge Score: ${pick.edgeScore ?? "N/A"}
Odds: ${oddsStr}
AI Analysis: ${pick.aiAnalysis ?? "Strong statistical edge detected."}
Date: ${pick.pickDate}

Requirements:
1. Compelling intro about the matchup
2. "Why We Like This Pick" section with 3 bullet points
3. "Key Factors" section (injuries, form, line movement)
4. "Betting Strategy" section (Kelly Criterion unit size)
5. Clear recommendation and confidence level at the end
6. Use ## H2 headings for each section
7. Naturally include: "${sport} picks today", "${matchup} prediction", "betting odds", "+EV bet"
8. Confident, analytical tone — not salesy
9. Do NOT include gambling-risk disclaimers

Return ONLY the markdown article body — no title, no frontmatter.`;

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
    const tags = extractTags(title, content) || [sport, "AI picks", pick.pickType.replace("_", " ")].join(",");

    return { title, slug, content, excerpt, seoDescription, tags };
  } catch (e: any) {
    console.error("[BlogContent] LLM generation failed:", e.message);
    return null;
  }
}

export async function blogContentHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  console.log(`[BlogContent] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Get today's and yesterday's active picks
    const recentPicks = await db
      .select()
      .from(picks)
      .where(and(eq(picks.isActive, true), gte(picks.pickDate, yesterday)))
      .limit(20);

    if (recentPicks.length === 0) {
      console.log("[BlogContent] No recent picks found — skipping article generation.");
      return res.json({ ok: true, imported: 0, published: 0, errors: 0, timestamp: new Date().toISOString() });
    }

    // Get slugs of already-generated articles to avoid duplicates
    const existingSlugs = new Set(
      (await db.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.source, "ai-generated")))
        .map((r) => r.slug)
    );

    let imported = 0;
    let published = 0;
    let errors = 0;
    const publishedSlugs: string[] = [];

    for (const pick of recentPicks) {
      if (!["moneyline", "spread", "over_under"].includes(pick.pickType)) continue;

      const sport = SPORT_LABELS[pick.sportKey] ?? pick.sportKey;
      const matchup = pick.homeTeam && pick.awayTeam
        ? `${pick.awayTeam} vs ${pick.homeTeam}`
        : sport;
      const slug = slugify(`${matchup}-prediction-pick-${pick.pickDate}`);

      if (existingSlugs.has(slug)) continue;

      const article = await generateArticle({
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

      if (!article) { errors++; continue; }

      try {
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

        existingSlugs.add(article.slug);
        publishedSlugs.push(article.slug);
        imported++;
        published++;
        console.log(`[BlogContent] Published: ${article.slug}`);
      } catch (e: any) {
        console.error("[BlogContent] DB insert failed:", e.message);
        errors++;
      }

      // Throttle to avoid overwhelming Ollama
      await new Promise((r) => setTimeout(r, 800));
    }

    if (publishedSlugs.length > 0) {
      await pingIndexNow(publishedSlugs);
      await pingGoogleSitemap();
    }

    const summary = `Blog content sync completed:\n- Imported: ${imported}\n- Published: ${published}\n- Errors: ${errors}`;
    console.log(`[BlogContent] ${summary}`);

    await notifyOwner({
      title: `Daily Blog Content — ${published} new articles`,
      content: summary,
    });

    res.json({ ok: true, imported, published, errors, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[BlogContent] Error:", error);
    res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
  }
}
