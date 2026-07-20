import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_URL = "https://chalkpicks.live";
const DEFAULT_TITLE = "AI Betting Analytics & +EV Finder | ChalkPicks Sports Picks";
const DEFAULT_DESCRIPTION =
  "AI betting analytics platform with +EV finder, steam move detection, CLV tracker, and arbitrage finder. Get data-driven sports picks with confidence scores for NFL, NBA, MLB & NHL.";

interface SEOProps {
  title?: string;
  description?: string;
  /** Canonical path (e.g. "/picks"). Defaults to the current route path. */
  canonicalPath?: string;
  /** Set to true to add noindex for private/authenticated pages */
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
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
export default function SEO({ title, description, canonicalPath, noindex }: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    const finalTitle = title ?? DEFAULT_TITLE;
    const finalDescription = description ?? DEFAULT_DESCRIPTION;
    // Strip trailing slash except root
    const path = (canonicalPath ?? location).replace(/\/+$/, "") || "/";
    const canonicalUrl = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;

    document.title = finalTitle;
    upsertMeta("name", "description", finalDescription);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertCanonical(canonicalUrl);

    // Open Graph
    upsertMeta("property", "og:title", finalTitle);
    upsertMeta("property", "og:description", finalDescription);
    upsertMeta("property", "og:url", canonicalUrl);

    // Twitter
    upsertMeta("name", "twitter:title", finalTitle);
    upsertMeta("name", "twitter:description", finalDescription);
    upsertMeta("name", "twitter:url", canonicalUrl);
  }, [title, description, canonicalPath, noindex, location]);

  return null;
}
