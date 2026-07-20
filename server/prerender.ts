/**
 * prerender.ts — AI Crawler Prerender Middleware
 *
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot) read raw server HTML and do
 * NOT execute the Vite SPA's JavaScript. The JSON-LD and page content must be
 * in the initial HTML or the whole AEO layer is invisible.
 *
 * Strategy: serve a static HTML snapshot to bot user-agents, SPA to everyone else.
 * In dev mode, we generate a minimal inline HTML shell with the JSON-LD baked in.
 *
 * Sanity check: curl -A "GPTBot" https://chalkpicks.live/<page> must return
 * full HTML with JSON-LD visible.
 */

import type { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Bot detection ────────────────────────────────────────────────────────────

const BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /ClaudeBot/i,
  /Claude-Web/i,
  /PerplexityBot/i,
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Slackbot/i,
  /TelegramBot/i,
  /Discordbot/i,
  /ia_archiver/i,
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

const BASE_URL = "https://chalkpicks.live";
const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-white-bg-4Yx5nJvWkP8qR2mZ.png";

function orgLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "ChalkPicks",
    url: BASE_URL,
    logo: LOGO_URL,
  };
}

function websiteLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "ChalkPicks",
    url: BASE_URL,
    publisher: { "@id": `${BASE_URL}/#organization` },
  };
}

