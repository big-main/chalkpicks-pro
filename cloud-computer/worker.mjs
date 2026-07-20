#!/usr/bin/env node
/**
 * ChalkPicks Cloud-Computer Worker — the daily content factory.
 *
 * Runs on the Manus cloud computer next to Ollama. Each run it:
 *   1. pulls today's slate (active picks) from chalkpicks.live's worker API,
 *   2. drafts a game-preview article per matchup with the LOCAL LLM
 *      (zero marginal cost), and
 *   3. posts each article back to the site as a blog DRAFT for review —
 *      nothing auto-publishes.
 *
 * Zero npm dependencies (Node 18+: global fetch). Configure via env:
 *   CHALKPICKS_URL     site origin            (default https://chalkpicks.live)
 *   WORKER_API_TOKEN   shared secret          (REQUIRED — same value as the site)
 *   OLLAMA_URL         Ollama base URL        (default http://127.0.0.1:11434)
 *   OLLAMA_MODEL       model tag              (default qwen3:8b)
 *   MAX_ARTICLES       previews per run       (default 5)
 *
 * Run once (cron does the scheduling — see README):
 *   WORKER_API_TOKEN=... node worker.mjs
 */

const SITE = (process.env.CHALKPICKS_URL ?? "https://chalkpicks.live").replace(/\/$/, "");
const TOKEN = process.env.WORKER_API_TOKEN;
const OLLAMA = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const MAX_ARTICLES = parseInt(process.env.MAX_ARTICLES ?? "5", 10);

if (!TOKEN) {
  console.error("FATAL: WORKER_API_TOKEN is not set.");
  process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), "—", ...args);

async function site(path, options = {}) {
  const res = await fetch(`${SITE}/api/worker${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

async function generate(prompt, { maxTokens = 1200 } = {}) {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { num_predict: maxTokens, temperature: 0.7 },
      messages: [
        {
          role: "system",
          content:
            "You are a sports betting analytics writer for ChalkPicks (chalkpicks.live). " +
            "Write clear, factual, engaging preview articles in Markdown. " +
            "NEVER promise profit or present a bet as a sure thing; frame everything as analysis. " +
            "Do not fabricate statistics, records, or injuries — write from the matchup facts given. " +
            "End every article with: '*Analytics & education — not betting advice. 21+ | 1-800-GAMBLER*'",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.message?.content ?? "";
  // Strip <think>...</think> blocks that reasoning models (qwen3) may emit.
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

const slugify = s =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 180);

function formatOdds(n) {
  if (n === null || n === undefined) return null;
  return n > 0 ? `+${n}` : `${n}`;
}

/** Render the line-movement facts block, or "" if we have no snapshot data for this game. */
function lineMovementBlock(pick) {
  const m = pick.lineMovement;
  if (!m) return "";
  const lines = [];
  if (m.openOdds != null && m.currentOdds != null && m.openOdds !== m.currentOdds) {
    lines.push(`- Moneyline moved from ${formatOdds(m.openOdds)} to ${formatOdds(m.currentOdds)}.`);
  }
  if (m.openTotal != null && m.currentTotal != null && m.openTotal !== m.currentTotal) {
    lines.push(`- Total moved from ${m.openTotal} to ${m.currentTotal}.`);
  }
  if (lines.length === 0) return "";
  return [
    ``,
    `LINE MOVEMENT (ChalkPicks first-party snapshots — cite these exact numbers, never invent your own):`,
    ...lines,
  ].join("\n");
}

function previewPrompt(pick, date) {
  const matchup = `${pick.awayTeam} @ ${pick.homeTeam}`;
  const sport = (pick.sportKey ?? "").toUpperCase();
  const oddsStr = pick.odds ? (pick.odds > 0 ? `+${pick.odds}` : `${pick.odds}`) : "n/a";
  return [
    `Write a 400-600 word game preview article for ${matchup} (${sport}) on ${date}.`,
    ``,
    `Facts you may use (do not invent others):`,
    `- ChalkPicks' AI pick for this game: ${pick.recommendation} (market: ${pick.pickType}, odds ${oddsStr}, model confidence ${pick.confidenceScore}%).`,
    lineMovementBlock(pick),
    ``,
    `Structure:`,
    `- H1 title: catchy but factual, mentioning both teams.`,
    `- A 2-sentence opening that states the matchup and date.`,
    `- H2 "The Matchup" — what makes this game interesting, written generally (no invented stats).`,
    `- H2 "ChalkPicks' AI Read" — explain the pick above, what ${pick.confidenceScore}% confidence means, and that the full analysis is on chalkpicks.live/picks.`,
    `- H2 "How to Think About the Number" — briefly explain the ${pick.pickType} market and reading odds of ${oddsStr}.`,
    pick.lineMovement && lineMovementBlock(pick)
      ? `- Weave the LINE MOVEMENT numbers above into "ChalkPicks' AI Read" or its own short paragraph — cite the exact open->current numbers given, nothing else.`
      : ``,
    `- One-line call to action to see today's full board at chalkpicks.live/picks.`,
    `- Link (Markdown) to at least one of: chalkpicks.live/clv-tracker, chalkpicks.live/line-movement, chalkpicks.live/bet-calculator, wherever it's genuinely relevant to the surrounding sentence.`,
    `- H2 "FAQ" as the LAST section, before the closing disclaimer line. It must contain`,
    `  EXACTLY 3 question/answer pairs, each formatted on its own lines as:`,
    `  **Q:** <question>`,
    `  **A:** <answer>`,
    `  Questions must be phrased the way someone would actually type them into a search`,
    `  engine or ask ChatGPT (e.g. "Who is favored in ${pick.awayTeam} vs ${pick.homeTeam}?",`,
    `  "What is the ${pick.pickType} for ${matchup}?"). Answer only from the facts given above —`,
    `  never invent a stat, injury, or record you don't have.`,
  ].join("\n");
}

