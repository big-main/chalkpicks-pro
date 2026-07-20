/**
 * Shared per-route SEO metadata.
 * Used by the client-side head manager (useRouteSEO) and the
 * server-side bot pre-rendering middleware (server/prerender.ts).
 */
import { LEARN_PAGES_META } from "./learnPagesMeta";

export interface RouteSEOEntry {
  path: string;
  title: string;
  description: string;
  /** Included in sitemap.xml */
  sitemap?: boolean;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly";
  priority?: number;
}

export const SITE_URL = "https://chalkpicks.live";

export const routeSEO: RouteSEOEntry[] = [
  {
    path: "/",
    title: "AI Betting Analytics & +EV Finder | ChalkPicks Sports Picks",
    description:
      "AI betting analytics platform with +EV finder, steam move detection, CLV tracker, and arbitrage finder. Get data-driven sports picks with confidence scores for NFL, NBA, MLB & NHL.",
    sitemap: true,
    changefreq: "daily",
    priority: 1.0,
  },
  {
    path: "/picks",
    title: "Today's AI Sports Betting Picks with Confidence Scores | ChalkPicks",
    description:
      "Daily AI-generated sports betting picks for NFL, NBA, MLB & NHL with confidence scores, edge ratings, and detailed analysis. Updated every morning.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.9,
  },
  {
    path: "/daily-picks",
    title: "Daily AI Picks Archive — Past Results by Date | ChalkPicks",
    description:
      "Browse the complete archive of ChalkPicks AI sports betting picks by date. Full transparency on wins, losses, and performance for NFL, NBA, MLB & NHL.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/nfl-picks",
    title: "NFL AI Picks Today — Spreads, Totals & Props | ChalkPicks",
    description:
      "Free and premium NFL AI picks with confidence scores. Data-driven NFL spreads, totals, moneylines and player props analyzed by machine learning models.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/nba-picks",
    title: "NBA AI Picks Today — Spreads, Totals & Player Props | ChalkPicks",
    description:
      "Daily NBA AI picks backed by machine learning. Get NBA spreads, totals, and player prop picks with confidence scores and edge ratings.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/mlb-picks",
    title: "MLB AI Picks Today — Moneylines, Run Lines & Totals | ChalkPicks",
    description:
      "AI-powered MLB picks updated daily. Moneyline, run line, and totals picks with pitcher analysis, confidence scores, and expected value ratings.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/nhl-picks",
    title: "NHL AI Picks Today — Puck Lines, Totals & Moneylines | ChalkPicks",
    description:
      "Machine learning NHL picks for every slate. Puck line, moneyline, and totals picks with confidence scores, goalie analysis, and edge ratings.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/stats",
    title: "Live Sports Stats & Scores Dashboard | ChalkPicks",
    description:
      "Real-time sports stats, live scores, and game data for NFL, NBA, MLB & NHL. Track games and betting-relevant metrics in one dashboard.",
    sitemap: true,
    changefreq: "hourly",
    priority: 0.8,
  },
  {
    path: "/ev-finder",
    title: "+EV Bet Finder — Real-Time Positive Expected Value Bets | ChalkPicks",
    description:
      "Scan real-time odds across 10+ sportsbooks to find positive expected value (+EV) bets instantly. The math-first way to bet profitably.",
    sitemap: true,
    changefreq: "hourly",
    priority: 0.9,
  },
  {
    path: "/arbitrage",
    title: "Sports Betting Arbitrage Finder — Risk-Free Profit Scanner | ChalkPicks",
    description:
      "Find live arbitrage betting opportunities across sportsbooks with exact stake calculations for guaranteed risk-free profit.",
    sitemap: true,
    changefreq: "hourly",
    priority: 0.9,
  },
  {
    path: "/prop-builder",
    title: "AI Player Prop Builder — Over/Under Prop Analysis | ChalkPicks",
    description:
      "Build winning player prop bets with AI analysis. Over/under recommendations with hit rates, matchup data, and confidence scores.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/parlay-builder",
    title: "AI Parlay Builder — Smart Correlated Parlays | ChalkPicks",
    description:
      "Build smarter parlays with AI correlation analysis. Maximize payout potential while understanding true combined probability.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.7,
  },
  {
    path: "/line-movement",
    title: "Line Movement Tracker — Steam Moves & Sharp Money | ChalkPicks",
    description:
      "Track real-time line movement and detect steam moves the moment sharp money hits. Follow the sharps, not the public.",
    sitemap: true,
    changefreq: "hourly",
    priority: 0.7,
  },
  {
    path: "/correlation-finder",
    title: "SGP Correlation Finder — Same Game Parlay Analysis | ChalkPicks",
    description:
      "Find hidden correlations for same-game parlays with historical hit rates. Build mathematically sound SGPs.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/clv-tracker",
    title: "CLV Tracker — Closing Line Value Tracking | ChalkPicks",
    description:
      "Track your closing line value (CLV) to measure true betting skill. The metric every professional bettor monitors.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/backtesting",
    title: "Betting Strategy Backtesting Engine | ChalkPicks",
    description:
      "Backtest sports betting strategies against historical data. Validate systems before risking real money.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.7,
  },
  {
    path: "/tools",
    title: "Sports Betting Power Tools — EV, Arbitrage, Props & More | ChalkPicks",
    description:
      "The complete sports betting toolkit: +EV finder, arbitrage scanner, prop builder, line movement tracker, CLV tracker, and parlay builder.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/pricing",
    title: "ChalkPicks Pricing — Free & Premium AI Betting Plans",
    description:
      "Simple pricing for AI sports betting analytics. Start free, upgrade for full access to AI picks, +EV finder, arbitrage scanner, and premium tools.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    path: "/leaderboard",
    title: "Bettor Leaderboard — Top Performing Members | ChalkPicks",
    description:
      "See the top-performing bettors on ChalkPicks ranked by ROI, win rate, and units won.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.7,
  },
  {
    path: "/sportsbooks",
    title: "Best Sportsbooks Compared — Bonuses & Odds Quality | ChalkPicks",
    description:
      "Compare top sportsbooks on odds quality, bonuses, and limits. Find the best books for +EV betting and arbitrage.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/kalshi",
    title: "Kalshi Prediction Markets Analytics | ChalkPicks",
    description:
      "Analytics for Kalshi prediction markets. Find value in event contracts with data-driven analysis.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.6,
  },
  {
    path: "/blog",
    title: "Sports Betting Analytics Blog — Strategy & AI Insights | ChalkPicks",
    description:
      "Advanced sports betting strategy, +EV concepts, bankroll management, and AI betting analytics from the ChalkPicks team.",
    sitemap: true,
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/signup",
    title: "Create Your Free ChalkPicks Account | AI Sports Betting Analytics",
    description:
      "Sign up free for ChalkPicks and get AI sports picks, +EV alerts, and betting analytics tools.",
    sitemap: true,
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/login",
    title: "Sign In to ChalkPicks",
    description: "Log in to your ChalkPicks account to access AI picks and betting tools.",
    sitemap: true,
    changefreq: "monthly",
    priority: 0.5,
  },
  // /learn/* pages: title/description come from the shared LEARN_PAGES_META
  // array (shared/learnPagesMeta.ts) rather than being repeated here.
  ...LEARN_PAGES_META.map(
    (page): RouteSEOEntry => ({
      path: page.path,
      title: page.title,
      description: page.description,
      sitemap: true,
      changefreq: "monthly",
      priority: 0.7,
    })
  ),
  {
    path: "/free-pick",
    title: "Free Daily AI Sports Pick with Full Analysis | ChalkPicks",
    description: "Get one free AI sports pick every day with confidence score, edge rating, and full analysis. No account needed.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.9,
  },
  {
    path: "/tools/kelly-calculator",
    title: "Kelly Criterion Calculator for Sports Betting | ChalkPicks",
    description: "Free Kelly Criterion calculator. Calculate optimal bet sizing to maximize bankroll growth while managing risk.",
    sitemap: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/tools/ev-calculator",
    title: "Expected Value (EV) Calculator for Sports Betting | ChalkPicks",
    description: "Free EV calculator. Find +EV bets by comparing market odds to true probabilities and calculate expected profit.",
    sitemap: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/performance",
    title: "AI Picks Track Record — Verified Win Rate \& ROI | ChalkPicks",
    description: "Full transparency on ChalkPicks AI pick performance. View verified win rate, ROI, units won, and graded results.",
    sitemap: true,
    changefreq: "daily",
    priority: 0.9,
  },
];