function breadcrumbLd(items: Array<{ name: string; path: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

function faqLd(faqs: Array<{ q: string; a: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

// ─── Route → page metadata map ────────────────────────────────────────────────

interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  jsonLd: object[];
}

const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "ChalkPicks — AI Sports Betting Picks & +EV Finder",
    description:
      "AI-powered sports betting picks with +EV finder, CLV tracker, arbitrage detector, and steam move alerts. Beat the closing line every time.",
    canonicalPath: "/",
    jsonLd: [
      orgLd(),
      websiteLd(),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "ChalkPicks",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "19.99", priceCurrency: "USD" },
      },
    ],
  },
  "/picks": {
    title: "AI Daily Sports Betting Picks — ChalkPicks",
    description:
      "Today's AI-generated sports betting picks with confidence scores, edge analysis, and +EV ratings across NFL, NBA, MLB, NHL, and more.",
    canonicalPath: "/picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Picks", path: "/picks" }]),
    ],
  },
  "/ev-finder": {
    title: "+EV Finder — Real Expected Value Bets | ChalkPicks",
    description:
      "Find positive expected value (+EV) bets in real time. Devigged odds from 15+ sportsbooks with Pinnacle as the sharp reference line.",
    canonicalPath: "/ev-finder",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "+EV Finder", path: "/ev-finder" }]),
    ],
  },
  "/arbitrage": {
    title: "Sports Betting Arbitrage Finder — ChalkPicks",
    description:
      "Lock in guaranteed profit by betting both sides across sportsbooks. Real-time arbitrage scanner across DraftKings, FanDuel, BetMGM, Caesars, and more.",
    canonicalPath: "/arbitrage",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Arbitrage", path: "/arbitrage" }]),
    ],
  },
  "/clv-tracker": {
    title: "Closing Line Value (CLV) Tracker — ChalkPicks",
    description:
      "Track your closing line value to measure betting sharpness. CLV is the #1 predictor of long-term profitability in sports betting.",
    canonicalPath: "/clv-tracker",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "CLV Tracker", path: "/clv-tracker" }]),
    ],
  },
  "/line-movement": {
    title: "Line Movement Tracker & Steam Moves — ChalkPicks",
    description:
      "Track real-time line movement, steam moves, and reverse line movement (RLM) across all major sportsbooks. Follow the sharp money.",
    canonicalPath: "/line-movement",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Line Movement", path: "/line-movement" }]),
    ],
  },
  "/nfl-picks": {
    title: "NFL Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NFL picks with AI-powered analysis, spread predictions, moneyline value, and over/under recommendations. Updated daily.",
    canonicalPath: "/nfl-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "NFL Picks", path: "/nfl-picks" }]),
      faqLd([{
        q: "What are the best NFL picks today?",
        a: "ChalkPicks uses AI and statistical modeling to identify the best NFL picks daily, focusing on positive expected value (+EV) bets priced against sharp books like Pinnacle.",
      }]),
    ],
  },
  "/nba-picks": {
    title: "NBA Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NBA picks with AI-powered analysis, spread predictions, player prop recommendations, and over/under value. Updated daily.",
    canonicalPath: "/nba-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "NBA Picks", path: "/nba-picks" }]),
    ],
  },
  "/mlb-picks": {
    title: "MLB Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best MLB picks with AI-powered analysis, run line value, moneyline predictions, and over/under recommendations.",
    canonicalPath: "/mlb-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "MLB Picks", path: "/mlb-picks" }]),
    ],
  },
  "/nhl-picks": {
    title: "NHL Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NHL picks with AI-powered analysis, puck line value, moneyline predictions, and over/under recommendations.",
    canonicalPath: "/nhl-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "NHL Picks", path: "/nhl-picks" }]),
    ],
  },
  "/ncaaf-picks": {
    title: "College Football Picks Today — NCAAF Best Bets",
    description:
      "Today's best NCAAF picks with AI-powered analysis, spread predictions, and over/under value. College football betting made smarter.",
    canonicalPath: "/ncaaf-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "NCAAF Picks", path: "/ncaaf-picks" }]),
    ],
  },
  "/ncaab-picks": {
    title: "College Basketball Picks Today — NCAAB Best Bets",
    description:
      "Today's best NCAAB picks with AI-powered analysis, spread predictions, and over/under value. College basketball betting made smarter.",
    canonicalPath: "/ncaab-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "NCAAB Picks", path: "/ncaab-picks" }]),
    ],
  },
  "/mma-picks": {
    title: "MMA & UFC Picks Today — AI Fight Predictions",
    description:
      "Today's best MMA and UFC picks with AI-powered analysis, moneyline value, and method of victory predictions.",
    canonicalPath: "/mma-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "MMA Picks", path: "/mma-picks" }]),
    ],
  },
  "/soccer-picks": {
    title: "Soccer Picks Today — EPL, MLS & La Liga Best Bets",
    description:
      "Today's best soccer picks for EPL, MLS, La Liga, and more with AI-powered analysis, moneyline value, and over/under recommendations.",
    canonicalPath: "/soccer-picks",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Soccer Picks", path: "/soccer-picks" }]),
    ],
  },
  "/tools/devig-calculator": {
    title: "Devig Calculator — Remove Vig & Find Fair Odds",
    description:
      "Free devig calculator to remove bookmaker vig and find true fair odds. Supports proportional, additive, and power devigging methods.",
    canonicalPath: "/tools/devig-calculator",
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Tools", path: "/tools" },
        { name: "Devig Calculator", path: "/tools/devig-calculator" },
      ]),
      faqLd([{
        q: "What is devigging in sports betting?",
        a: "Devigging (removing the vig) is the process of converting bookmaker odds into true probability estimates by removing the bookmaker's built-in margin (juice). This reveals the fair odds for each outcome.",
      }]),
    ],
  },
  "/dfs-optimizer": {
    title: "DFS Lineup Optimizer — DraftKings & FanDuel",
    description:
      "Free DFS lineup optimizer for DraftKings and FanDuel. Maximize your projected points within salary cap constraints for NFL, NBA, and MLB.",
    canonicalPath: "/dfs-optimizer",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "DFS Optimizer", path: "/dfs-optimizer" }]),
    ],
  },
  "/pricing": {
    title: "ChalkPicks Pricing — Pro & Elite Plans",
    description:
      "ChalkPicks Pro at $19.99/month or Elite at $59.99/year. Full AI picks, +EV finder, arbitrage alerts, CLV tracking, and more.",
    canonicalPath: "/pricing",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]),
    ],
  },
  "/blog": {
    title: "Sports Betting Blog — Strategy, Tips & Analysis",
    description:
      "Expert sports betting strategy, tips, and analysis from the ChalkPicks team. Learn about +EV betting, CLV, arbitrage, and bankroll management.",
    canonicalPath: "/blog",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
    ],
  },
  "/sharp-money": {
    title: "Sharp Money Detector — Real-Time Line Movement",
    description:
      "Detect sharp money moves and public betting divergence in real-time. Track where the smart money is going across all major sportsbooks.",
    canonicalPath: "/sharp-money",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Sharp Money", path: "/sharp-money" }]),
    ],
  },
  "/consensus": {
    title: "Consensus Picks — Public vs AI Recommendations",
    description:
      "Compare public betting consensus against ChalkPicks AI recommendations. See where the crowd is wrong and find contrarian value.",
    canonicalPath: "/consensus",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Consensus", path: "/consensus" }]),
    ],
  },
  "/api-access": {
    title: "ChalkPicks API — EV, CLV & Devig Endpoints",
    description:
      "Access ChalkPicks data programmatically. Get +EV picks, CLV tracking, and devig calculations via our paid REST API.",
    canonicalPath: "/api-access",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "API Access", path: "/api-access" }]),
    ],
  },
  "/parlay-flow": {
    title: "Visual Parlay Builder — Drag & Drop Creator",
    description:
      "Build parlays visually with our drag-and-drop flow builder. See correlations, calculate odds, and optimize your multi-leg bets.",
    canonicalPath: "/parlay-flow",
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Parlay Flow", path: "/parlay-flow" }]),
    ],
  },
  "/learn/closing-line-value": {
    title: "What Is Closing Line Value (CLV)? | ChalkPicks",
    description:
      "Closing line value (CLV) explained: how to calculate it, why it beats win rate as a skill metric, and how to track it on every bet.",
    canonicalPath: "/learn/closing-line-value",
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
        { name: "Closing Line Value", path: "/learn/closing-line-value" },
      ]),
      faqLd([
        {
          q: "What is closing line value (CLV)?",
          a: "Closing line value (CLV) is the difference between the odds you bet at and the odds available right before the game starts (the closing line). Positive CLV means you got a better price than the market settled on — the strongest long-run predictor of a bettor's skill.",
        },
        {
          q: "Why does CLV matter more than win rate?",
          a: "Win rate is noisy over any single season because of variance. CLV isolates whether you're consistently getting better prices than the closing market, which converges to true skill much faster than win/loss record.",
        },
      ]),
    ],
  },
  "/learn/no-vig-odds": {
    title: "No-Vig Odds Explained | ChalkPicks",
    description:
      "How to remove the sportsbook's vig from any odds to find the true, fair probability — and use it to spot +EV bets.",
    canonicalPath: "/learn/no-vig-odds",
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
        { name: "No-Vig Odds", path: "/learn/no-vig-odds" },
      ]),
      faqLd([
        {
          q: "What does 'no-vig' or 'devigged' odds mean?",
          a: "No-vig (or devigged) odds are betting odds with the sportsbook's built-in profit margin — the vig, or juice — mathematically removed, leaving only the market's true, fair probability estimate for each outcome.",
        },
        {
          q: "How do you remove the vig from odds?",
          a: "Convert each side's American odds to implied probability, sum them, then divide each individual probability by that sum so they total exactly 100%. This is proportional devigging.",
        },
      ]),
    ],
  },
  "/learn/kelly-criterion": {
    title: "The Kelly Criterion for Bet Sizing | ChalkPicks",
    description:
      "The Kelly Criterion formula explained: how to size bets for long-term bankroll growth, and why fractional Kelly is the practical choice.",
    canonicalPath: "/learn/kelly-criterion",
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
        { name: "Kelly Criterion", path: "/learn/kelly-criterion" },
      ]),
      faqLd([
        {
          q: "What is the Kelly Criterion in sports betting?",
          a: "The Kelly Criterion is a formula for sizing bets that maximizes a bankroll's long-run growth rate given your edge and the odds offered: f = (bp − q) / b.",
        },
        {
          q: "Why do bettors use fractional Kelly instead of full Kelly?",
          a: "Full Kelly assumes your probability estimate is exactly correct, which it never is in practice. Betting a fraction of full Kelly — commonly 25% or 50% — trades some theoretical growth for much lower variance.",
        },
      ]),
    ],
  },
  "/learn/line-movement": {
    title: "Line Movement & Steam Moves Explained | ChalkPicks",
    description:
      "How betting lines move, what a steam move is, how it differs from reverse line movement, and how to track sharp money in real time.",
    canonicalPath: "/learn/line-movement",
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
        { name: "Line Movement", path: "/learn/line-movement" },
      ]),
      faqLd([
        {
          q: "What is a steam move in sports betting?",
          a: "A steam move is a sudden, sharp shift in the betting line — often several points or a large odds jump — that happens nearly simultaneously across multiple sportsbooks, typically signaling professional money hit the market.",
        },
        {
          q: "What's the difference between a steam move and reverse line movement?",
          a: "A steam move is defined by speed and size. Reverse line movement (RLM) is defined by direction relative to public betting: the line moves toward a team even though most public bets are on the other side.",
        },
      ]),
    ],
  },
};

