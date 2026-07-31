/**
 * Route → SEO meta map shared by the client (PageMeta component) and the
 * server (per-route HTML injection in server/_core/seo.ts). One source of
 * truth so crawlers (server-rendered head) and users (client-updated head)
 * always see the same titles/descriptions.
 *
 * Titles should be 50-60 characters; descriptions 150-160 characters.
 * Trust rule: no fixed win-rate %, no “every time,” no free-trial claims unless live.
 */
import { LEARN_PAGES_META } from "./learnPagesMeta";

export interface PageMetaConfig {
  title: string;
  description: string;
}

export const PAGE_META_MAP: Record<string, PageMetaConfig> = {
  "/": {
    title: "ChalkPicks | AI Sports Betting Analytics & +EV Tools",
    description:
      "AI sports betting analytics: picks with confidence scores, +EV scanning, CLV tracking, and a public Pick Ledger. Free tools available — not a sportsbook.",
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
      "Affordable sports betting analytics plans. Basic $9.99/mo, Pro $19.99/mo, Elite $59.99/yr. Full access to premium tools.",
  },
  "/performance": {
    title: "Pick Performance & Results | ChalkPicks Analytics",
    description:
      "Transparent AI pick results by sport: settled wins, losses, ROI context, and confidence breakdowns from graded data.",
  },
  "/prop-builder": {
    title: "Prop Builder | Custom Player Prop Analysis",
    description:
      "Build custom player prop combinations with AI-assisted analysis and edge scores across NFL, NBA, MLB, NHL.",
  },
  "/line-movement": {
    title: "Line Movement Tracker | Steam Moves & Sharp Money",
    description:
      "Real-time line movement tracking across major sportsbooks. Detect steam moves and sharp money action as lines adjust.",
  },
  "/correlation-finder": {
    title: "Correlation Finder | Prop Correlation Analysis",
    description:
      "Analyze player prop correlations and identify combinations for more informed parlay construction.",
  },
  "/kalshi": {
    title: "Kalshi Prediction Markets | ChalkPicks",
    description:
      "Explore Kalshi prediction market contracts with real-time odds and AI-assisted probability context.",
  },
  "/clv-tracker": {
    title: "CLV Tracker | Closing Line Value Analysis",
    description:
      "Track closing line value (CLV) on your process. CLV is one of the strongest long-term skill signals for bettors.",
  },
  "/arbitrage": {
    title: "Arbitrage Scanner | Cross-Book Odds Discrepancies",
    description:
      "Scan major sportsbooks for cross-book price disagreements. When true arbs appear, see stake splits — execution risk still applies.",
  },
  "/arbitrage-opportunities": {
    title: "Real-Time Arbitrage Opportunities | ChalkPicks",
    description:
      "Monitor multi-book odds for arbitrage-style discrepancies with stake suggestions and risk notes.",
  },
  "/ev-finder": {
    title: "+EV Finder | Positive Expected Value Bets",
    description:
      "Scan odds from major sportsbooks and surface +EV candidates where model fair price differs from the market.",
  },
  "/parlay-builder": {
    title: "Parlay Builder | Multi-Leg Parlay Constructor",
    description:
      "Build multi-leg parlays with AI-assisted picks, correlation context, and payout calculations across sports.",
  },
  "/leaderboard": {
    title: "Community Leaderboard | Top Bettors & Rankings",
    description:
      "View community rankings by ROI, results, and CLV-oriented metrics where available.",
  },
  "/backtesting": {
    title: "Backtesting Tool | Historical Strategy Checks",
    description:
      "Backtest strategies against historical data before risking bankroll. Past results are not future performance.",
  },
  "/sportsbooks": {
    title: "Sportsbooks | Compare Books & Promos",
    description:
      "Compare sportsbooks, promotions, and line quality context for research — ChalkPicks is analytics, not a book.",
  },
  "/tools": {
    title: "Sports Betting Tools | Calculators & Analyzers",
    description:
      "Free and premium tools: odds calculator, ROI, bankroll, line movement, prop builder, CLV tracker, and more.",
  },
  "/tools/odds-calculator": {
    title: "Free Odds Converter | American Decimal Fractional",
    description:
      "Convert betting odds between American, decimal, and fractional formats instantly. Free calculator with implied probability.",
  },
  "/tools/roi-calculator": {
    title: "Free Betting ROI Calculator | Track Your Results",
    description:
      "Calculate sports betting ROI, profit/loss, and break-even win rate with a free calculator.",
  },
  "/tools/parlay-calculator": {
    title: "Free Parlay Calculator | Multi-Leg Payout Tool",
    description:
      "Calculate parlay payouts for multi-leg bets. Enter odds and see combined payout and implied probability.",
  },
  "/blog": {
    title: "Sports Betting Blog | Strategy & AI Insights | ChalkPicks",
    description:
      "Sports betting strategy, +EV concepts, bankroll management, and AI analytics insights from ChalkPicks.",
  },
  "/signup": {
    title: "Sign Up | ChalkPicks",
    description:
      "Create a ChalkPicks account for AI-assisted picks, +EV tools, and analytics. Plans from $9.99/mo.",
  },
  "/login": {
    title: "Login | ChalkPicks Account",
    description:
      "Log in to your ChalkPicks account to access AI picks, analytics, and premium tools.",
  },
  "/dashboard": {
    title: "Dashboard | Your ChalkPicks Account",
    description:
      "View your account overview, subscription status, recent picks, performance stats, and settings.",
  },
  "/bankroll-tracker": {
    title: "Bankroll Tracker | Betting Budget Manager",
    description:
      "Track betting bankroll, unit sizing, and ROI over time.",
  },
  "/free-picks": {
    title: "Free Sports Betting Picks Today | ChalkPicks",
    description:
      "Free AI-assisted sports picks with confidence scores for major leagues. Analytics only — gamble responsibly.",
  },
  "/strategy-builder": {
    title: "AI Betting Strategy Builder | ChalkPicks",
    description:
      "Build and backtest custom sports betting strategy filters with AI-assisted configuration.",
  },
  "/tools/free-bet-converter": {
    title: "Free Bet Converter | Promo Hedge Helper | ChalkPicks",
    description:
      "Estimate hedge stakes to convert free-bet promos into a more predictable cash outcome when books allow.",
  },
  "/tools/middles-finder": {
    title: "Middles Finder | Middle Windows | ChalkPicks",
    description:
      "Explore middle windows across lines and estimate opportunity size — not a promise of dual wins.",
  },
  "/guides": {
    title: "Sports Betting Guides | Free Strategy Guides | ChalkPicks",
    description:
      "Free guides on +EV, bankroll, arbitrage concepts, Kelly Criterion, and more.",
  },
  "/public-betting": {
    title:
      "Public Betting Percentages | Where Is the Money Going? | ChalkPicks",
    description:
      "Track public betting percentages and sharp-vs-public splits where data is available.",
  },
  "/odds-comparison": {
    title: "Live Odds Comparison | Best Lines Across Books | ChalkPicks",
    description:
      "Compare live odds from major sportsbooks. Spot line differences and steam context.",
  },
  "/methodology": {
    title: "AI Picks Methodology | How ChalkPicks Works",
    description:
      "How ChalkPicks builds picks: odds ingestion, modeling context, confidence scoring, and CLV-oriented process.",
  },
  "/how-it-works": {
    title: "How ChalkPicks Works | AI Sports Betting Analytics",
    description:
      "From real-time odds to AI-assisted picks, confidence scores, ledger locks, and tools — platform walkthrough.",
  },
  "/ai-leaderboard": {
    title: "AI Picks Leaderboard | Performance by Sport | ChalkPicks",
    description:
      "Track model performance by sport from graded results. Past performance is not a guarantee of future results.",
  },
  "/nfl-picks": {
    title: "NFL Picks Today | AI Football Analysis | ChalkPicks",
    description:
      "AI-assisted NFL picks with confidence scores and edge context. Updated for the current slate.",
  },
  "/nba-picks": {
    title: "NBA Picks Today | AI Basketball Analysis | ChalkPicks",
    description:
      "AI-assisted NBA picks with spread, total, and moneyline context plus confidence scores.",
  },
  "/mlb-picks": {
    title: "MLB Picks Today | AI Baseball Analysis | ChalkPicks",
    description:
      "Daily AI-assisted MLB picks with pitcher matchup context and edge scores.",
  },
  "/nhl-picks": {
    title: "NHL Picks Today | AI Hockey Analysis | ChalkPicks",
    description:
      "AI-assisted NHL picks with puck line, moneyline, and totals context.",
  },
  "/ncaaf-picks": {
    title: "NCAAF Picks Today | College Football AI Analysis",
    description:
      "AI-assisted NCAAF picks with confidence scores and edge context for the college slate.",
  },
  "/ncaab-picks": {
    title: "NCAAB Picks Today | College Basketball AI Analysis",
    description:
      "AI-assisted NCAAB picks with tempo and matchup context for college basketball.",
  },
  "/mma-picks": {
    title: "MMA Picks Today | UFC & Bellator Analysis",
    description:
      "AI-assisted MMA analysis using fighter metrics and matchup context for major cards.",
  },
  "/soccer-picks": {
    title: "Soccer Picks Today | EPL, MLS & More",
    description:
      "AI-assisted soccer picks for major leagues with form and edge context.",
  },
  "/daily-picks": {
    title: "Daily AI Picks Archive — Past Results by Date | ChalkPicks",
    description:
      "Browse ChalkPicks AI picks by date. Transparency on graded outcomes where available.",
  },
  "/free-pick": {
    title: "Free Daily AI Sports Pick with Full Analysis | ChalkPicks",
    description:
      "One free AI-assisted pick with confidence score and analysis. No account required. Gamble responsibly.",
  },
  "/responsible-gambling": {
    title: "Responsible Gambling — Resources & Self-Exclusion | ChalkPicks",
    description:
      "ChalkPicks supports responsible gambling. Self-exclusion links, problem gambling resources, and bankroll guidelines.",
  },
  "/results": {
    title: "AI Pick Results & Track Record | ChalkPicks",
    description:
      "Graded pick results with outcomes and confidence context. Full transparency — not a promise of future returns.",
  },
  "/tools/bankroll-manager": {
    title: "Sports Betting Bankroll Manager — Track & Protect | ChalkPicks",
    description:
      "Free bankroll tool: unit sizes, deposits/withdrawals, and growth visualization.",
  },
  "/tools/ev-calculator": {
    title: "Expected Value (EV) Calculator for Sports Betting | ChalkPicks",
    description:
      "Free EV calculator. Compare odds to estimated probabilities and compute expected value.",
  },
  "/tools/kelly-calculator": {
    title: "Kelly Criterion Calculator for Sports Betting | ChalkPicks",
    description:
      "Free Kelly Criterion calculator for educational bet sizing — not financial advice.",
  },
  "/verify": {
    title: "Pick Verification Ledger — Cryptographic Proof | ChalkPicks",
    description:
      "Verify picks locked before game start via SHA-256 content hash. Transparency over screenshots.",
  },
};

for (const page of LEARN_PAGES_META) {
  PAGE_META_MAP[page.path] = {
    title: page.title,
    description: page.description,
  };
}

export function resolvePageMeta(pathname: string): PageMetaConfig {
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (PAGE_META_MAP[cleanPath]) return PAGE_META_MAP[cleanPath];
  if (cleanPath.startsWith("/picks/")) return PAGE_META_MAP["/picks"];
  if (cleanPath.startsWith("/verify/")) return PAGE_META_MAP["/verify"];
  return PAGE_META_MAP["/"];
}
