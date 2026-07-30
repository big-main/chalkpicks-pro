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
import { LEARN_PAGES_META } from "@shared/learnPagesMeta";
import { PAGE_META_MAP as ROUTE_META_MAP } from "@shared/routeMeta";
import { esc } from "./_core/seo";

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
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

const BASE_URL = "https://chalkpicks.live";
const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png";

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
    mainEntity: faqs.map(faq => ({
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
};

// Every other hand-curated page shares the exact same org + breadcrumb (+
// optional FAQ) JSON-LD shape — writing that out per-page literal was pure
// copy-paste (and the largest source of duplicated code in this file), so
// it's expressed as data run through one builder instead, same convention
// as LEARN_PAGES_META below and routeFallbackEntries further down.
interface CuratedPage {
  path: string;
  title: string;
  description: string;
  /** Breadcrumb trail after "Home" — most pages are a single entry. */
  breadcrumb: Array<{ name: string; path: string }>;
  faqs?: Array<{ q: string; a: string }>;
}

const CURATED_PAGES: CuratedPage[] = [
  {
    path: "/picks",
    title: "AI Daily Sports Betting Picks — ChalkPicks",
    description:
      "Today's AI-generated sports betting picks with confidence scores, edge analysis, and +EV ratings across NFL, NBA, MLB, NHL, and more.",
    breadcrumb: [{ name: "Picks", path: "/picks" }],
  },
  {
    path: "/ev-finder",
    title: "+EV Finder — Real Expected Value Bets | ChalkPicks",
    description:
      "Find positive expected value (+EV) bets in real time. Devigged odds from 15+ sportsbooks with Pinnacle as the sharp reference line.",
    breadcrumb: [{ name: "+EV Finder", path: "/ev-finder" }],
  },
  {
    path: "/arbitrage",
    title: "Sports Betting Arbitrage Finder — ChalkPicks",
    description:
      "Lock in guaranteed profit by betting both sides across sportsbooks. Real-time arbitrage scanner across DraftKings, FanDuel, BetMGM, Caesars, and more.",
    breadcrumb: [{ name: "Arbitrage", path: "/arbitrage" }],
  },
  {
    path: "/clv-tracker",
    title: "Closing Line Value (CLV) Tracker — ChalkPicks",
    description:
      "Track your closing line value to measure betting sharpness. CLV is the #1 predictor of long-term profitability in sports betting.",
    breadcrumb: [{ name: "CLV Tracker", path: "/clv-tracker" }],
  },
  {
    path: "/line-movement",
    title: "Line Movement Tracker & Steam Moves — ChalkPicks",
    description:
      "Track real-time line movement, steam moves, and reverse line movement (RLM) across all major sportsbooks. Follow the sharp money.",
    breadcrumb: [{ name: "Line Movement", path: "/line-movement" }],
  },
  {
    path: "/nfl-picks",
    title: "NFL Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NFL picks with AI-powered analysis, spread predictions, moneyline value, and over/under recommendations. Updated daily.",
    breadcrumb: [{ name: "NFL Picks", path: "/nfl-picks" }],
    faqs: [
      {
        q: "What are the best NFL picks today?",
        a: "ChalkPicks uses AI and statistical modeling to identify the best NFL picks daily, focusing on positive expected value (+EV) bets priced against sharp books like Pinnacle.",
      },
    ],
  },
  {
    path: "/nba-picks",
    title: "NBA Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NBA picks with AI-powered analysis, spread predictions, player prop recommendations, and over/under value. Updated daily.",
    breadcrumb: [{ name: "NBA Picks", path: "/nba-picks" }],
  },
  {
    path: "/mlb-picks",
    title: "MLB Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best MLB picks with AI-powered analysis, run line value, moneyline predictions, and over/under recommendations.",
    breadcrumb: [{ name: "MLB Picks", path: "/mlb-picks" }],
  },
  {
    path: "/nhl-picks",
    title: "NHL Picks Today — AI Predictions & Best Bets",
    description:
      "Today's best NHL picks with AI-powered analysis, puck line value, moneyline predictions, and over/under recommendations.",
    breadcrumb: [{ name: "NHL Picks", path: "/nhl-picks" }],
  },
  {
    path: "/ncaaf-picks",
    title: "College Football Picks Today — NCAAF Best Bets",
    description:
      "Today's best NCAAF picks with AI-powered analysis, spread predictions, and over/under value. College football betting made smarter.",
    breadcrumb: [{ name: "NCAAF Picks", path: "/ncaaf-picks" }],
  },
  {
    path: "/ncaab-picks",
    title: "College Basketball Picks Today — NCAAB Best Bets",
    description:
      "Today's best NCAAB picks with AI-powered analysis, spread predictions, and over/under value. College basketball betting made smarter.",
    breadcrumb: [{ name: "NCAAB Picks", path: "/ncaab-picks" }],
  },
  {
    path: "/mma-picks",
    title: "MMA & UFC Picks Today — AI Fight Predictions",
    description:
      "Today's best MMA and UFC picks with AI-powered analysis, moneyline value, and method of victory predictions.",
    breadcrumb: [{ name: "MMA Picks", path: "/mma-picks" }],
  },
  {
    path: "/soccer-picks",
    title: "Soccer Picks Today — EPL, MLS & La Liga Best Bets",
    description:
      "Today's best soccer picks for EPL, MLS, La Liga, and more with AI-powered analysis, moneyline value, and over/under recommendations.",
    breadcrumb: [{ name: "Soccer Picks", path: "/soccer-picks" }],
  },
  {
    path: "/tools/devig-calculator",
    title: "Devig Calculator — Remove Vig & Find Fair Odds",
    description:
      "Free devig calculator to remove bookmaker vig and find true fair odds. Supports proportional, additive, and power devigging methods.",
    breadcrumb: [
      { name: "Tools", path: "/tools" },
      { name: "Devig Calculator", path: "/tools/devig-calculator" },
    ],
    faqs: [
      {
        q: "What is devigging in sports betting?",
        a: "Devigging (removing the vig) is the process of converting bookmaker odds into true probability estimates by removing the bookmaker's built-in margin (juice). This reveals the fair odds for each outcome.",
      },
    ],
  },
  {
    path: "/dfs-optimizer",
    title: "DFS Lineup Optimizer — DraftKings & FanDuel",
    description:
      "Free DFS lineup optimizer for DraftKings and FanDuel. Maximize your projected points within salary cap constraints for NFL, NBA, and MLB.",
    breadcrumb: [{ name: "DFS Optimizer", path: "/dfs-optimizer" }],
  },
  {
    path: "/pricing",
    title: "ChalkPicks Pricing — Pro & Elite Plans",
    description:
      "ChalkPicks Pro at $19.99/month or Elite at $59.99/year. Full AI picks, +EV finder, arbitrage alerts, CLV tracking, and more.",
    breadcrumb: [{ name: "Pricing", path: "/pricing" }],
  },
  {
    path: "/blog",
    title: "Sports Betting Blog — Strategy, Tips & Analysis",
    description:
      "Expert sports betting strategy, tips, and analysis from the ChalkPicks team. Learn about +EV betting, CLV, arbitrage, and bankroll management.",
    breadcrumb: [{ name: "Blog", path: "/blog" }],
  },
  {
    path: "/sharp-money",
    title: "Sharp Money Detector — Real-Time Line Movement",
    description:
      "Detect sharp money moves and public betting divergence in real-time. Track where the smart money is going across all major sportsbooks.",
    breadcrumb: [{ name: "Sharp Money", path: "/sharp-money" }],
  },
  {
    path: "/consensus",
    title: "Consensus Picks — Public vs AI Recommendations",
    description:
      "Compare public betting consensus against ChalkPicks AI recommendations. See where the crowd is wrong and find contrarian value.",
    breadcrumb: [{ name: "Consensus", path: "/consensus" }],
  },
  {
    path: "/api-access",
    title: "ChalkPicks API — EV, CLV & Devig Endpoints",
    description:
      "Access ChalkPicks data programmatically. Get +EV picks, CLV tracking, and devig calculations via our paid REST API.",
    breadcrumb: [{ name: "API Access", path: "/api-access" }],
  },
  {
    path: "/parlay-flow",
    title: "Visual Parlay Builder — Drag & Drop Creator",
    description:
      "Build parlays visually with our drag-and-drop flow builder. See correlations, calculate odds, and optimize your multi-leg bets.",
    breadcrumb: [{ name: "Parlay Flow", path: "/parlay-flow" }],
  },
];

for (const page of CURATED_PAGES) {
  PAGE_META[page.path] = {
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    jsonLd: [
      orgLd(),
      breadcrumbLd([{ name: "Home", path: "/" }, ...page.breadcrumb]),
      ...(page.faqs ? [faqLd(page.faqs)] : []),
    ],
  };
}

// The four /learn/* pages are built from shared/learnPagesMeta.ts instead of
// hand-written per-page literals here — same orgLd()/breadcrumbLd()/faqLd()
// shape for every one of them, so writing it out four times was pure
// copy-paste (and a second, independent place to update their titles/FAQs).
for (const page of LEARN_PAGES_META) {
  PAGE_META[page.path] = {
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    jsonLd: [
      orgLd(),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Learn", path: "/learn" },
        { name: page.breadcrumbName, path: page.path },
      ]),
      faqLd(page.faqs),
    ],
  };
}

