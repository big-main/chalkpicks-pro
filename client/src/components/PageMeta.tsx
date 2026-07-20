import { useEffect } from "react";
import { useLocation } from "wouter";
import { resolvePageMeta } from "@shared/routeMeta";

export type { PageMetaConfig } from "@shared/routeMeta";

/**
 * Client-side per-route title/description updates during SPA navigation.
 * The initial page load already carries the SAME meta server-rendered by
 * server/_core/seo.ts (shared map in shared/routeMeta.ts) — this component
 * keeps the head in sync as the user navigates without full page loads.
 */
export function PageMeta({ pathname }: { pathname?: string } = {}) {
  const [location] = useLocation();

  useEffect(() => {
    const config = resolvePageMeta(pathname || location);

    document.title = config.title;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", config.description);
  }, [location, pathname]);

  return null;
}
