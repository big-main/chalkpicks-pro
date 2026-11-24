import { useEffect } from "react";
import { useLocation } from "wouter";
import { getRouteSEO, SITE_URL } from "@shared/seo-routes";

const SOCIAL_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/og-image-discord-92LVJ3RpG7Qw25SYvGciDU.png";

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
 * Global head manager: on every route change, applies the correct
 * canonical URL and (when known) route-specific title/description.
 * Individual pages can further override via the <SEO /> component,
 * which runs after this hook in the render cycle.
 *
 * Fixes the duplicate-content signal caused by every page having
 * canonical="https://chalkpicks.pro/".
 */
export function useRouteSEO() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.replace(/\/+$/, "") || "/";
    const canonicalUrl = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;

    // Always fix the canonical to match the current route
    upsertCanonical(canonicalUrl);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "ChalkPicks Pro");
    upsertMeta("property", "og:image", SOCIAL_IMAGE);
    upsertMeta(
      "property",
      "og:image:alt",
      "ChalkPicks Pro sports betting analytics"
    );
    upsertMeta("name", "twitter:url", canonicalUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", SOCIAL_IMAGE);
    upsertMeta(
      "name",
      "twitter:image:alt",
      "ChalkPicks Pro sports betting analytics"
    );

    // Apply route-specific title/description defaults if registered
    const entry = getRouteSEO(path);
    if (entry) {
      document.title = entry.title;
      upsertMeta("name", "description", entry.description);
      upsertMeta("property", "og:title", entry.title);
      upsertMeta("property", "og:description", entry.description);
      upsertMeta("name", "twitter:title", entry.title);
      upsertMeta("name", "twitter:description", entry.description);
    }
  }, [location]);
}
