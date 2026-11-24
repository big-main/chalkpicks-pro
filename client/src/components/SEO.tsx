import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_URL = "https://chalkpicks.pro";
const DEFAULT_TITLE = "ChalkPicks Pro | AI Sports Betting Analytics";
const DEFAULT_DESCRIPTION =
  "ChalkPicks Pro delivers AI sports betting analytics, +EV tools, live odds, CLV tracking, and transparent picks for NFL, NBA, MLB, and NHL.";
const SOCIAL_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/og-image-discord-92LVJ3RpG7Qw25SYvGciDU.png";

interface SEOProps {
  title?: string;
  description?: string;
  /** Canonical path (e.g. "/picks"). Defaults to the current route path. */
  canonicalPath?: string;
  /** Set to true to add noindex for private/authenticated pages */
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-page SEO manager. Sets document title, meta description,
 * canonical URL, robots, and Open Graph / Twitter tags based on
 * the current route. Drop into any page component:
 *
 *   <SEO title="AI Sports Picks" description="..." />
 */
export default function SEO({
  title,
  description,
  canonicalPath,
  noindex,
}: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    const finalTitle = title ?? DEFAULT_TITLE;
    const finalDescription = description ?? DEFAULT_DESCRIPTION;
    // Strip trailing slash except root
    const path = (canonicalPath ?? location).replace(/\/+$/, "") || "/";
    const canonicalUrl = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;

    document.title = finalTitle;
    upsertMeta("name", "description", finalDescription);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow"
    );
    upsertCanonical(canonicalUrl);

    // Open Graph
    upsertMeta("property", "og:title", finalTitle);
    upsertMeta("property", "og:description", finalDescription);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "ChalkPicks Pro");
    upsertMeta("property", "og:image", SOCIAL_IMAGE);
    upsertMeta(
      "property",
      "og:image:alt",
      "ChalkPicks Pro sports betting analytics"
    );

    // Twitter
    upsertMeta("name", "twitter:title", finalTitle);
    upsertMeta("name", "twitter:description", finalDescription);
    upsertMeta("name", "twitter:url", canonicalUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", SOCIAL_IMAGE);
    upsertMeta(
      "name",
      "twitter:image:alt",
      "ChalkPicks Pro sports betting analytics"
    );
  }, [title, description, canonicalPath, noindex, location]);

  return null;
}
