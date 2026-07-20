/**
 * Build-time static HTML snapshot generator for bot pre-rendering.
 *
 * Takes the built dist/public/index.html as a template and produces
 * per-route HTML snapshots with:
 *  - route-specific <title>, meta description, canonical, and OG/Twitter tags
 *  - real, crawlable body content (headings, copy, internal links)
 *    injected into #root so bots see actual content instead of an
 *    empty SPA shell
 *
 * Output: dist/public/snapshots/{route}.html
 * Served by server/prerender.ts to known crawler user agents.
 *
 * Usage: node scripts/generate-snapshots.mjs   (run after `vite build`)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_PUBLIC = path.join(ROOT, "dist", "public");
const SNAPSHOT_DIR = path.join(DIST_PUBLIC, "snapshots");
const SITE_URL = "https://chalkpicks.live";

// ---------------------------------------------------------------------------
// Load shared route metadata + blog content (via esbuild-friendly dynamic import
// of the TypeScript sources using a tiny transpile step through tsx-less regex
// is fragile, so we import the compiled data by evaluating with node's
// experimental strip types is unavailable on node 20 — instead we re-read the
// TS files and extract the exported arrays with a JSON-safe eval shim).
// Simpler + robust: use esbuild (already a dependency) to bundle on the fly.
// ---------------------------------------------------------------------------
import { build } from "esbuild";

async function loadTsModule(entry) {
  const outfile = path.join(ROOT, "dist", `.snapshot-tmp-${path.basename(entry).replace(/\W/g, "_")}.mjs`);
  await build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const mod = await import(`file://${outfile}?t=${Date.now()}`);
  fs.unlinkSync(outfile);
  return mod;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal markdown -> HTML converter (headings, bold, italic, links, lists, paragraphs) */
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let inList = false;
  let listType = "ul";

  const inline = (t) =>
    esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, (_m, txt, href) => `<a href="${href}">${txt}</a>`);

  const closeList = () => {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== "ol") {
        closeList();
        out.push("<ol>");
        inList = true;
        listType = "ol";
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else if (line.startsWith("* ") || line.startsWith("- ")) {
      if (!inList || listType !== "ul") {
        closeList();
        out.push("<ul>");
        inList = true;
        listType = "ul";
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

function applyHeadMeta(template, { title, description, canonicalUrl }) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(description)}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${esc(description)}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/>/,
    `<meta name="twitter:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${esc(description)}" />`
  );
  return html;
}

