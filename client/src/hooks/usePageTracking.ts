import { useEffect } from "react";
import { useLocation } from "wouter";
import { analytics } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Tracks SPA page views in Google Analytics (GA4) and Mixpanel.
 * Call this once at the top-level router component.
 */
export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Google Analytics GA4
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }
    // Mixpanel
    analytics.page(location, document.title);
  }, [location]);
}
