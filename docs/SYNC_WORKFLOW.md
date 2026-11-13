# ChalkPicks Pro — Manus Hosting and Canonical Sync

## Current direction

The owner selected `https://chalkpicks.live` as the sole intended public website on 2026-11-13. Manus hosts the full Express/React application; GitHub is a code mirror. The `.pro` website is retired. Do not resume Vercel deployment work, redirect `.live` to `.pro`, cancel domain registration, or deploy a separately edited copy.

## One source, one pathway

```text
Manus workspace → tests and build → Manus checkpoint → Manus publish
                                         ↓
                                  pnpm sync:github
                                         ↓
                              big-main/chalkpicks-pro
```

All edits originate in `/home/ubuntu/chalkpicks-pro`. After every checkpoint run `pnpm sync:github`. The script verifies the repository, refuses a dirty working tree, and confirms matching local and GitHub SHAs. If GitHub contains independent updates, inspect and reconcile them in Manus before checkpointing; do not silently discard work. Do not remove branch protection or rewrite divergent history without reviewing and preserving needed commits.

## Hosting and domain state

The source now uses `.live` in website URLs, canonicals, sitemaps, API documentation, notification links, and social links. `www.chalkpicks.live` normalizes to the apex with a method-preserving 308. The apex must never redirect to itself or to `.pro`.

The existing Vercel project was paused on 2026-11-13, and external checks confirmed that both `.pro` hosts return `DEPLOYMENT_PAUSED`. It was not deleted, and neither domain registration was surrendered. Vercel builds are disabled by the repository's `git.deploymentEnabled: false` guard. Remove remaining Vercel domain attachments through project settings when available; pausing alone does not remove authoritative DNS records.

The `.live` nameservers checked on 2026-11-13 are `ns1.globaldomaingroup.com` and `ns2.globaldomaingroup.com`. Its public response, along with the stable Manus hosts, still showed `Site Unavailable` before publishing this source update. A Cloudflare response header does not establish that the user's Cloudflare account controls the DNS zone.

The browser's Manus workspace showed a restore-data notice and no listed websites. Confirm the correct owning account and complete any required restoration before claiming production is live. If restoration is required, confirm all correct backup packages first: the account restoration workflow is one-time and an older snapshot can omit later database activity. Do not overwrite current member or billing data with an unreviewed backup.

## Release acceptance

A saved checkpoint or healthy sandbox preview alone is not proof of healthy Manus production. Verify the stable hosting domain and `.live` independently after publishing and reconnecting the domain under Settings → Domains.

Required checks:

- `/health` returns JSON with `status: ok`, not maintenance or SPA HTML.
- Direct page visits and refreshes work on signup, login, picks, pricing, tools, and dashboard.
- Anonymous tRPC auth returns its JSON contract; protected routes deny anonymous access.
- Database-backed queries return valid, real results; no fabricated fallback picks.
- Login, admin permissions, and premium access work for the authorized owner account.
- Sitemap and canonical tags use `.live`; www redirects preserve path and query.
- Streaming and automation status are verified separately, without creating duplicate posting jobs.
- GitHub matches the intended Manus checkpoint.

Preserve configured email senders and payment credentials. URL migration does not verify email-domain deliverability or change Stripe billing records. Treat those integrations as separate checks.
