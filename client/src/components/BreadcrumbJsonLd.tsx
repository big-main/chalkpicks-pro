import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE_URL = "https://chalkpicks.live";

/**
 * Maps each route path to its human-readable breadcrumb trail.
 * Each entry is an ordered array of { name, path } items.
 * The home item is always first; the current page is always last.
 */
const BREADCRUMB_MAP: Record<string, Array<{ name: string; path: string }>> = {
  "/": [{ name: "Home", path: "/" }],
  "/picks": [
    { name: "Home", path: "/" },
    { name: "AI Picks", path: "/picks" },
  ],
  "/stats": [
    { name: "Home", path: "/" },
    { name: "Stats", path: "/stats" },
  ],
  "/bet-calculator": [
    { name: "Home", path: "/" },
    { name: "Bet Calculator", path: "/bet-calculator" },
  ],
  "/pricing": [
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
  ],
  "/performance": [
    { name: "Home", path: "/" },
    { name: "Performance", path: "/performance" },
  ],
  "/prop-builder": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Prop Builder", path: "/prop-builder" },
  ],
  "/line-movement": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Line Movement", path: "/line-movement" },
  ],
  "/correlation-finder": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Correlation Finder", path: "/correlation-finder" },
  ],
  "/kalshi": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Kalshi Markets", path: "/kalshi" },
  ],
  "/clv-tracker": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "CLV Tracker", path: "/clv-tracker" },
  ],
  "/arbitrage": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Arbitrage Finder", path: "/arbitrage" },
  ],
  "/ev-finder": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "EV Finder", path: "/ev-finder" },
  ],
  "/parlay-builder": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Parlay Builder", path: "/parlay-builder" },
  ],
  "/leaderboard": [
    { name: "Home", path: "/" },
    { name: "Leaderboard", path: "/leaderboard" },
  ],
  "/backtesting": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Backtesting", path: "/backtesting" },
  ],
  "/sportsbooks": [
    { name: "Home", path: "/" },
    { name: "Sportsbooks", path: "/sportsbooks" },
  ],
  "/tools": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
  ],
  "/signup": [
    { name: "Home", path: "/" },
    { name: "Sign Up", path: "/signup" },
  ],
  "/login": [
    { name: "Home", path: "/" },
    { name: "Login", path: "/login" },
  ],
  "/dashboard": [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
  ],
  "/bankroll-tracker": [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Bankroll Tracker", path: "/bankroll-tracker" },
  ],
};

function buildJsonLd(crumbs: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.path}`,
    })),
  };
}

const SCRIPT_ID = "breadcrumb-json-ld";

export function BreadcrumbJsonLd() {
  const [location] = useLocation();

  useEffect(() => {
    // Strip query strings and trailing slashes for matching
    const cleanPath = location.split("?")[0].replace(/\/$/, "") || "/";

    // Handle dynamic pick detail routes like /picks/123
    const crumbs =
      BREADCRUMB_MAP[cleanPath] ??
      (cleanPath.startsWith("/picks/")
        ? [
            { name: "Home", path: "/" },
            { name: "AI Picks", path: "/picks" },
            { name: "Pick Detail", path: cleanPath },
          ]
        : null);

    // Remove any existing breadcrumb script
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();

    // Only inject when we have a known breadcrumb trail with 2+ items
    if (!crumbs || crumbs.length < 2) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(buildJsonLd(crumbs));
    document.head.appendChild(script);

    return () => {
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, [location]);

  return null;
}