async function main() {
  log(`ChalkPicks worker starting (model=${MODEL}, site=${SITE})`);

  // 1. Auth + liveness
  await site("/health");
  log("Site worker API reachable.");

  // 2. Today's slate
  const { date, picks } = await site("/slate");
  if (!picks?.length) {
    log("No active picks for today — nothing to write.");
    return;
  }
  log(`Slate loaded: ${picks.length} picks for ${date}.`);

  // 3. Draft an article per matchup (bounded)
  const targets = picks
    .filter(p => p.homeTeam && p.awayTeam)
    .slice(0, MAX_ARTICLES);

  let created = 0;
  for (const pick of targets) {
    const matchup = `${pick.awayTeam} @ ${pick.homeTeam}`;
    const slug = slugify(`${date}-${pick.sportKey}-${pick.awayTeam}-at-${pick.homeTeam}-preview`);
    try {
      const t0 = Date.now();
      const article = await generate(previewPrompt(pick, date));
      if (article.length < 400) {
        log(`SKIP ${matchup}: generation too short (${article.length} chars).`);
        continue;
      }
      const titleLine = article.match(/^#\s+(.+)$/m)?.[1]?.trim();
      const title = titleLine ?? `${matchup} Preview — ${date}`;
      const body = titleLine ? article.replace(/^#\s+.+$/m, "").trim() : article;

      const result = await site("/blog-draft", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          content: body,
          excerpt: body.replace(/[#*_>\-]/g, "").slice(0, 200),
          seoDescription: `${matchup} preview with ChalkPicks' AI read, odds context and matchup notes.`.slice(0, 160),
          tags: `${pick.sportKey},game-preview,ai-generated`,
        }),
      });
      created += result.deduped ? 0 : 1;
      log(
        `${result.deduped ? "DEDUPED" : "DRAFTED"} ${matchup} (${Math.round((Date.now() - t0) / 1000)}s) -> ${slug}`
      );
    } catch (err) {
      log(`ERROR ${matchup}: ${err.message}`);
    }
  }

  log(`Done. ${created} new draft(s) created — review & publish in the site's Blog Manager.`);
}

main().catch(err => {
  log("FATAL:", err.message);
  process.exit(1);
});
