import { useEffect } from "react";
import { useLocation } from "wouter";

export interface PageMetaConfig {
  title: string;
  description: string;
}

/**
 * Maps each route path to its SEO-optimized title and meta description.
 * Titles should be 50-60 characters; descriptions 150-160 characters.
 */
const PAGE_META_MAP: Record<string, PageMetaConfig> = {
  "/": {
    title: "ChalkPicks — AI Sports Betting Picks | +EV Finder, Prop Builder & Free Trial",
    description:
      "AI-powered sports betting picks with 73%+ win rate. Free +EV finder, prop builder, line movement tracker, and arbitrage alerts. NFL, NBA, MLB & NHL. Try free for 3 days — $9.99/mo.",
  },
  "/picks": {
    title: "AI Sports Betting Picks | ChalkPicks",
    description:
      "AI-generated sports picks with confidence scores, edge analysis, and recommended sportsbook lines. NFL, NBA, MLB, NHL, NCAAF, NCAAB, MMA, Soccer, Tennis.",
  },
  "/stats": {
    title: "Sports Betting Stats & Analytics | ChalkPicks",
    description:
      "Real-time sports statistics, team performance metrics, player props, and historical data. Analyze trends and make data-driven betting decisions.",
  },
  "/bet-calculator": {
    title: "Free Bet Calculator | Odds Converter & Parlay Builder",
    description:
      "Free sports betting calculator: convert American/decimal/fractional odds, calculate parlay payouts, and compute optimal Kelly Criterion bet sizing.",
  },
  "/pricing": {
    title: "ChalkPicks Pricing | Monthly & Yearly Plans",
    description:
      "Affordable sports betting analytics plans. Daily Pass $9.99, Monthly Pro $29.99/mo, Yearly $199.99/yr. Full access to all premium tools.",
  },
  "/performance": {
    title: "Pick Performance & Win Rate | ChalkPicks Analytics",
    description:
      "Track AI pick performance, win rates by sport, confidence score accuracy, and historical ROI. Transparent analytics for every pick.",
  },
  "/prop-builder": {
    title: "Prop Builder | Custom Player Prop Picks",
    description:
      "Build custom player prop combinations and get AI-generated picks with edge scores. Combine props across NFL, NBA, MLB, NHL.",
  },
  "/line-movement": {
    title: "Line Movement Tracker | Steam Moves & Sharp Money",
    description:
      "Real-time line movement tracking across 15+ sportsbooks. Detect steam moves and sharp money action before lines adjust.",
  },
  "/correlation-finder": {
    title: "Correlation Finder | Prop Correlation Analysis",
    description:
      "Analyze player prop correlations and identify uncorrelated prop combinations for optimal parlay construction.",
  },
  "/kalshi": {
    title: "Kalshi Prediction Markets | ChalkPicks",
    description:
      "Explore Kalshi prediction market contracts with real-time odds and AI-generated probability analysis.",
  },
  "/clv-tracker": {
    title: "CLV Tracker | Closing Line Value Analysis",
    description:
      "Track closing line value (CLV) on every bet. Measure whether you consistently beat the closing line—the strongest predictor of long-term profitability.",
  },
  "/arbitrage": {
    title: "Arbitrage Finder | Guaranteed Profit Opportunities",
    description:
      "Find arbitrage opportunities across 15+ sportsbooks. Lock in guaranteed profit by betting both sides at different books.",
  },
  "/arbitrage-opportunities": {
    title: "Real-Time Arbitrage Opportunities | ChalkPicks",
    description:
      "Detect guaranteed profit arbitrage opportunities across multiple sportsbooks. Real-time odds comparison, optimal bet sizing, and risk analysis.",
  },
  "/ev-finder": {
    title: "+EV Finder | Positive Expected Value Bets",
    description:
      "Scan odds from 15+ sportsbooks and find +EV (positive expected value) bets where the market is mispriced in your favor.",
  },
  "/parlay-builder": {
    title: "Parlay Builder | Multi-Leg Parlay Constructor",
    description:
      "Build multi-leg parlays with AI-generated picks, correlation analysis, and payout calculations across all sports.",
  },
  "/leaderboard": {
    title: "Community Leaderboard | Top Bettors & Rankings",
    description:
      "View top-performing community members, their pick records, ROI, and CLV rankings. Compete and learn from the best.",
  },
  "/backtesting": {
    title: "Backtesting Tool | Historical Pick Performance",
    description:
      "Backtest AI picks against historical data. Analyze win rates, ROI, and confidence score accuracy over past seasons.",
  },
  "/sportsbooks": {
    title: "Sportsbooks | Best Betting Apps & Promos",
    description:
      "Compare sportsbooks, view current promotions, and find the best lines. Integrated with ChalkPicks for seamless betting.",
  },
  "/tools": {
    title: "Sports Betting Tools | Calculators & Analyzers",
    description:
      "Free and premium tools: bet calculator, line movement tracker, prop builder, arbitrage finder, CLV tracker, and more.",
  },
  "/signup": {
    title: "Sign Up | ChalkPicks Free Trial",
    description:
      "Create a ChalkPicks account and start your 3-day free trial. Access AI picks, +EV finder, prop builder, and more.",
  },
  "/login": {
    title: "Login | ChalkPicks Account",
    description: "Log in to your ChalkPicks account to access AI picks, analytics, and premium tools.",
  },
  "/dashboard": {
    title: "Dashboard | Your ChalkPicks Account",
    description:
      "View your account overview, subscription status, recent picks, performance stats, and account settings.",
  },
  "/bankroll-tracker": {
    title: "Bankroll Tracker | Betting Budget Manager",
    description:
      "Track your betting bankroll, manage unit sizing, monitor ROI, and analyze long-term profitability.",
  },
};

export function PageMeta({ pathname }: { pathname?: string } = {}) {
  const [location] = useLocation();

  useEffect(() => {
    // Use provided pathname or current location
    const currentPath = pathname || location;
    // Strip query strings and trailing slashes for matching
    const cleanPath = currentPath.split("?")[0].replace(/\/$/, "") || "/";

    // Handle dynamic pick detail routes like /picks/123
    let config =
      PAGE_META_MAP[cleanPath] ??
      (cleanPath.startsWith("/picks/")
        ? PAGE_META_MAP["/picks"]
        : PAGE_META_MAP["/"]);

    // Update document title
    document.title = config.title;

    // Update or create meta description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", config.description);
  }, [location]);

  return null;
}