/** Blog post slugs for sitemap + prerender (metadata lives in client/src/data/blog-posts.ts) */
export const blogSlugs: { slug: string; title: string; description: string }[] = [
  {
    slug: "best-ai-sports-betting-tools-2026",
    title: "Best AI Sports Betting Tools 2026: Revolutionizing How We Bet | ChalkPicks Blog",
    description:
      "Discover the top AI sports betting tools of 2026. Learn how machine learning, +EV finders, and predictive models are giving bettors a massive edge.",
  },
  {
    slug: "what-is-plus-ev-betting",
    title: "What is +EV Betting and How to Find +EV Bets | ChalkPicks Blog",
    description:
      "Master the concept of Positive Expected Value (+EV) betting. Learn how to calculate EV, beat the closing line, and use tools to find profitable bets.",
  },
  {
    slug: "how-to-find-arbitrage-bets",
    title: "How to Find Arbitrage Bets in Sports Betting | ChalkPicks Blog",
    description:
      "Learn the mechanics of arbitrage betting (arbing) to guarantee risk-free profits. Discover how to use tools to find and execute arbs before lines move.",
  },
  {
    slug: "sports-betting-bankroll-management",
    title: "Sports Betting Bankroll Management Strategy | ChalkPicks Blog",
    description:
      "The ultimate guide to bankroll management. Learn about unit sizing, the Kelly Criterion, and how to protect your bankroll from variance.",
  },
  {
    slug: "ai-picks-vs-handicappers",
    title: "AI Sports Picks vs Human Handicappers: Which is Better? | ChalkPicks Blog",
    description:
      "An objective comparison between AI sports betting models and traditional human handicappers. Discover why machine learning is taking over the industry.",
  },
];

export function getRouteSEO(path: string): RouteSEOEntry | undefined {
  const normalized = path.replace(/\/+$/, "") || "/";
  return routeSEO.find(r => r.path === normalized);
}
