import express, { type Express, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { blogPosts, picks } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

/**
 * HTTP surface for the ChalkPicks cloud-computer worker (see cloud-computer/).
 *
 * The worker runs on the Manus cloud computer next to Ollama. It pulls the
 * day's slate from here, drafts content with the local LLM, and posts the
 * results back as blog DRAFTS (never auto-published) for review in the admin
 * blog manager.
 *
 * Auth: a shared secret in the WORKER_API_TOKEN env var, sent as
 * `Authorization: Bearer <token>`. Fails closed — if the env var is unset,
 * every request is rejected.
 */

function timingSafeEqual(a: string, b: string): boolean {
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function requireWorkerToken(req: Request, res: Response, next: NextFunction) {
  const configured = process.env.WORKER_API_TOKEN;
  if (!configured) {
    return res.status(503).json({ error: "Worker API not configured" });
  }
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !timingSafeEqual(token, configured)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function registerWorkerRoutes(app: Express) {
  const router = express.Router();
  router.use(requireWorkerToken);

  /** Liveness/auth check for the worker. */
  router.get("/health", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  /**
   * Today's slate for content generation: the active picks with the fields a
   * preview article needs. Premium analysis (aiAnalysis/keyFactors) is
   * intentionally excluded — generated articles must not leak paid content.
   */
  router.get("/slate", async (_req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const today = new Date().toISOString().split("T")[0];
    const rows = await db
      .select({
        id: picks.id,
        sportKey: picks.sportKey,
        pickDate: picks.pickDate,
        pickType: picks.pickType,
        homeTeam: picks.homeTeam,
        awayTeam: picks.awayTeam,
        recommendation: picks.recommendation,
        odds: picks.odds,
        confidenceScore: picks.confidenceScore,
      })
      .from(picks)
      .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
      .limit(20);

    res.json({ date: today, picks: rows });
  });

  /**
   * Ingest a generated article as a blog DRAFT. Idempotent on slug: posting the
   * same slug twice is a no-op success, so the worker can safely retry.
   */
  router.post("/blog-draft", async (req, res) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { title, slug, content, contentHtml, excerpt, seoDescription, tags } =
      req.body ?? {};
    if (
      typeof title !== "string" || !title.trim() || title.length > 256 ||
      typeof slug !== "string" || !/^[a-z0-9-]{3,200}$/.test(slug) ||
      typeof content !== "string" || content.trim().length < 100
    ) {
      return res.status(400).json({
        error: "title (<=256 chars), slug (kebab-case), and content (>=100 chars) are required",
      });
    }

    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      return res.json({ ok: true, deduped: true, id: existing[0].id });
    }

    await db.insert(blogPosts).values({
      title: title.trim(),
      slug,
      content,
      contentHtml: typeof contentHtml === "string" ? contentHtml : null,
      excerpt: typeof excerpt === "string" ? excerpt.slice(0, 500) : null,
      seoDescription:
        typeof seoDescription === "string" ? seoDescription.slice(0, 160) : null,
      tags: typeof tags === "string" ? tags.slice(0, 512) : null,
      source: "ai-generated",
      status: "draft",
    });

    const inserted = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);
    res.json({ ok: true, deduped: false, id: inserted[0]?.id ?? null });
  });

  app.use("/api/worker", router);
}
