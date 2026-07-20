/**
 * Dynamic, DB-backed sitemap for chalkpicks.live.
 *
 * The legacy pipeline (scripts/generate-sitemap.mjs) baked slugs from the static
 * client/src/data/blog-posts.ts into client/public/sitemap.xml at build time, so
 * every article the cloud-computer content worker publishes into the blogPosts
 * table was missing from the sitemap until the next rebuild + deploy.
 *
 * buildSitemapXml() is a pure function (unit-tested, no I/O). getSitemapXml()
 * assembles the live entry list from three sources:
 *   - shared/seo-routes.ts entries flagged `sitemap: true` (evergreen pages)
 *   - blogPosts WHERE status = 'published'  (lastmod = updatedAt)
 *   - active picks (/picks/:id)             (optional detail pages)
 * and caches the rendered XML in memory for ~15 minutes.
 *
 * Fail-open by design: getSitemapXml() returns null on any error so the route
 * handler can serve the static client/public/sitemap.xml exactly as before.
 */
import { routeSEO, SITE_URL } from "@shared/seo-routes";

export interface SitemapEntry {
  /** Absolute URL. */
  loc: string;
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. */
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/** XML-escape the five reserved characters for safe embedding in <loc>. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Render a <urlset> document from the given entries. Pure — no I/O. */
export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(e => {
      const parts = [`    <loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq)
        parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (typeof e.priority === "number")
        parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** YYYY-MM-DD for a Date/string, defaulting to today. */
function isoDate(d?: Date | string | null): string {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
  return date.toISOString().split("T")[0];
}

/** Static evergreen routes flagged for the sitemap. */
function staticEntries(): SitemapEntry[] {
  const today = isoDate();
  return routeSEO
    .filter(r => r.sitemap)
    .map(r => ({
      loc: r.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${r.path}`,
      lastmod: today,
      changefreq: r.changefreq ?? "weekly",
      priority: r.priority ?? 0.5,
    }));
}

/** Published blog posts from the DB. Never throws — returns [] on any failure. */
async function blogEntries(): Promise<SitemapEntry[]> {
  try {
    const { getDb } = await import("../db");
    const { blogPosts } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.updatedAt))
      .limit(1000);
    return rows.map(r => ({
      loc: `${SITE_URL}/blog/${r.slug}`,
      lastmod: isoDate(r.updatedAt),
      changefreq: "weekly",
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

/** Active pick detail pages (/picks/:id). Never throws — returns [] on failure. */
async function pickEntries(): Promise<SitemapEntry[]> {
  try {
    const { getDb } = await import("../db");
    const { picks } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ id: picks.id, updatedAt: picks.updatedAt })
      .from(picks)
      .where(eq(picks.isActive, true))
      .orderBy(desc(picks.updatedAt))
      .limit(500);
    return rows.map(r => ({
      loc: `${SITE_URL}/picks/${r.id}`,
      lastmod: isoDate(r.updatedAt),
      changefreq: "daily",
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { xml: string; at: number } | null = null;

/**
 * Assemble and cache the live sitemap XML. Returns null on any error so callers
 * can fail open to the static file. `force` bypasses the in-memory cache.
 */
export async function getSitemapXml(force = false): Promise<string | null> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.xml;
  }
  try {
    const [blog, pick] = await Promise.all([blogEntries(), pickEntries()]);
    const entries = [...staticEntries(), ...blog, ...pick];
    const xml = buildSitemapXml(entries);
    cache = { xml, at: Date.now() };
    return xml;
  } catch {
    return null;
  }
}

/** Drop the cached document (used after a publish so the next hit rebuilds). */
export function invalidateSitemapCache(): void {
  cache = null;
}
