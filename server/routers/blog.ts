/**
 * Blog Management Router
 * Handles fetching, creating, publishing, and AI-generating blog posts.
 * BabyLoveGrowth integration removed — articles are now generated from
 * daily picks via invokeLLM (Ollama on cloud computer, zero cost).
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { blogPosts, picks } from "../../drizzle/schema";
import { eq, desc, and, ne, gte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { invalidateSitemapCache } from "../_core/sitemap";
import { pingIndexNow } from "../_core/indexnow";
import { SITE_URL } from "@shared/seo-routes";

export const blogRouter = router({
  /**
   * Get published blog posts (public)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"));

      return { posts, total: total.length };
    }),

  /**
   * Get a single blog post by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const post = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.slug, input.slug),
            eq(blogPosts.status, "published")
          )
        )
        .limit(1);

      return post[0] || null;
    }),

  /**
   * Get related articles (tag-aware, excludes current slug)
   * If the current post has tags, tries to find posts sharing at least one tag first;
   * falls back to most-recent published posts if not enough tag matches.
   */
  getRelated: publicProcedure
    .input(z.object({ slug: z.string(), tags: z.string().optional(), limit: z.number().min(1).max(6).default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const selectFields = {
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        heroImage: blogPosts.heroImage,
        seoDescription: blogPosts.seoDescription,
        tags: blogPosts.tags,
        publishedAt: blogPosts.publishedAt,
      };

      // If the current post has tags, try tag-matched results first
      if (input.tags) {
        const tagList = input.tags.split(",").map(t => t.trim()).filter(Boolean);
        // Fetch more than needed, then filter in-memory for tag overlap
        const candidates = await db
          .select(selectFields)
          .from(blogPosts)
          .where(and(eq(blogPosts.status, "published"), ne(blogPosts.slug, input.slug)))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(30);

        const tagMatches = candidates.filter(p => {
          if (!p.tags) return false;
          const postTags = p.tags.split(",").map(t => t.trim());
          return tagList.some(t => postTags.includes(t));
        });

        if (tagMatches.length >= input.limit) {
          return tagMatches.slice(0, input.limit);
        }
        // Pad with recency-based results if not enough tag matches
        const tagMatchSlugs = new Set(tagMatches.map(p => p.slug));
        const padded = candidates.filter(p => !tagMatchSlugs.has(p.slug));
        return [...tagMatches, ...padded].slice(0, input.limit);
      }

      // No tags — fall back to most recent
      const posts = await db
        .select(selectFields)
        .from(blogPosts)
        .where(and(eq(blogPosts.status, "published"), ne(blogPosts.slug, input.slug)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);

      return posts;
    }),

  /**
   * AI-generate a blog article from a specific pick (admin only)
   * Uses invokeLLM (Ollama on cloud computer) — zero cost
   */
  generateFromPick: adminProcedure
    .input(
      z.object({
        pickId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const pickRows = await db.select().from(picks).where(eq(picks.id, input.pickId)).limit(1);
      if (!pickRows.length) throw new Error("Pick not found");
      const pick = pickRows[0];

      const matchup = pick.homeTeam && pick.awayTeam
        ? `${pick.awayTeam} vs ${pick.homeTeam}`
        : pick.sportKey.toUpperCase();
      const slug = matchup.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
        + "-prediction-pick-" + pick.pickDate;
      const title = `${matchup} Prediction & Pick — ${pick.pickDate} | ChalkPicks AI`;

      const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
      if (existing.length > 0) throw new Error(`Article already exists: ${slug}`);

      const oddsStr = pick.odds ? (pick.odds > 0 ? `+${pick.odds}` : String(pick.odds)) : "N/A";
      const response = await invokeLLM({
        complexity: "high", // Force Forge (Gemini) — long-form articles too slow for Ollama on CPU
        messages: [
          { role: "system", content: "You are a professional sports betting analyst. Write detailed, SEO-optimized betting analysis articles in markdown format." },
          { role: "user", content: `Write a 650-750 word SEO article about: ${matchup} | ${pick.sportKey} | ${pick.pickType} | Rec: ${pick.recommendation} | Confidence: ${pick.confidenceScore}% | Odds: ${oddsStr} | Date: ${pick.pickDate}. Use ## H2 headings. Include sections: Why We Like This Pick, Key Factors, Betting Strategy. Return ONLY markdown body.` },
        ],
      });

      const content = typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content : "";
      if (!content || content.length < 100) throw new Error("LLM returned empty content");

      const excerpt = content.replace(/#{1,3} .+\n/g, "").replace(/\n+/g, " ").slice(0, 200).trim() + "...";
      const seoDescription = `${matchup} prediction for ${pick.pickDate}. ${pick.confidenceScore}% confidence. AI-powered by ChalkPicks.`.slice(0, 160);

      await db.insert(blogPosts).values({
        title,
        slug,
        excerpt,
        content,
        seoDescription,
        source: "ai-generated",
        status: "published",
        publishedAt: new Date(),
      });

      return { success: true, slug };
    }),

  /**
   * Publish a draft blog post (admin only)
   */
  publish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const post = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.id))
        .limit(1);

      if (!post.length) throw new Error("Blog post not found");

      await db
        .update(blogPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
        })
        .where(eq(blogPosts.id, input.id));

      // The sitemap cache now has a stale (pre-publish) snapshot — drop it so
      // the next /sitemap.xml hit picks up the newly published URL immediately.
      invalidateSitemapCache();

      // Fire-and-forget: tell Bing/Yandex/etc. about the new URL right away
      // instead of waiting for their crawlers to rediscover it.
      pingIndexNow([`${SITE_URL}/blog/${post[0].slug}`, `${SITE_URL}/sitemap.xml`]);

      return { success: true };
    }),

  /**
   * Get all blog posts including drafts (admin only)
   */
  listAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z
          .enum(["draft", "published", "archived"])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let whereClause = undefined;
      if (input.status) {
        whereClause = eq(blogPosts.status, input.status);
      }

      const posts = await db
        .select()
        .from(blogPosts)
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { posts };
    }),

  /**
   * Delete a blog post (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));

      return { success: true };
    }),
});
