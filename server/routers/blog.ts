/**
 * Blog Management Router
 * Handles fetching, creating, and publishing blog posts from BabyLoveGrowth
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import {
  fetchBabyLoveArticles,
  fetchBabyLoveArticleById,
  generateBabyLoveArticles,
  transformToBlogPost,
  type BabyLoveArticle,
} from "../services/babyloveGrowth";
import { getDb } from "../db";

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
   * Get related articles (excluding current slug, most recent published)
   */
  getRelated: publicProcedure
    .input(z.object({ slug: z.string(), limit: z.number().min(1).max(6).default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const posts = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          heroImage: blogPosts.heroImage,
          seoDescription: blogPosts.seoDescription,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, "published"),
            ne(blogPosts.slug, input.slug)
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);

      return posts;
    }),

  /**
   * Fetch articles from BabyLoveGrowth (admin only)
   */
  fetchFromBabyLove: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const articles = await fetchBabyLoveArticles(
          input.limit,
          input.offset,
          input.topic
        );
        return articles;
      } catch (error: any) {
        throw new Error(`Failed to fetch articles: ${error.message}`);
      }
    }),

  /**
   * Generate articles on a topic (admin only)
   */
  generateArticles: adminProcedure
    .input(
      z.object({
        topic: z.string().min(3),
        count: z.number().min(1).max(10).default(5),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const articles = await generateBabyLoveArticles(input.topic, input.count);
        return articles;
      } catch (error: any) {
        throw new Error(`Failed to generate articles: ${error.message}`);
      }
    }),

  /**
   * Import an article from BabyLoveGrowth as a draft (admin only)
   */
  importArticle: adminProcedure
    .input(
      z.object({
        babyloveArticleId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      try {
        // Fetch the article from BabyLoveGrowth
        const article = await fetchBabyLoveArticleById(input.babyloveArticleId);

        // Transform to blog post format
        const blogPost = transformToBlogPost(article);

        // Check if article already exists
        const existing = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, blogPost.slug))
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`Article with slug "${blogPost.slug}" already exists`);
        }

        // Insert as draft
        await db.insert(blogPosts).values({
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
          content: blogPost.content,
          contentHtml: blogPost.contentHtml,
          heroImage: blogPost.heroImage,
          seoDescription: blogPost.seoDescription,
          jsonLd: blogPost.jsonLd,
          source: "babylovegrowth",
          sourceArticleId: input.babyloveArticleId,
          status: "draft",
        });

        return { success: true, slug: blogPost.slug };
      } catch (error: any) {
        throw new Error(`Failed to import article: ${error.message}`);
      }
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
