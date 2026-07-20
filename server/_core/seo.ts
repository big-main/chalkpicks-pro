/**
 * Server-side per-route SEO injection for the SPA.
 *
 * chalkpicks.live is a client-rendered React app: without this, every URL
 * serves the same static index.html — an empty <body> and the homepage's meta.
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't execute JavaScript and
 * search engines see 30+ URLs with identical titles — the root cause of the
 * site's discoverability problem.
 *
 * injectSeo() rewrites the HTML head per request URL before the shell is sent:
 *  - unique <title>, meta description, canonical, og:/twitter: tags from the
 *    shared route map (shared/routeMeta.ts — same map the client uses), and
 *  - for /blog/:slug — the post's real title/description plus an Article
 *    JSON-LD carrying the full article text, so crawlers get the CONTENT
 *    without running JS, and
 *  - for /picks/:id — the pick's matchup as title plus SportsEvent JSON-LD.
 *
 * Fail-open by design: any error returns the original HTML untouched.
 */
import { resolvePageMeta } from "@shared/routeMeta";
import { eq } from "drizzle-orm";

const ORIGIN = "https://chalkpicks.live";

/** Escape text for safe embedding into HTML attribute/text positions. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip HTML tags to plain text (for articleBody / descriptions). */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface RouteSeo {
  title: string;
  description: string;
  canonicalPath: string;
  jsonLd?: object;
  ogType?: string;
}

async function resolveRouteSeo(pathname: string): Promise<RouteSeo> {
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "") || "/";

  // Blog article: pull the real post so crawlers see actual content.
  const blogMatch = cleanPath.match(/^\/blog\/([a-z0-9-]+)$/i);
  if (blogMatch) {
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const db = await getDb();
      if (db) {
        const rows = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, blogMatch[1]))
          .limit(1);
        const post = rows[0];
        if (post && post.status === "published") {
          const body = stripHtml(post.contentHtml || post.content || "").slice(0, 5000);
          const description =
            post.seoDescription || post.excerpt?.slice(0, 158) || body.slice(0, 158);
          return {
            title: `${post.title} | ChalkPicks`,
            description,
            canonicalPath: cleanPath,
            ogType: "article",
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description,
              ...(post.heroImage ? { image: post.heroImage } : {}),
              datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
              dateModified: post.updatedAt.toISOString(),
              author: { "@type": "Organization", name: "ChalkPicks" },
              publisher: {
                "@type": "Organization",
                name: "ChalkPicks",
                url: ORIGIN,
              },
              mainEntityOfPage: `${ORIGIN}${cleanPath}`,
              articleBody: body,
            },
          };
        }
      }
    } catch {
      // fall through to the static map
    }
  }

  // Pick detail: matchup title + SportsEvent JSON-LD.
  const pickMatch = cleanPath.match(/^\/picks\/(\d+)$/);
  if (pickMatch) {
    try {
      const { getDb } = await import("../db");
      const { picks } = await import("../../drizzle/schema");
      const db = await getDb();
      if (db) {
        const rows = await db
          .select()
          .from(picks)
          .where(eq(picks.id, parseInt(pickMatch[1], 10)))
          .limit(1);
        const pick = rows[0];
        if (pick && pick.homeTeam && pick.awayTeam) {
          const sport = pick.sportKey?.toUpperCase() ?? "";
          const title = `${pick.awayTeam} @ ${pick.homeTeam} ${sport} Pick | ChalkPicks`;
          const description = `AI pick for ${pick.awayTeam} @ ${pick.homeTeam}: ${pick.recommendation}. Confidence ${pick.confidenceScore}%. Full analysis, odds and edge on ChalkPicks.`;
          return {
            title: title.slice(0, 70),
            description: description.slice(0, 160),
            canonicalPath: cleanPath,
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              name: `${pick.awayTeam} vs ${pick.homeTeam}${sport ? ` — ${sport}` : ""}`,
              startDate: pick.pickDate,
              url: `${ORIGIN}${cleanPath}`,
              eventStatus: "https://schema.org/EventScheduled",
              homeTeam: { "@type": "SportsTeam", name: pick.homeTeam },
              awayTeam: { "@type": "SportsTeam", name: pick.awayTeam },
              competitor: [
                { "@type": "SportsTeam", name: pick.homeTeam },
                { "@type": "SportsTeam", name: pick.awayTeam },
              ],
            },
          };
        }
      }
    } catch {
      // fall through to the static map
    }
  }

  const meta = resolvePageMeta(cleanPath);
  return { title: meta.title, description: meta.description, canonicalPath: cleanPath };
}

/**
 * Rewrite the SPA HTML shell's head for the given request URL. Safe to call on
 * every HTML navigation; returns the input unchanged on any failure.
 */
export async function injectSeo(html: string, url: string): Promise<string> {
  try {
    const pathname = new URL(url, ORIGIN).pathname;
    const seo = await resolveRouteSeo(pathname);
    const canonical = `${ORIGIN}${seo.canonicalPath === "/" ? "/" : seo.canonicalPath}`;

    let out = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`)
      .replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${esc(seo.description)}$2`
      )
      .replace(
        /(<link rel="canonical" href=")[^"]*(")/,
        `$1${esc(canonical)}$2`
      )
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`)
      .replace(
        /(<meta property="og:title" content=")[^"]*(")/,
        `$1${esc(seo.title)}$2`
      )
      .replace(
        /(<meta property="og:description" content=")[^"]*(")/,
        `$1${esc(seo.description)}$2`
      )
      .replace(
        /(<meta name="twitter:title" content=")[^"]*(")/,
        `$1${esc(seo.title)}$2`
      )
      .replace(
        /(<meta name="twitter:description" content=")[^"]*(")/,
        `$1${esc(seo.description)}$2`
      )
      .replace(/(<meta name="twitter:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`);

    if (seo.ogType) {
      out = out.replace(
        /(<meta property="og:type" content=")[^"]*(")/,
        `$1${esc(seo.ogType)}$2`
      );
    }

    if (seo.jsonLd) {
      // JSON-LD in <script> context: escape "</" to keep the parser inside the tag.
      const json = JSON.stringify(seo.jsonLd).replace(/<\//g, "<\\/");
      out = out.replace(
        "</head>",
        `<script type="application/ld+json" data-ssr-route-schema>${json}</script>\n</head>`
      );
    }

    return out;
  } catch {
    return html;
  }
}