function injectBody(template, bodyHtml) {
  return template.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${bodyHtml}</div>`
  );
}

function snapshotFileFor(urlPath) {
  const normalized = urlPath.replace(/\/+$/, "").replace(/^\//, "") || "index";
  return normalized.replace(/\//g, "__") + ".html";
}

const NAV_HTML = `
<header>
  <nav>
    <a href="/">ChalkPicks — AI Sports Betting Analytics</a>
    <a href="/picks">AI Picks</a>
    <a href="/daily-picks">Daily Picks Archive</a>
    <a href="/nfl-picks">NFL Picks</a>
    <a href="/nba-picks">NBA Picks</a>
    <a href="/mlb-picks">MLB Picks</a>
    <a href="/nhl-picks">NHL Picks</a>
    <a href="/ev-finder">+EV Finder</a>
    <a href="/arbitrage">Arbitrage Finder</a>
    <a href="/prop-builder">Prop Builder</a>
    <a href="/tools">Tools</a>
    <a href="/blog">Blog</a>
    <a href="/pricing">Pricing</a>
    <a href="/signup">Sign Up</a>
  </nav>
</header>`;

const FOOTER_HTML = `
<footer>
  <p>ChalkPicks — AI-powered sports betting picks and analytics for NFL, NBA, MLB, and NHL. <a href="/pricing">View plans</a> or <a href="/signup">create a free account</a>.</p>
</footer>`;

/** Static crawlable body copy for key routes */
function routeBody(entry) {
  return `
${NAV_HTML}
<main>
  <h1>${esc(entry.h1 ?? entry.title.split("|")[0].trim())}</h1>
  <p>${esc(entry.description)}</p>
  ${entry.body ?? ""}
</main>
${FOOTER_HTML}`;
}

const ROUTE_BODIES = {
  "/": `
<h2>AI-Powered Sports Betting Analytics</h2>
<p>ChalkPicks combines machine learning pick generation with professional betting tools: a real-time <a href="/ev-finder">+EV finder</a>, an <a href="/arbitrage">arbitrage scanner</a>, a <a href="/prop-builder">player prop builder</a>, steam move detection via the <a href="/line-movement">line movement tracker</a>, a <a href="/clv-tracker">CLV tracker</a>, and a <a href="/bankroll-tracker">bankroll tracker</a>.</p>
<h2>Daily AI Picks with Confidence Scores</h2>
<p>Every morning our neural network analyzes thousands of data points — player stats, matchup history, weather, injuries, and market movement — to generate <a href="/picks">daily picks</a> for NFL, NBA, MLB, and NHL with transparent confidence scores and edge ratings. Browse the full <a href="/daily-picks">daily picks archive</a> or jump to <a href="/nfl-picks">NFL picks</a>, <a href="/nba-picks">NBA picks</a>, <a href="/mlb-picks">MLB picks</a>, and <a href="/nhl-picks">NHL picks</a>.</p>
<h2>Learn Profitable Betting Strategy</h2>
<p>New to advantage betting? Read our guides on <a href="/blog/what-is-plus-ev-betting">+EV betting</a>, <a href="/blog/how-to-find-arbitrage-bets">arbitrage betting</a>, <a href="/blog/sports-betting-bankroll-management">bankroll management</a>, and <a href="/blog/best-ai-sports-betting-tools-2026">the best AI betting tools of 2026</a> on the <a href="/blog">ChalkPicks blog</a>.</p>
<p><a href="/signup">Create a free account</a> or see <a href="/pricing">pricing</a>.</p>`,
  "/picks": `
<h2>Today's AI-Generated Picks</h2>
<p>ChalkPicks publishes daily AI picks for NFL, NBA, MLB, and NHL. Each pick includes a confidence score, edge rating, recommended bet type (spread, moneyline, total, or player prop), and a detailed AI analysis of the key factors behind the play.</p>
<h2>How the AI Pick Engine Works</h2>
<p>Our neural network processes thousands of data points per game: team and player statistics, matchup history, injuries, travel and rest, weather, and real-time betting market signals. Picks are ranked by expected value edge so you always see the strongest plays first.</p>
<p>Browse past performance in the <a href="/daily-picks">daily picks archive</a>, or filter by sport: <a href="/nfl-picks">NFL</a>, <a href="/nba-picks">NBA</a>, <a href="/mlb-picks">MLB</a>, <a href="/nhl-picks">NHL</a>. Premium members unlock full analysis for every pick — see <a href="/pricing">pricing</a>.</p>`,
  "/ev-finder": `
<h2>Find Positive Expected Value Bets in Real Time</h2>
<p>The ChalkPicks +EV Finder scans live odds across 10+ sportsbooks and compares them against sharp market consensus to surface bets where the math is in your favor. Each opportunity shows the fair price, the offered price, and the expected value percentage.</p>
<h2>Why +EV Betting Works</h2>
<p>Betting only when your win probability exceeds the implied probability of the odds is the foundation of professional sports betting. Learn the full methodology in our guide: <a href="/blog/what-is-plus-ev-betting">What is +EV Betting and How to Find +EV Bets</a>.</p>
<p>Pair the EV finder with the <a href="/clv-tracker">CLV tracker</a> to verify you are beating the closing line, and manage risk with the <a href="/bankroll-tracker">bankroll tracker</a>. <a href="/signup">Start free</a>.</p>`,
  "/arbitrage": `
<h2>Risk-Free Arbitrage Opportunities, Detected Instantly</h2>
<p>The ChalkPicks Arbitrage Finder monitors odds across dozens of sportsbooks and alerts you the moment the combined implied probability of all outcomes drops below 100% — a guaranteed-profit arbitrage. The tool calculates the exact stake for each side so your profit is locked in regardless of the result.</p>
<h2>How Arbitrage Betting Works</h2>
<p>When sportsbooks disagree on a line, betting both sides at the right proportions guarantees profit. Margins typically run 1-3% per arb, and speed is everything. Read the full walkthrough: <a href="/blog/how-to-find-arbitrage-bets">How to Find Arbitrage Bets in Sports Betting</a>.</p>
<p><a href="/pricing">Upgrade to premium</a> for real-time arbitrage alerts.</p>`,
  "/pricing": `
<h2>Simple, Transparent Pricing</h2>
<p>Start free with daily featured picks and limited tool access. Upgrade to Premium from $9.99/month for the full AI pick slate, the real-time <a href="/ev-finder">+EV finder</a>, <a href="/arbitrage">arbitrage alerts</a>, the <a href="/prop-builder">prop builder</a>, <a href="/line-movement">line movement tracking</a>, and advanced analytics.</p>
<h2>What Members Get</h2>
<ul>
<li>Daily AI picks with confidence scores and edge ratings for NFL, NBA, MLB, and NHL</li>
<li>Real-time +EV finder scanning 10+ sportsbooks</li>
<li>Arbitrage finder with exact stake calculations</li>
<li>Player prop builder and same-game parlay correlation finder</li>
<li>CLV tracker and bankroll management tools</li>
</ul>
<p><a href="/signup">Create your free account</a> to get started.</p>`,
  "/tools": `
<h2>The Complete Sports Betting Toolkit</h2>
<p>ChalkPicks Power Tools give you everything a professional bettor needs: a <a href="/ev-finder">+EV finder</a>, an <a href="/arbitrage">arbitrage scanner</a>, a <a href="/prop-builder">player prop builder</a>, a <a href="/parlay-builder">parlay builder</a>, a <a href="/line-movement">line movement / steam move tracker</a>, a <a href="/correlation-finder">SGP correlation finder</a>, a <a href="/clv-tracker">CLV tracker</a>, a <a href="/bankroll-tracker">bankroll tracker</a>, and a <a href="/backtesting">strategy backtesting engine</a>.</p>
<p>Learn how to use them profitably on the <a href="/blog">ChalkPicks blog</a>, then <a href="/signup">start free</a>.</p>`,
  "/prop-builder": `
<h2>AI-Powered Player Prop Analysis</h2>
<p>The ChalkPicks Prop Builder analyzes player props with machine learning: historical hit rates, matchup-specific performance, usage trends, and line value. Get over/under recommendations with confidence scores for NFL, NBA, MLB, and NHL props.</p>
<p>Combine props intelligently with the <a href="/correlation-finder">correlation finder</a> for same-game parlays, and verify edges with the <a href="/ev-finder">+EV finder</a>. <a href="/pricing">See plans</a>.</p>`,
  "/daily-picks": `
<h2>Every AI Pick, Every Day, Fully Transparent</h2>
<p>The Daily Picks Archive shows ChalkPicks AI selections by date, including final results — wins, losses, and pushes — with confidence scores and closing odds. Full transparency is the foundation of trust in any picks service.</p>
<p>Filter by sport: <a href="/nfl-picks">NFL picks</a>, <a href="/nba-picks">NBA picks</a>, <a href="/mlb-picks">MLB picks</a>, <a href="/nhl-picks">NHL picks</a>. Get today's slate on the <a href="/picks">picks page</a>.</p>`,
  "/nfl-picks": `
<h2>NFL AI Picks — Spreads, Totals, Moneylines & Props</h2>
<p>ChalkPicks generates NFL picks with a neural network trained on years of play-by-play data, DVOA-style efficiency metrics, injuries, weather, and betting market movement. Every pick ships with a confidence score, edge rating, and written analysis.</p>
<h2>What We Cover</h2>
<p>Point spreads, totals (over/unders), moneylines, and player props for every regular season and playoff game — plus <a href="/prop-builder">prop analysis</a> and <a href="/ev-finder">+EV opportunities</a> on NFL markets. See all sports in the <a href="/daily-picks">daily archive</a>, or <a href="/signup">sign up free</a>.</p>`,
  "/nba-picks": `
<h2>NBA AI Picks — Spreads, Totals & Player Props</h2>
<p>NBA betting markets move fast. ChalkPicks' AI models rest/travel schedules, pace, matchup-specific efficiency, and injury news to generate daily NBA picks with confidence scores. Player props are a specialty — our models track usage rates, defensive matchups, and historical hit rates.</p>
<p>Build NBA props with the <a href="/prop-builder">prop builder</a>, find value with the <a href="/ev-finder">+EV finder</a>, and browse results in the <a href="/daily-picks">archive</a>. <a href="/signup">Start free</a>.</p>`,
  "/mlb-picks": `
<h2>MLB AI Picks — Moneylines, Run Lines & Totals</h2>
<p>Baseball is the modeler's sport. ChalkPicks' MLB engine weighs starting pitcher form, bullpen fatigue, park factors, weather, platoon splits, and umpire tendencies to produce daily moneyline, run line, and totals picks with transparent confidence scores.</p>
<p>Long MLB slates create frequent <a href="/ev-finder">+EV opportunities</a> and <a href="/arbitrage">arbitrage windows</a>. Browse past results in the <a href="/daily-picks">daily archive</a> or <a href="/signup">create a free account</a>.</p>`,
  "/nhl-picks": `
<h2>NHL AI Picks — Puck Lines, Totals & Moneylines</h2>
<p>ChalkPicks' NHL model analyzes goaltender form, expected goals (xG) metrics, special teams efficiency, back-to-back scheduling, and line movement to generate daily NHL picks with confidence scores and edge ratings.</p>
<p>Hockey's volatility makes disciplined <a href="/blog/sports-betting-bankroll-management">bankroll management</a> essential — track it with the <a href="/bankroll-tracker">bankroll tracker</a>. See all picks in the <a href="/daily-picks">archive</a> or <a href="/signup">start free</a>.</p>`,
  "/blog": "", // filled dynamically with post list
};

