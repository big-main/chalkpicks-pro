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

    // Topics to fetch blog content for
    const topics = [
      "sports betting strategies",
      "nfl picks analysis",
      "nba predictions",
      "mlb betting trends",
      "parlay betting tips",
      "odds comparison",
      "betting bankroll management",
    ];

    // Fetch articles on a random topic
    const topic = topics[Math.floor(Math.random() * topics.length)];
    console.log(`[BlogContent] Fetching articles on: "${topic}"`);

    try {
      const response = await fetchBabyLoveArticles(10, 0, topic);
      const articles = response.articles || [];

      console.log(`[BlogContent] Fetched ${articles.length} articles`);

      for (const article of articles) {
        try {
          // Transform to blog post format
          const blogPost = transformToBlogPost(article);

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

    // Send admin notification
    const summary = `Blog content sync completed:\n- Imported: ${imported}\n- Published: ${published}\n- Errors: ${errors}\n- Topic: ${topic}`;
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
      topic,
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
