import { useEffect } from "react";
import { useLocation } from "wouter";
import { getRouteSEO, SITE_URL } from "@shared/seo-routes";

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
 * Global head manager: on every route change, applies the correct
 * canonical URL and (when known) route-specific title/description.
 * Individual pages can further override via the <SEO /> component,
 * which runs after this hook in the render cycle.
 *
 * Fixes the duplicate-content signal caused by every page having
 * canonical="https://chalkpicks.live/".
 */
export function useRouteSEO() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.replace(/\/+$/, "") || "/";
    const canonicalUrl = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;

    // Always fix the canonical to match the current route
    upsertCanonical(canonicalUrl);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:url", canonicalUrl);

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