async function main() {
  const templatePath = path.join(DIST_PUBLIC, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("dist/public/index.html not found. Run `vite build` first.");
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, "utf-8");
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const { routeSEO } = await loadTsModule("shared/seo-routes.ts");
  const { blogPosts } = await loadTsModule("client/src/data/blog-posts.ts");

  // Blog index body
  ROUTE_BODIES["/blog"] = `
<h2>Latest Articles</h2>
<ul>
${blogPosts
  .map(
    (p) =>
      `<li><a href="/blog/${p.slug}">${esc(p.title)}</a> — ${esc(p.description)}</li>`
  )
  .join("\n")}
</ul>
<p>Put the strategies into action with <a href="/picks">AI picks</a>, the <a href="/ev-finder">+EV finder</a>, and the <a href="/arbitrage">arbitrage scanner</a>. <a href="/signup">Sign up free</a>.</p>`;

  // Routes to prerender (SEO-critical set)
  const prerenderPaths = [
    "/",
    "/picks",
    "/ev-finder",
    "/pricing",
    "/tools",
    "/arbitrage",
    "/prop-builder",
    "/daily-picks",
    "/nfl-picks",
    "/nba-picks",
    "/mlb-picks",
    "/nhl-picks",
    "/blog",
  ];

  let count = 0;

  for (const p of prerenderPaths) {
    const entry = routeSEO.find((r) => r.path === p);
    if (!entry) {
      console.warn(`No SEO entry for ${p}, skipping`);
      continue;
    }
    const canonicalUrl = p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`;
    let html = applyHeadMeta(template, {
      title: entry.title,
      description: entry.description,
      canonicalUrl,
    });
    html = injectBody(
      html,
      routeBody({ ...entry, body: ROUTE_BODIES[p] ?? "" })
    );
    fs.writeFileSync(path.join(SNAPSHOT_DIR, snapshotFileFor(p)), html);
    count++;
  }

  // Blog posts
  for (const post of blogPosts) {
    const p = `/blog/${post.slug}`;
    const canonicalUrl = `${SITE_URL}${p}`;
    const title = `${post.title} | ChalkPicks Blog`;
    let html = applyHeadMeta(template, {
      title,
      description: post.description,
      canonicalUrl,
    });
    const articleSchema = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { "@type": "Organization", name: "ChalkPicks" },
      publisher: { "@type": "Organization", name: "ChalkPicks", url: SITE_URL },
      mainEntityOfPage: canonicalUrl,
    })}</script>`;
    html = html.replace("</head>", `${articleSchema}\n</head>`);
    const body = `
${NAV_HTML}
<main>
  <article>
    ${mdToHtml(post.content)}
  </article>
  <p><a href="/blog">More articles</a> · <a href="/signup">Start free with ChalkPicks</a></p>
</main>
${FOOTER_HTML}`;
    html = injectBody(html, body);
    fs.writeFileSync(path.join(SNAPSHOT_DIR, snapshotFileFor(p)), html);
    count++;
  }

  console.log(`Generated ${count} HTML snapshots in ${SNAPSHOT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
