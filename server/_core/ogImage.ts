/**
 * Per-page dynamic Open Graph images — GET /api/og/blog/:slug.png and
 * GET /api/og/pick/:id.png. These must be plain HTTP GET endpoints returning
 * PNG bytes: social crawlers (Twitter/X, Discord, Facebook, Slack) fetch
 * og:image directly and never execute JS or call tRPC, so the existing
 * ogImageRouter.generatePickCard (a tRPC *mutation* returning base64 JSON)
 * is invisible to them — same root problem as server/_core/seo.ts fixed for
 * page content.
 *
 * SVG -> PNG via sharp (no native canvas dependency — server/og-image.ts's
 * `canvas` package was never actually installed and the file was dead code).
 * Fails open to a generic branded card on any lookup error so a broken pick
 * ID or slug never breaks the link preview entirely.
 */
import type { Express, Request, Response } from "express";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#0a0a0f";
const NEON = "#39ff14";

/** Escape text for safe embedding inside SVG element content. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Break a long line into at most `maxLines` wrapped lines of ~maxChars each. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

interface CardOptions {
  kicker?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function buildCardSvg({ kicker, title, subtitle, badge }: CardOptions): string {
  const titleLines = wrapText(title, 30, 3);
  const titleStartY = 630 / 2 - ((titleLines.length - 1) * 56) / 2;

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BG}" />
        <stop offset="100%" stop-color="#12121a" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
    <rect width="8" height="${HEIGHT}" fill="${NEON}" />
    <circle cx="1100" cy="80" r="180" fill="${NEON}" opacity="0.06" />

    <text x="70" y="90" font-size="34" font-weight="700" fill="${NEON}" font-family="Arial, sans-serif">ChalkPicks</text>

    ${
      badge
        ? `<rect x="70" y="130" width="${68 + badge.length * 13}" height="44" rx="8" fill="${NEON}" opacity="0.12" />
    <text x="90" y="159" font-size="22" font-weight="700" fill="${NEON}" font-family="Arial, sans-serif">${esc(badge)}</text>`
        : ""
    }

    ${
      kicker
        ? `<text x="70" y="${titleStartY - 40}" font-size="24" fill="#9ca3af" font-family="Arial, sans-serif">${esc(kicker)}</text>`
        : ""
    }

    ${titleLines
      .map(
        (line, i) =>
          `<text x="70" y="${titleStartY + i * 56}" font-size="52" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${esc(line)}</text>`
      )
      .join("\n    ")}

    ${
      subtitle
        ? `<text x="70" y="${titleStartY + titleLines.length * 56 + 20}" font-size="28" fill="${NEON}" font-family="Arial, sans-serif">${esc(subtitle)}</text>`
        : ""
    }

    <text x="70" y="${HEIGHT - 50}" font-size="22" fill="#6b7280" font-family="Arial, sans-serif">chalkpicks.live</text>
  </svg>`;
}

async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function sendPng(res: Response, png: Buffer) {
  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(png);
}

const GENERIC_CARD = buildCardSvg({
  title: "AI Sports Betting Analytics",
  subtitle: "+EV Finder · CLV Tracker · Arbitrage",
});

/** Register GET /api/og/blog/:slug.png and GET /api/og/pick/:id.png. Must be mounted before the SPA catch-all. */
export function registerOgImageRoutes(app: Express): void {
  app.get("/api/og/blog/:slug.png", async (req: Request, res: Response) => {
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      const rows = db
        ? await db
            .select({ title: blogPosts.title, tags: blogPosts.tags, seoDescription: blogPosts.seoDescription })
            .from(blogPosts)
            .where(eq(blogPosts.slug, req.params.slug))
            .limit(1)
        : [];
      const post = rows[0];
      if (!post) return sendPng(res, await svgToPng(GENERIC_CARD));

      const sport = post.tags?.split(",")[0]?.trim();
      const svg = buildCardSvg({
        kicker: "ChalkPicks Blog",
        title: post.title,
        subtitle: post.seoDescription?.slice(0, 70),
        badge: sport && sport.length <= 12 ? sport.toUpperCase() : undefined,
      });
      sendPng(res, await svgToPng(svg));
    } catch {
      sendPng(res, await svgToPng(GENERIC_CARD));
    }
  });

  app.get("/api/og/pick/:id.png", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return sendPng(res, await svgToPng(GENERIC_CARD));

      const { getDb } = await import("../db");
      const { picks } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      const rows = db
        ? await db
            .select({
              homeTeam: picks.homeTeam,
              awayTeam: picks.awayTeam,
              sportKey: picks.sportKey,
              recommendation: picks.recommendation,
              odds: picks.odds,
              confidenceScore: picks.confidenceScore,
            })
            .from(picks)
            .where(eq(picks.id, id))
            .limit(1)
        : [];
      const pick = rows[0];
      if (!pick || !pick.homeTeam || !pick.awayTeam) {
        return sendPng(res, await svgToPng(GENERIC_CARD));
      }

      const oddsStr = pick.odds != null ? (pick.odds > 0 ? `+${pick.odds}` : `${pick.odds}`) : "";
      const svg = buildCardSvg({
        kicker: `${pick.sportKey.toUpperCase()} · AI Pick`,
        title: `${pick.awayTeam} @ ${pick.homeTeam}`,
        subtitle: `${pick.recommendation}${oddsStr ? ` (${oddsStr})` : ""} · ${pick.confidenceScore}% confidence`,
        badge: pick.sportKey.length <= 12 ? pick.sportKey.toUpperCase() : undefined,
      });
      sendPng(res, await svgToPng(svg));
    } catch {
      sendPng(res, await svgToPng(GENERIC_CARD));
    }
  });
}
