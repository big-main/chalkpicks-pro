# ChalkPicks Pro — Canonical Sync and Deployment

## Source of truth

Edit the Manus workspace at `/home/ubuntu/chalkpicks-pro`. Save a tested Manus checkpoint before mirroring it to `big-main/chalkpicks-pro`. The active `.pro` production domains currently serve the Git-linked Vercel project `chalkpicks-pro-free`, not the Manus preview.

A Manus checkpoint alone does not update those Vercel domains. The required path is:

```text
Manus workspace → tests/build → Manus checkpoint → pnpm sync:github
                                                     ↓
                                             GitHub main
                                                     ↓
                                        Vercel production build
                                                     ↓
                                      production acceptance checks
```

Do not deploy separately edited copies or replace the deployment remote with GitHub. If another agent adds GitHub commits, inspect and reconcile them in Manus before checkpointing; do not silently overwrite divergent work.

## Post-checkpoint sync

Run `pnpm sync:github`. The guarded script refuses a dirty working tree, verifies the intended repository, pushes the canonical checkpoint, and verifies the resulting GitHub SHA. Normal updates should fast-forward. Use rewrite mode only after reviewing the divergence and preserving any updates that must be kept. Do not remove branch protection to force a push.

Check local and fetched GitHub SHAs against the Vercel production deployment's `githubCommitSha`. A READY build is not proof of working routes or database connectivity.

## Production routing

`vercel.json` routes API requests, JSON health, API documentation, the dynamic blog sitemap, and storage proxy requests to `api/index.ts`. That adapter initializes the existing Express application without opening a listening port, attaching WebSockets, or starting in-process jobs. Client-side document routes fall back to `index.html`; missing assets and verification files must remain real 404s.

The deployment redirects `www.chalkpicks.pro` to the apex so host-only login cookies stay on one hostname. Legacy `.live` redirects are prepared in Vercel but do not take effect while authoritative DNS sends visitors elsewhere. Verification and registrar DNS updates are required separately.

The `.live` authoritative nameservers checked on 2026-11-13 are `ns1.globaldomaingroup.com` and `ns2.globaldomaingroup.com`. A Cloudflare response header alone does not mean the user's Cloudflare account controls that zone. Preserve mail and verification records during DNS changes.

## Backend configuration

Keep secrets in provider environment settings, never in Git. Preserve the intended database and JWT identity configuration. Vercel needs the app's server-only odds, storage, AI, and payment credentials for the features that use them.

Scheduled mutation handlers fail closed in the Function; they require a dedicated worker. This adapter restores HTTP APIs, not persistent background jobs or WebSockets. Verify live odds streaming separately, including provider quotas and runtime timeout behavior. Never use the ephemeral Manus preview as a permanent production API origin.

## Acceptance checks

After each deployment:

1. Direct visits and refreshes work on login, signup, picks, pricing, tools, dashboard, and document routes.
2. `/health` responds with JSON containing `status: ok`, not SPA HTML.
3. Anonymous `/api/trpc/auth.me` returns the tRPC JSON contract; protected procedures deny anonymous users.
4. Database-backed public stats and picks queries return valid JSON. Verify real data freshness independently of HTTP success.
5. JS/CSS assets retain their MIME types; nonexistent assets return 404.
6. Authentication cookies remain HttpOnly and use HTTPS. Test account login with authorized credentials without creating fake users or modifying billing.
7. Canonical and legacy redirects preserve path and query, with no loops.
8. Local, GitHub, and the live Vercel deployment resolve to the intended SHA.

Record limitations honestly. A functioning homepage does not establish healthy subscriptions, live data, automations, or the legacy domain redirect.