// Before this loop, only the ~20 pages hand-curated above (plus /learn/*)
// were visible to non-JS-executing crawlers (GPTBot, ClaudeBot,
// PerplexityBot, ChatGPT-User, Googlebot, ...) — every other route existed
// only in the client-side SPA bundle, invisible to any bot that doesn't run
// JavaScript. shared/routeMeta.ts already carries a real title/description
// for nearly every public route (it's the source client <title>/meta tags
// come from), so reuse it here as a baseline instead of hand-writing dozens
// more near-identical PAGE_META entries: every route with real routeMeta
// but no richer hand-curated entry above gets an org + breadcrumb baseline.
// robots.txt's own "Private/authenticated areas" disallow list — the
// fallback below must not turn account-gated routes into an indexable bot
// shell just because they happen to have a client-side title/description.
const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/payment/",
  "/account-settings",
  "/subscription-management",
];

const routeFallbackEntries = Object.entries(ROUTE_META_MAP)
  .filter(([routePath]) => !PAGE_META[routePath]) // skip routes already hand-curated with richer schema above
  .filter(
    ([routePath]) =>
      !PRIVATE_ROUTE_PREFIXES.some(prefix => routePath.startsWith(prefix))
  )
  .map(([routePath, meta]): [string, PageMeta] => {
    const breadcrumbName = meta.title.split(" | ")[0].split(" — ")[0];
    return [
      routePath,
      {
        title: meta.title,
        description: meta.description,
        canonicalPath: routePath,
        jsonLd: [
          orgLd(),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: breadcrumbName, path: routePath },
          ]),
        ],
      },
    ];
  });
