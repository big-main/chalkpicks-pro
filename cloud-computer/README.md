# ChalkPicks Cloud Computer

Code that runs on the **Manus cloud computer** attached to chalkpicks.live. The
box does two jobs:

1. **Serve the LLM** (Ollama) that the site's backend already routes to for
   cheap/fast completions — `server/_core/llm.ts` calls `OLLAMA_API_URL`
   (this machine, port 11434) first and automatically falls back to hosted
   models when this box is down. The new ChalkPal chat widget and AI-pick
   summaries ride this for **zero marginal token cost**.
2. **Run the daily content factory** (`worker.mjs`) — pulls today's slate from
   the site, drafts a game-preview article per matchup with the local LLM, and
   posts each one back as a blog **draft** (never auto-published). You review
   and publish in the site's Blog Manager. Every published preview is a fresh,
   indexable page — the programmatic-content engine behind the SEO strategy.

## Quick start

```bash
# on the cloud computer
git clone https://github.com/big-main/chalkpicks-prov2 && cd chalkpicks-prov2/cloud-computer
bash setup.sh                 # installs Ollama + models + node + cron
openssl rand -hex 32          # generate the shared secret
nano .env                     # paste it as WORKER_API_TOKEN
```

Then set the **same** `WORKER_API_TOKEN` value in the site's environment (Manus
env settings for chalkpicks.live) and publish. Verify end-to-end:

```bash
set -a && . ./.env && set +a && node worker.mjs
```

You should see `Site worker API reachable` → `Slate loaded` → `DRAFTED ...`.
The cron installed by setup.sh repeats this daily at 13:00 UTC.

## Which LLM? (recommendation)

**Primary: `qwen3:8b` via Ollama.** For a CPU box like this one it is the best
balance of the five things that matter for ChalkPicks:

| Criterion    | Why qwen3:8b |
|--------------|--------------|
| Performance  | Strongest instruction-following and writing quality in the ≤8B open class; handles structured prompts (article outlines, JSON) reliably. |
| Speed        | Q4 quant (Ollama default) generates comfortably on CPU; content drafting is batch work, so tokens/sec matters less than quality-per-token. |
| Efficiency   | ~5 GB RAM at Q4 — fits the box while leaving room for the OS and worker. |
| Tools        | Native tool/function-calling support — ready for future agentic jobs (odds snapshots, steam-move alerts) without changing models. |
| Reliability  | Apache-2.0, actively maintained, first-class in Ollama; and the site's LLM router health-checks this box every 30s and falls back to hosted models automatically, so a crash here never breaks the site. |

**Fallback on-box: `llama3.2:3b`** — ~2 GB, roughly 2× faster; use it
(`OLLAMA_MODEL=llama3.2:3b`) if the box is RAM-constrained or you want faster
runs at slightly lower prose quality.

**Sizing rule:** < 8 GB free RAM → `llama3.2:3b` or `qwen3:4b`; 8–16 GB →
`qwen3:8b` (recommended); 16 GB+ and patient → `qwen3:14b` for the flagship
daily article only.

**What NOT to run here:** the user-facing chat's *fallback* and the flagship
daily picks article should stay on hosted models (the existing
Claude/OpenRouter chain) — user-facing latency and uptime shouldn't depend on
one small box. The architecture already does this: local-first, hosted-fallback.

Note: the box previously ran `qwen2.5:7b` (the site's default `OLLAMA_MODEL`).
`setup.sh` pulls `qwen3:8b`; after verifying it, update the **site's**
`OLLAMA_MODEL` env to `qwen3:8b` too so both sides agree.

## Security model

- All worker endpoints live under `/api/worker/*` on the site and require
  `Authorization: Bearer $WORKER_API_TOKEN` (constant-time compared; requests
  are rejected outright if the site has no token configured).
- The slate endpoint excludes premium fields (`aiAnalysis`, `keyFactors`) so
  generated public articles can never leak paid content.
- Articles land as **drafts** — a human publishes. The LLM system prompt
  forbids invented statistics and profit guarantees and appends the
  responsible-gambling footer.

## Files

- `setup.sh` — one-time provisioning (Ollama, models, Node, cron). Idempotent.
- `worker.mjs` — the content-factory worker. Node 18+, zero npm dependencies.
- `.env` — created by setup.sh; holds the token + config. **Never commit it.**

## Operating notes

- Logs: `worker.log` next to the script (cron appends).
- Change article volume with `MAX_ARTICLES` (default 5/day).
- The worker is idempotent per slug — re-runs dedupe, so a double cron fire or
  manual re-run can't create duplicates.
- If Ollama misbehaves: `sudo systemctl restart ollama`, then
  `curl -s localhost:11434/api/tags` to confirm models are loaded.
