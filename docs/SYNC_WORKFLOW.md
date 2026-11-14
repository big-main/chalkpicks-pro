# ChalkPicks Pro — One Canonical Release Path

## Current production choice

On 2026-11-13 the owner authorized restoring a working `.pro` website after the Manus-hosted `.live` site continued returning a platform billing notice. Keep one source of truth in `/home/ubuntu/chalkpicks-pro`. Do not resume domain switching or deploy separately edited copies.

```text
Manus workspace → tests + production build → Manus checkpoint
                                                ↓
                                         pnpm sync:github
                                                ↓
                                  big-main/chalkpicks-pro main
                                                ↓
                            Git-linked Vercel production deployment
                                                ↓
                                real HTTP/API acceptance tests
```

The Vercel project is `chalkpicks-pro-free` (`prj_Kgysm3zlM1WypzPt02ffgUkiBB86`). Only a READY deployment matching the intended checkpoint and passing the checks below is a successful production release. A healthy Manus preview does not establish healthy public hosting.

## Backend split

`server/_core/app.ts` initializes the existing Express routes without importing Vite, opening a listening port, starting WebSockets, or starting in-process schedulers. `server/_core/vercelHandler.ts` reuses that factory in a warm Vercel Function. The build bundles it to `dist/vercel-api.mjs`; `api/index.js` imports that explicit-extension artifact. This avoids Vercel emitting unresolved extensionless TypeScript imports. `server/_core/index.ts` remains the normal Manus/standalone bootstrap, including frontend serving and persistent-job startup.

The failed previous function deployment imported `_core/index.ts`, which pulled frontend-only Vite/Tailwind native binaries into the API dependency trace. The bundle regression test now forbids that dependency path.

`vercel.json` routes API, health, dynamic blog sitemap and storage requests to the backend, preserves direct React document routes, and leaves missing assets as real 404s. Scheduled mutation handlers fail closed in the Function; do not create duplicate automated posting or payout jobs to compensate. Persistent WebSockets and scheduled workers require their existing dedicated runtime and must be checked separately.

## Required checks after every release

1. Homepage, signup, login, picks, pricing, tools and dashboard documents load directly.
2. `/health` is JSON with `status: ok`, not an HTML 200.
3. Anonymous `/api/trpc/auth.me` returns its real tRPC contract. Protected procedures reject anonymous visitors.
4. A database-backed public query returns real JSON. Verify freshness separately; never fabricate picks to hide upstream failures.
5. Authorized user sessions preserve admin role and paid access. Do not create fake accounts or alter billing as a smoke test.
6. `/assets/does-not-exist.js` is a 404, not HTML.
7. `www.chalkpicks.pro` redirects to the apex while preserving path and query. Canonical tags and sitemap use `.pro`.
8. Local HEAD, fetched GitHub main, and the production deployment commit match.

## GitHub synchronization

Run `pnpm sync:github` after every saved checkpoint. The script refuses dirty state and confirms SHA parity. If GitHub has independent updates, inspect and reconcile them in Manus before saving the next checkpoint. Preserve needed work and recovery history; do not silently force-push divergent changes.

## Domain and credentials

Domain registrations remain untouched. The public `.pro` DNS currently reaches Vercel despite the domains being registered in Manus. Registration and serving destination are separate. Do not move authoritative DNS while recovering the working backend.

Keep database, JWT, payment, email and provider secrets in environment settings, never Git or logs. Preserve the existing member database and sender identities. The `.live` Manus hosting notice is an independent provider issue; code changes or cache-busting cannot clear it. Do not claim the `.live` site, paid checkout, live odds, or scheduled automations are recovered without testing each one.