Object.assign(PAGE_META, Object.fromEntries(routeFallbackEntries));

// ─── HTML shell builder ───────────────────────────────────────────────────────

function buildPrerenderedHtml(meta: PageMeta): string {
  // meta.canonicalPath is attacker-controlled for unknown routes (the
  // genericMeta fallback below sets it straight from req.path), so it must
  // be escaped like title/description before landing in an HTML attribute —
  // this was the one interpolation site esc() never covered.
  const canonical = esc(`${BASE_URL}${meta.canonicalPath}`);
  const title = esc(meta.title);
  const description = esc(meta.description);
  // JSON.stringify never escapes "<", so a "</script>" substring inside any
  // string value would otherwise close the tag early and let the rest of the
  // payload be parsed as HTML — escape "<" as "\u003c", matching the same
  // technique client/src/components/seo/schema-jsonld.tsx already uses for
  // the client-rendered equivalent of these same blocks.
  const jsonLdScripts = meta.jsonLd
    .map(
      ld =>
        `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`
    )
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${LOGO_URL}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="robots" content="index, follow" />
  ${jsonLdScripts}
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
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
    if (
      /^\/blog\/[a-z0-9-]+$/i.test(requestPath) ||
      /^\/picks\/\d+$/.test(requestPath)
    ) {
      return next();
    }

    // 1. Try to serve a pre-built static snapshot from dist/public/snapshots/
    const distBase =
      process.env.NODE_ENV === "development"
        ? path.resolve(process.cwd(), "dist", "public")
        : path.resolve(__dirname, "public");

    const snapshotSlug =
      requestPath === "/"
        ? "index"
        : requestPath.replace(/\//g, "_").replace(/^_/, "");
    const snapshotsDir = path.resolve(distBase, "snapshots");
    const snapshotPath = path.resolve(snapshotsDir, `${snapshotSlug}.html`);
    // requestPath is attacker-controlled (req.path); the slug replacement
    // above already strips "/" so path.resolve can't leave snapshotsDir, but
    // verify it explicitly rather than relying on that being the only guard.
    const isWithinSnapshotsDir =
      snapshotPath === snapshotsDir ||
      snapshotPath.startsWith(snapshotsDir + path.sep);

    if (isWithinSnapshotsDir && fs.existsSync(snapshotPath)) {
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
