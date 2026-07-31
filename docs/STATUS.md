# ChalkPicks status (2026-07-31)

## Applied on main

| Area | Status |
|------|--------|
| generateAI → Pick Ledger | **Wired** (`afterPickCreated` in `picks.ts`) |
| Scheduler publish → Ledger | Wired |
| Prod no fabricated picks | Scheduler hard-stop without odds key |
| JWT / DB boot fail-closed | `scripts/prod-start-guard.mjs` on `pnpm start` |
| CI (check + test) | `.github/workflows/ci.yml` |
| SEO sitemap-index / robots / IndexNow | Live |
| Capacitor iOS/Android packages | In `package.json` |
| RevenueCat webhook | Registered in `index.ts` |
| Security: no hardcoded cron secrets | PR #49 |

## Host actions still required

1. **DB:** run `drizzle/0024_pick_ledger.sql` if not already applied
2. **Env:** `JWT_SECRET` (≥32), `DATABASE_URL`, `ODDS_API_KEY`
3. **Deploy** latest `main`
4. **GSC:** sitemap `https://chalkpicks.live/sitemap-index.xml`
5. **Mobile:** `pnpm mobile:sync` then Xcode / Android Studio (replace TEAMID + Play SHA256 in `.well-known/`)

## Smoke after deploy

- `/health`
- `/free-picks`
- Manual generateAI → row in `pick_ledger`
- `/verify/:hash` for a locked free pick
- Scheduler log: no DEV fallback when odds key present
