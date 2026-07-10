/**
 * Blog Content Generation Handler
 * Triggered daily to fetch and publish new sports betting blog content from BabyLoveGrowth
 * 
 * Workflow:
 * 1. Fetch latest articles from BabyLoveGrowth on sports betting topics
 * 2. Import them as draft blog posts
 * 3. Publish the best ones automatically
 * 4. Send admin notification with summary
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { fetchBabyLoveArticles, transformToBlogPost } from "../services/babyloveGrowth";
import { sendEmail } from "../email";
import { notifyOwner } from "../_core/notification";

// IndexNow configuration
const INDEXNOW_KEY = "chalkpicks2026indexnow";
const INDEXNOW_HOST = "chalkpicks.live";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Ping Google Search Console sitemap endpoint.
 * Asks Google to re-crawl the sitemap after new content is published.
 */
async function pingGoogleSitemap(): Promise<void> {
  const sitemapUrl = `https://${INDEXNOW_HOST}/sitemap.xml`;
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  try {
    const response = await fetch(pingUrl, { method: "GET" });
    if (response.ok) {
      console.log(`[GooglePing] Sitemap ping successful (status: ${response.status})`);
    } else {
      console.warn(`[GooglePing] Unexpected response: ${response.status}`);
    }
  } catch (err: any) {
    // Non-fatal
    console.error(`[GooglePing] Sitemap ping failed:`, err.message);
  }
}

/**
 * Ping IndexNow with newly published blog article URLs.
 * Notifies Bing, Yandex, and other IndexNow-compatible search engines instantly.
 */
async function pingIndexNow(slugs: string[]): Promise<void> {
  if (slugs.length === 0) return;

  const urls = slugs.map((slug) => `https://${INDEXNOW_HOST}/blog/${slug}`);

  try {
    const body = {
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (response.ok || response.status === 202) {
      console.log(`[IndexNow] Pinged ${urls.length} URL(s) successfully (status: ${response.status})`);
    } else {
      const text = await response.text().catch(() => "");
      console.warn(`[IndexNow] Unexpected response ${response.status}: ${text}`);
    }
  } catch (err: any) {
    // Non-fatal — log and continue
    console.error(`[IndexNow] Ping failed:`, err.message);
  }
}

export async function blogContentHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  console.log(`[BlogContent] Triggered by task: ${taskUid}`);

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    let imported = 0;
    let published = 0;
    let errors = 0;
    const publishedSlugs: string[] = [];

    // Fetch latest articles from BabyLoveGrowth (returns all org articles)
    console.log(`[BlogContent] Fetching latest articles from BabyLoveGrowth`);

    try {
      const response = await fetchBabyLoveArticles(20, 0);
      const articles = Array.isArray(response) ? response : (response.articles || []);

      console.log(`[BlogContent] Fetched ${articles.length} articles`);

      for (const article of articles) {
        try {
          // Fetch full article content (list endpoint doesn't include content_html/content_markdown)
          let fullArticle;
          try {
            const { fetchBabyLoveArticleById } = await import("../services/babyloveGrowth");
            fullArticle = await fetchBabyLoveArticleById(String(article.id));
          } catch (fetchErr: any) {
            console.error(`[BlogContent] Error fetching full article ${article.id}:`, fetchErr.message);
            errors++;
            continue;
          }

          // Transform to blog post format
          const blogPost = transformToBlogPost(fullArticle);

          // Check if article already exists
          const existing = await db
            .select()
            .from(blogPosts)
            .where(eq(blogPosts.slug, blogPost.slug))
            .limit(1);

          if (existing.length > 0) {
            console.log(`[BlogContent] Article already exists: ${blogPost.slug}`);
            continue;
          }

          // Insert as draft
          const result = await db.insert(blogPosts).values({
            title: blogPost.title,
            slug: blogPost.slug,
            excerpt: blogPost.excerpt,
            content: blogPost.content,
            contentHtml: blogPost.contentHtml,
            heroImage: blogPost.heroImage,
            seoDescription: blogPost.seoDescription,
            jsonLd: blogPost.jsonLd,
            source: "babylovegrowth",
            sourceArticleId: article.id,
            status: "draft",
          });

          imported++;
          console.log(`[BlogContent] Imported draft: ${blogPost.slug}`);

          // Auto-publish high-quality articles (those with good SEO descriptions)
          if (
            blogPost.seoDescription &&
            blogPost.seoDescription.length > 100 &&
            blogPost.heroImage
          ) {
            await db
              .update(blogPosts)
              .set({
                status: "published",
                publishedAt: new Date(),
              })
              .where(eq(blogPosts.slug, blogPost.slug));

            published++;
            publishedSlugs.push(blogPost.slug);
            console.log(`[BlogContent] Published: ${blogPost.slug}`);
          }
        } catch (err: any) {
          console.error(`[BlogContent] Error processing article:`, err.message);
          errors++;
        }
      }
    } catch (err: any) {
      console.error(`[BlogContent] Error fetching articles:`, err.message);
      errors++;
    }

    // Ping IndexNow + Google for all newly published articles
    if (publishedSlugs.length > 0) {
      await pingIndexNow(publishedSlugs);
      await pingGoogleSitemap();
    }

    // Send admin notification
    const summary = `Blog content sync completed:\n- Imported: ${imported}\n- Published: ${published}\n- Errors: ${errors}`;
    console.log(`[BlogContent] ${summary}`);

    await notifyOwner({
      title: "Daily Blog Content Sync",
      content: summary,
    });

    res.json({
      ok: true,
      imported,
      published,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[BlogContent] Error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
