# Resume steps — progress tracker

Last updated: 2026-07-31

## Step 1 — Trust pass on live site

| Item                                    | Status                                           |
| --------------------------------------- | ------------------------------------------------ |
| No “92%” in `seo-routes` / `routeMeta`  | OK in repo                                       |
| Signup meta no longer pushes free trial | OK (`Plans from $9.99/mo`)                       |
| Soften “guaranteed profit” arb titles   | **Applied this commit**                          |
| Homepage hero / OG “every time”         | Verify on deploy (SPA text may live in Home.tsx) |
| `/performance` real DB only             | Confirm after deploy                             |
| Footer responsible gambling             | Page exists at `/responsible-gambling`           |

**Action for you:** open homepage + signup in browser; if any residual 92% / trial / “every time” remains, screenshot and we kill it in source.

## Step 2 — Prove the moat

| Item                                    | Status                 |
| --------------------------------------- | ---------------------- |
| `afterPickCreated` on generateAI        | Done                   |
| Scheduler ledger lock                   | Done                   |
| `0024_pick_ledger.sql` on production DB | **You run**            |
| Public `/verify/:hash` demo link        | **You after one lock** |
| GSC sitemap-index                       | **You submit**         |

## Step 3 — Distribution (this week)

| Item                            | Status                             |
| ------------------------------- | ---------------------------------- |
| Optimized kit                   | `docs/DIRECTORY_SUBMISSION_KIT.md` |
| Reddit tools-first posts        | **You post**                       |
| TAAFT + AlternativeTo + SaaSHub | **You submit**                     |

## Step 4 — Product Hunt

Wait until Step 1+2 green.

## Step 5 — Indie Hackers

Angle: hash-locked picks before game start.

## Step 6 — Mobile

Capacitor packages already in `package.json` → `pnpm mobile:sync` when ready.
