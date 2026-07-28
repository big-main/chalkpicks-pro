/**
 * BabyLoveGrow Sync Handler
 * Pulls published articles from BabyLoveGrowth.ai and upserts them into blog_posts.
 * Triggered daily via Heartbeat at /api/scheduled/sync-babylovegrow
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

const BASE_URL = "https://api.babylovegrowth.ai/api/integrations/v1";

interface BabyLoveArticle {
  id: number;
  title: string;
  slug: string;
  hero_image_url?: string;
  meta_description?: string;
  excerpt?: string;
  seedKeyword?: string;
  keywords?: string[];
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

interface BabyLoveArticleFull extends BabyLoveArticle {
  content_markdown?: string;
  content_html?: string;
  jsonLd?: string;
  faqJsonLd?: string;
}

export async function babyloveGrowSyncHandler(req: Request, res: Response) {
  const apiKey = process.env.BABYLOVEGROWTH_API_KEY;
  if (!apiKey) {
    console.error("[BabyLoveGrow Sync] BABYLOVEGROWTH_API_KEY not set");
    return res.json({ ok: false, error: "BABYLOVEGROWTH_API_KEY not configured" });
  }

  try {
    // 1. Fetch article list
    const listRes = await axios.get(`${BASE_URL}/articles?limit=50`, {
      headers: { "X-API-Key": apiKey },
      timeout: 20000,
    });
    const articles: BabyLoveArticle[] = Array.isArray(listRes.data) ? listRes.data : [];
    const published = articles.filter((a) => a.published);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ ok: false, error: "Database not available" });
    }

    for (const article of published) {
      try {
        // 2. Check if already synced
        const existing = await db
          .select({ id: blogPosts.id, sourceArticleId: blogPosts.sourceArticleId })
          .from(blogPosts)
          .where(eq(blogPosts.sourceArticleId, String(article.id)))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // 3. Fetch full article content
        const fullRes = await axios.get(`${BASE_URL}/articles/${article.id}`, {
          headers: { "X-API-Key": apiKey },
          timeout: 20000,
        });
        const full: BabyLoveArticleFull = fullRes.data;

        // 4. Build tags from keywords
        const tags = (full.keywords ?? []).slice(0, 8).join(",");

        // 5. Build SEO description (50-160 chars)
        let seoDescription = full.meta_description ?? full.excerpt ?? "";
        if (seoDescription.length > 160) seoDescription = seoDescription.slice(0, 157) + "...";
        if (seoDescription.length < 50 && full.title) {
          seoDescription = `${full.title} — Expert sports betting analysis and picks from ChalkPicks Pro.`;
          seoDescription = seoDescription.slice(0, 160);
        }

        // 6. Insert into blog_posts
        await db!.insert(blogPosts).values({
          title: full.title,
          slug: full.slug,
          excerpt: full.excerpt ?? full.meta_description ?? "",
          content: full.content_markdown ?? full.excerpt ?? "",
          contentHtml: full.content_html ?? "",
          heroImage: full.hero_image_url ?? "",
          seoDescription,
          jsonLd: full.jsonLd ?? null,
          faqJsonLd: full.faqJsonLd ?? null,
          source: "babylovegrowth",
          sourceArticleId: String(full.id),
          status: "published",
          tags,
          publishedAt: full.created_at ? new Date(full.created_at) : new Date(),
        });

        synced++;
        console.log(`[BabyLoveGrow Sync] Synced: "${full.title}" (id: ${full.id})`);
      } catch (articleErr: any) {
        console.error(`[BabyLoveGrow Sync] Error syncing article ${article.id}:`, articleErr.message);
        errors++;
      }
    }

    console.log(`[BabyLoveGrow Sync] Done — synced: ${synced}, skipped: ${skipped}, errors: ${errors}`);
    return res.json({ ok: true, synced, skipped, errors, total: published.length });
  } catch (err: any) {
    console.error("[BabyLoveGrow Sync] Fatal error:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
