/**
 * Route → SEO meta map shared by the client (PageMeta component) and the
 * server (per-route HTML injection in server/_core/seo.ts). One source of
 * truth so crawlers (server-rendered head) and users (client-updated head)
 * always see the same titles/descriptions.
 *
 * Titles should be 50-60 characters; descriptions 150-160 characters.
 */
import { LEARN_PAGES_META } from "./learnPagesMeta";

export interface PageMetaConfig {
  title: string;
  description: string;
}

export const PAGE_META_MAP: Record<string, PageMetaConfig> = {
  "/": {
    title: "ChalkPicks | AI Sports Betting Picks & +EV Finder Tool",
    description:
      "AI-powered sports betting picks with a data-driven edge. +EV finder, prop builder, line movement tracker, and arbitrage alerts across NFL, NBA, MLB & NHL.",
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
      "Affordable sports betting analytics plans. Basic $9.99/mo, Pro $19.99/mo, Elite $59.99/yr. Full access to all premium tools.",
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
  "/tools/odds-calculator": {
    title: "Free Odds Converter | American Decimal Fractional",
    description:
      "Convert betting odds between American, decimal, and fractional formats instantly. Free odds calculator with implied probability and payout breakdown.",
  },
  "/tools/roi-calculator": {
    title: "Free Betting ROI Calculator | Track Your Profits",
    description:
      "Calculate your sports betting return on investment. Track total profit, ROI percentage, and break-even win rate with our free calculator.",
  },
  "/tools/parlay-calculator": {
    title: "Free Parlay Calculator | Multi-Leg Payout Tool",
    description:
      "Calculate parlay payouts for 2-15 leg bets instantly. Enter American or decimal odds and see total payout, profit, and implied probability.",
  },
  "/blog": {
    title: "Sports Betting Blog | Expert Analysis & AI Insights | ChalkPicks",
    description:
      "Expert sports betting analysis, AI-powered strategies, and data-driven insights. Learn how to beat the books with ChalkPicks Pro.",
  },
  "/signup": {
    title: "Sign Up | ChalkPicks",
    description:
      "Create a ChalkPicks account and get instant access to AI picks, +EV finder, prop builder, and more. Plans from $9.99/mo.",
  },
  "/login": {
    title: "Login | ChalkPicks Account",
    description:
      "Log in to your ChalkPicks account to access AI picks, analytics, and premium tools.",
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
  "/free-picks": {
    title: "Free Sports Betting Picks Today | ChalkPicks",
    description:
      "Get free AI-generated sports betting picks every day. NFL, NBA, MLB, NHL picks with confidence scores.",
  },
  "/strategy-builder": {
    title: "AI Betting Strategy Builder | ChalkPicks",
    description:
      "Build, configure, and backtest custom sports betting strategies with AI. Define your edge and simulate performance.",
  },
  "/tools/free-bet-converter": {
    title: "Free Bet Converter | Convert Promos to Cash | ChalkPicks",
    description:
      "Convert sportsbook free bets into guaranteed cash profit using hedging. Calculate the exact hedge bet needed.",
  },
  "/tools/middles-finder": {
    title: "Middles Finder | Find Middle Opportunities | ChalkPicks",
    description:
      "Find middle opportunities where you can win both sides of a bet. Calculate the middle window and expected value.",
  },
  "/guides": {
    title: "Sports Betting Guides | Free Strategy Guides | ChalkPicks",
    description:
      "Free sports betting strategy guides covering +EV betting, bankroll management, arbitrage, Kelly Criterion, and more.",
  },
  "/public-betting": {
    title:
      "Public Betting Percentages | Where Is the Money Going? | ChalkPicks",
    description:
      "Track public betting percentages across all sports. See bet % vs money %, identify sharp vs public splits.",
  },
  "/odds-comparison": {
    title: "Live Odds Comparison | Best Lines Across Books | ChalkPicks",
    description:
      "Compare live odds from 10+ sportsbooks side by side. Detect steam moves, find best lines, and sort by Kelly %, edge %, or steam score.",
  },
  "/methodology": {
    title: "AI Picks Methodology | How ChalkPicks Works",
    description:
      "See exactly how ChalkPicks AI generates picks: data ingestion, Elo ratings, Poisson modeling, Kelly Criterion sizing, and edge scoring.",
  },
  "/how-it-works": {
    title: "How ChalkPicks Works | AI Sports Betting Platform",
    description:
      "Step-by-step walkthrough of the ChalkPicks platform: real-time odds, AI analysis, confidence scores, and bankroll management tools.",
  },
  "/ai-leaderboard": {
    title: "AI Picks Leaderboard | Top Performing Models | ChalkPicks",
    description:
      "Track AI model performance across sports. Compare win rates, ROI, CLV, and confidence accuracy for each ChalkPicks model.",
  },
  "/nfl-picks": {
    title: "NFL Picks Today | AI Football Betting Picks | ChalkPicks",
    description:
      "AI-generated NFL picks with confidence scores, spread analysis, and edge ratings. Updated daily for every NFL game.",
  },
  "/nba-picks": {
    title: "NBA Picks Today | AI Basketball Betting Picks | ChalkPicks",
    description:
      "AI-powered NBA picks with moneyline, spread, and over/under analysis. Daily picks with confidence scores and edge ratings.",
  },
  "/mlb-picks": {
    title: "MLB Picks Today | AI Baseball Betting Picks | ChalkPicks",
    description:
      "Daily AI-generated MLB picks with pitcher matchup analysis, run line, and over/under recommendations with edge scores.",
  },
  "/nhl-picks": {
    title: "NHL Picks Today | AI Hockey Betting Picks | ChalkPicks",
    description:
      "AI-powered NHL picks with puck line, moneyline, and over/under analysis. Daily picks with confidence scores and edge ratings.",
  },
  "/ncaaf-picks": {
    title: "NCAAF Picks Today | College Football AI Picks",
    description:
      "AI-powered NCAAF picks using SP+ ratings, recruiting data, and tempo metrics. Daily college football predictions with confidence scores.",
  },
  "/ncaab-picks": {
    title: "NCAAB Picks Today | College Basketball AI Picks",
    description:
      "AI-powered NCAAB picks using KenPom ratings, tempo analysis, and ATS trends. Daily college basketball predictions and March Madness picks.",
  },
  "/mma-picks": {
    title: "MMA Picks Today | UFC & Bellator AI Predictions",
    description:
      "AI-powered MMA picks analyzing fighter stats, striking accuracy, grappling metrics, and historical matchup data for UFC and Bellator events.",
  },
  "/soccer-picks": {
    title: "Soccer Picks Today | EPL, MLS & Champions League AI",
    description:
      "AI-powered soccer picks for EPL, MLS, Champions League, and more. Daily predictions with expected goals, form analysis, and edge scores.",
  },
  // These routes are live in App.tsx and listed in shared/seo-routes.ts's
  // sitemap, but had no entry here — resolvePageMeta() was silently falling
  // them all back to the homepage title/description. Copy matches the
  // existing sitemap entries in shared/seo-routes.ts for consistency.
  "/daily-picks": {
    title: "Daily AI Picks Archive — Past Results by Date | ChalkPicks",
    description:
      "Browse the complete archive of ChalkPicks AI sports betting picks by date. Full transparency on wins, losses, and performance for NFL, NBA, MLB & NHL.",
  },
  "/free-pick": {
    title: "Free Daily AI Sports Pick with Full Analysis | ChalkPicks",
    description:
      "Get one free AI sports pick every day with confidence score, edge rating, and full analysis. No account needed.",
  },
  "/responsible-gambling": {
    title: "Responsible Gambling — Resources & Self-Exclusion | ChalkPicks",
    description:
      "ChalkPicks is committed to responsible gambling. Access self-exclusion tools, problem gambling resources, and bankroll management guidelines.",
  },
  "/results": {
    title: "AI Pick Results & Track Record — Verified Win Rate | ChalkPicks",
    description:
      "Full transparency on ChalkPicks AI pick results. View every graded pick with win/loss outcomes, confidence scores, and 30-day performance calendar.",
  },
  "/tools/bankroll-manager": {
    title: "Sports Betting Bankroll Manager — Track & Protect | ChalkPicks",
    description:
      "Free bankroll management tool for sports bettors. Set unit sizes, track deposits and withdrawals, and visualize bankroll growth over time.",
  },
  "/tools/ev-calculator": {
    title: "Expected Value (EV) Calculator for Sports Betting | ChalkPicks",
    description:
      "Free EV calculator. Find +EV bets by comparing market odds to true probabilities and calculate expected profit.",
  },
  "/tools/kelly-calculator": {
    title: "Kelly Criterion Calculator for Sports Betting | ChalkPicks",
    description:
      "Free Kelly Criterion calculator. Calculate optimal bet sizing to maximize bankroll growth while managing risk.",
  },
  "/verify": {
    title: "Pick Verification Ledger — Cryptographic Proof | ChalkPicks",
    description:
      "Verify every ChalkPicks AI pick was locked before game start with SHA-256 hash proof. Full transparency, zero manipulation.",
  },
};

// /learn/* pages: title/description come from the shared LEARN_PAGES_META
// array (shared/learnPagesMeta.ts) rather than being repeated here.
for (const page of LEARN_PAGES_META) {
  PAGE_META_MAP[page.path] = {
    title: page.title,
    description: page.description,
  };
}

/**
 * Resolve the meta config for a pathname, with the same fallback rules the
 * client uses: exact match → /picks/* falls back to /picks → homepage.
 */
export function resolvePageMeta(pathname: string): PageMetaConfig {
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (PAGE_META_MAP[cleanPath]) return PAGE_META_MAP[cleanPath];
  if (cleanPath.startsWith("/picks/")) return PAGE_META_MAP["/picks"];
  if (cleanPath.startsWith("/verify/")) return PAGE_META_MAP["/verify"];
  return PAGE_META_MAP["/"];
}
