import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hasComplianceFooter } from "./blog";

describe("hasComplianceFooter", () => {
  it("passes content with the exact worker.mjs footer", () => {
    expect(
      hasComplianceFooter(
        "Some article body.\n\n*Analytics & education — not betting advice. 21+ | 1-800-GAMBLER*"
      )
    ).toBe(true);
  });

  it("fails content missing the footer entirely", () => {
    expect(hasComplianceFooter("Some article body with no disclaimer.")).toBe(false);
  });

  it("fails content with only one of the two required markers", () => {
    expect(hasComplianceFooter("Must be 21+ to bet.")).toBe(false);
    expect(hasComplianceFooter("Call 1-800-GAMBLER if you have a problem.")).toBe(false);
  });

  it("is case-insensitive on the gambler hotline", () => {
    expect(hasComplianceFooter("21+ | Call 1-800-gambler for help.")).toBe(true);
  });
});

describe("Blog Router", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should create a blog post", async () => {
    const testPost = {
      title: "Test Article: Sports Betting Strategy",
      slug: "test-sports-betting-strategy-" + Date.now(),
      excerpt: "Learn the best sports betting strategies",
      content: "# Sports Betting Strategy\n\nThis is a test article.",
      contentHtml: "<h1>Sports Betting Strategy</h1><p>This is a test article.</p>",
      heroImage: "https://example.com/hero.jpg",
      seoDescription: "Learn the best sports betting strategies for profitable betting",
      jsonLd: '{"@context":"https://schema.org","@type":"BlogPosting"}',
      source: "babylovegrowth" as const,
      sourceArticleId: "test-123",
      status: "draft" as const,
    };

    const result = await db.insert(blogPosts).values(testPost);
    expect(result).toBeDefined();

    // Verify the post was created
    const created = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, testPost.slug))
      .limit(1);

    expect(created).toHaveLength(1);
    expect(created[0].title).toBe(testPost.title);
    expect(created[0].status).toBe("draft");

    // Cleanup
    await db.delete(blogPosts).where(eq(blogPosts.slug, testPost.slug));
  });

  it("should publish a draft blog post", async () => {
    const testPost = {
      title: "Test Article: NFL Picks",
      slug: "test-nfl-picks-" + Date.now(),
      excerpt: "Best NFL picks for this week",
      content: "# NFL Picks\n\nThis is a test article.",
      contentHtml: "<h1>NFL Picks</h1><p>This is a test article.</p>",
      heroImage: "https://example.com/hero.jpg",
      seoDescription: "Best NFL picks and predictions for this week",
      jsonLd: '{"@context":"https://schema.org","@type":"BlogPosting"}',
      source: "babylovegrowth" as const,
      sourceArticleId: "test-456",
      status: "draft" as const,
    };

    // Create draft
    await db.insert(blogPosts).values(testPost);

    // Publish it
    await db
      .update(blogPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
      })
      .where(eq(blogPosts.slug, testPost.slug));

    // Verify
    const published = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, testPost.slug))
      .limit(1);

    expect(published[0].status).toBe("published");
    expect(published[0].publishedAt).toBeDefined();

    // Cleanup
    await db.delete(blogPosts).where(eq(blogPosts.slug, testPost.slug));
  });

  it("should list published blog posts only", async () => {
    const slug1 = "test-published-" + Date.now();
    const slug2 = "test-draft-" + Date.now();

    // Create one published and one draft
    await db.insert(blogPosts).values({
      title: "Published Article",
      slug: slug1,
      excerpt: "This is published",
      content: "Content",
      contentHtml: "<p>Content</p>",
      source: "babylovegrowth" as const,
      status: "published" as const,
      publishedAt: new Date(),
    });

    await db.insert(blogPosts).values({
      title: "Draft Article",
      slug: slug2,
      excerpt: "This is draft",
      content: "Content",
      contentHtml: "<p>Content</p>",
      source: "babylovegrowth" as const,
      status: "draft" as const,
    });

    // Query published only
    const published = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));

    expect(published.length).toBeGreaterThan(0);
    expect(published.some((p: any) => p.slug === slug1)).toBe(true);

    // Cleanup
    await db.delete(blogPosts).where(eq(blogPosts.slug, slug1));
    await db.delete(blogPosts).where(eq(blogPosts.slug, slug2));
  });

  it("should prevent duplicate slugs", async () => {
    const slug = "test-unique-" + Date.now();

    const post1 = {
      title: "First Article",
      slug,
      excerpt: "First",
      content: "Content",
      contentHtml: "<p>Content</p>",
      source: "babylovegrowth" as const,
      status: "draft" as const,
    };

    // Insert first post
    await db.insert(blogPosts).values(post1);

    // Try to insert duplicate slug (should fail due to unique constraint)
    try {
      await db.insert(blogPosts).values({
        ...post1,
        title: "Different Title",
      });
      expect.fail("Should have thrown duplicate key error");
    } catch (error: any) {
      // The error message contains the query details
      expect(error.message).toContain("Failed query");
    }

    // Cleanup
    await db.delete(blogPosts).where(eq(blogPosts.slug, slug));
  });
});
