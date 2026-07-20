import express, { type Express, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { blogPosts, picks, games, oddsSnapshots } from "../drizzle/schema";
import { and, eq, inArray, asc } from "drizzle-orm";

interface LineMovement {
  openOdds: number | null;
  currentOdds: number | null;
  openTotal: number | null;
  currentTotal: number | null;
  lastMoveAt: string | null;
}

/**
 * Earliest vs. latest snapshot per market, restricted to one bookmaker (so
 * "open" and "current" are apples-to-apples), for the given event IDs.
 * Returns a map keyed by eventId. Never throws — a lookup failure just means
 * that game's article won't get a line-movement paragraph.
 */
async function getLineMovements(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  eventIds: string[],
  homeTeamByEvent: Map<string, string>
): Promise<Map<string, LineMovement>> {
  const result = new Map<string, LineMovement>();
  if (eventIds.length === 0) return result;

  const rows = await db
    .select({
      eventId: oddsSnapshots.eventId,
      bookmaker: oddsSnapshots.bookmaker,
      marketKey: oddsSnapshots.marketKey,
      outcomesJson: oddsSnapshots.outcomesJson,
      snapshotAt: oddsSnapshots.snapshotAt,
    })
    .from(oddsSnapshots)
    .where(
      and(
        inArray(oddsSnapshots.eventId, eventIds),
        inArray(oddsSnapshots.marketKey, ["h2h", "totals"])
      )
    )
    .orderBy(asc(oddsSnapshots.snapshotAt));

  // Group by event, pick one consistent bookmaker per event (prefer draftkings).
  const byEvent = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byEvent.get(row.eventId) ?? [];
    list.push(row);
    byEvent.set(row.eventId, list);
  }

  byEvent.forEach((snapshots, eventId) => {
    const bookmaker =
      snapshots.find(s => s.bookmaker === "draftkings")?.bookmaker ?? snapshots[0].bookmaker;
    const forBook = snapshots.filter(s => s.bookmaker === bookmaker);
    const homeTeam = homeTeamByEvent.get(eventId);

    const h2h = forBook.filter(s => s.marketKey === "h2h");
    const totals = forBook.filter(s => s.marketKey === "totals");

    const extractPrice = (outcomesJson: string, teamName: string | undefined): number | null => {
      try {
        const outcomes = JSON.parse(outcomesJson) as { name: string; price?: number }[];
        const outcome = teamName ? outcomes.find(o => o.name === teamName) : outcomes[0];
        return typeof outcome?.price === "number" ? outcome.price : null;
      } catch {
        return null;
      }
    };
    const extractPoint = (outcomesJson: string): number | null => {
      try {
        const outcomes = JSON.parse(outcomesJson) as { point?: number }[];
        return typeof outcomes[0]?.point === "number" ? outcomes[0].point : null;
      } catch {
        return null;
      }
    };

    const openOdds = h2h[0] ? extractPrice(h2h[0].outcomesJson, homeTeam) : null;
    const currentOdds = h2h[h2h.length - 1]
      ? extractPrice(h2h[h2h.length - 1].outcomesJson, homeTeam)
      : null;
    const openTotal = totals[0] ? extractPoint(totals[0].outcomesJson) : null;
    const currentTotal = totals[totals.length - 1]
      ? extractPoint(totals[totals.length - 1].outcomesJson)
      : null;
    const last = forBook[forBook.length - 1];

    result.set(eventId, {
      openOdds,
      currentOdds,
      openTotal,
      currentTotal,
      lastMoveAt: last ? last.snapshotAt.toISOString() : null,
    });
  });

  return result;
}

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
        gameId: picks.gameId,
      })
      .from(picks)
      .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
      .limit(20);

    // First-party line movement: join each pick's game to its odds snapshot
    // history so the worker can cite real open->current numbers instead of
    // writing generically about "line movement".
    const gameIds = Array.from(
      new Set(rows.map(r => r.gameId).filter((id): id is number => id != null))
    );
    const gameRows = gameIds.length
      ? await db
          .select({ id: games.id, externalId: games.externalId, homeTeamName: games.homeTeamName })
          .from(games)
          .where(inArray(games.id, gameIds))
      : [];
    const externalIdByGameId = new Map(gameRows.map(g => [g.id, g.externalId]));
    const homeTeamByEvent = new Map(
      gameRows.filter(g => g.externalId).map(g => [g.externalId as string, g.homeTeamName ?? ""])
    );
    const eventIds = gameRows.map(g => g.externalId).filter((id): id is string => !!id);
    const movements = await getLineMovements(db, eventIds, homeTeamByEvent);

    const picksWithMovement = rows.map(({ gameId, ...pick }) => {
      const externalId = gameId != null ? externalIdByGameId.get(gameId) : undefined;
      const movement = externalId ? movements.get(externalId) : undefined;
      return { ...pick, lineMovement: movement ?? null };
    });

    res.json({ date: today, picks: picksWithMovement });
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