// ─── HTML shell builder ───────────────────────────────────────────────────────

function buildPrerenderedHtml(meta: PageMeta): string {
  const canonical = `${BASE_URL}${meta.canonicalPath}`;
  const jsonLdScripts = meta.jsonLd
    .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${LOGO_URL}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="robots" content="index, follow" />
  ${jsonLdScripts}
</head>
<body>
  <h1>${meta.title}</h1>
  <p>${meta.description}</p>
  <p>Visit <a href="${BASE_URL}">ChalkPicks</a> for the full interactive experience.</p>
  <nav>
    <ul>
      <li><a href="${BASE_URL}/picks">AI Daily Picks</a></li>
      <li><a href="${BASE_URL}/ev-finder">+EV Finder</a></li>
      <li><a href="${BASE_URL}/arbitrage">Arbitrage Finder</a></li>
      <li><a href="${BASE_URL}/clv-tracker">CLV Tracker</a></li>
      <li><a href="${BASE_URL}/line-movement">Line Movement</a></li>
      <li><a href="${BASE_URL}/nfl-picks">NFL Picks</a></li>
      <li><a href="${BASE_URL}/nba-picks">NBA Picks</a></li>
      <li><a href="${BASE_URL}/mlb-picks">MLB Picks</a></li>
      <li><a href="${BASE_URL}/nhl-picks">NHL Picks</a></li>
      <li><a href="${BASE_URL}/blog">Blog</a></li>
      <li><a href="${BASE_URL}/pricing">Pricing</a></li>
    </ul>
  </nav>
</body>
</html>`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Register prerender middleware on the Express app.
 * Must be called BEFORE serveStatic / setupVite.
 */
export function registerPrerenderMiddleware(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ua = req.headers["user-agent"] ?? "";

    // Only intercept bot requests for HTML pages (not API, not assets)
    if (!isBot(ua)) return next();
    if (req.path.startsWith("/api/")) return next();
    if (req.path.includes(".")) return next(); // skip static assets

    const requestPath = req.path === "/" ? "/" : req.path.replace(/\/$/, "");

    // Blog articles and pick detail pages are DB-backed and change constantly —
    // the snapshot below is only ever as fresh as the last `vite build`, and
    // the case-3 fallback has no real content for them at all (generic shell,
    // wrong title, no Article/FAQ JSON-LD). server/_core/seo.ts's injectSeo
    // already builds real per-post JSON-LD (with articleBody, so crawlers get
    // the actual text even without executing JS) straight from the DB on every
    // request, so let those two routes fall through to it instead of stopping
    // here.
    if (/^\/blog\/[a-z0-9-]+$/i.test(requestPath) || /^\/picks\/\d+$/.test(requestPath)) {
      return next();
    }

    // 1. Try to serve a pre-built static snapshot from dist/public/snapshots/
    const distBase =
      process.env.NODE_ENV === "development"
        ? path.resolve(process.cwd(), "dist", "public")
        : path.resolve(__dirname, "public");

    const snapshotSlug =
      requestPath === "/" ? "index" : requestPath.replace(/\//g, "_").replace(/^_/, "");
    const snapshotPath = path.join(distBase, "snapshots", `${snapshotSlug}.html`);

    if (fs.existsSync(snapshotPath)) {
      res.set("X-Prerendered", "1");
      res.set("Cache-Control", "public, max-age=3600");
      res.set("Content-Type", "text/html; charset=utf-8");
      return res.sendFile(snapshotPath);
    }

    // 2. Fall back to inline HTML shell with JSON-LD from the metadata map
    const meta = PAGE_META[requestPath];
    if (meta) {
      const html = buildPrerenderedHtml(meta);
      res.set("X-Prerendered", "1");
      res.set("Cache-Control", "public, max-age=3600");
      res.set("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    // 3. For unknown paths (blog posts, etc.) serve a generic shell
    const genericMeta: PageMeta = {
      title: "ChalkPicks — AI Sports Betting Analytics",
      description:
        "AI-powered sports betting picks, +EV finder, CLV tracker, arbitrage detector, and steam move alerts.",
      canonicalPath: requestPath,
      jsonLd: [orgLd(), websiteLd()],
    };
    const html = buildPrerenderedHtml(genericMeta);
    res.set("X-Prerendered", "1");
    res.set("Cache-Control", "public, max-age=1800");
    res.set("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  });
}
