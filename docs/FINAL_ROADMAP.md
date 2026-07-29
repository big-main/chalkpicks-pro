# ChalkPicks — final optimization roadmap (applied state)

## Done on main
- SEO: prerender, noindex thin picks, sitemap-index, robots, IndexNow batching + codes
- Structured data: ItemList + SportsEvent paths
- Pick Ledger + CLV path + /verify/:hash
- Scheduler: no fabricated picks in production; ledger on publish; closing-line jobs
- Security: prod-start-guard, env hardening, CI typecheck+test, CodeQL
- Mobile: Capacitor config, PWA manifest, AASA + assetlinks stubs, native.ts helpers

## You must run on host
1. `0024_pick_ledger.sql`
2. `node scripts/wire-generateAI-ledger.mjs` (or apply-remaining-wires.mjs)
3. Deploy with JWT_SECRET ≥32 + ODDS_API_KEY + DATABASE_URL
4. GSC sitemap-index + IndexNow
5. Capacitor packages + Xcode/Android Studio for store builds

## Rank #1 levers still open
- Content velocity (sport pages, results, honest CLV posts)
- Backlinks / authority
- Core Web Vitals under real mobile traffic
- Public CLV Skill leaderboard page (trust moat)
- Zero mock stats in public performance (verify DB-only)

## Smoking bullet
Immutable Pick Ledger + public verify hash + CLV skill rating — no competitor has verifiable pre-game lock at scale. Protect it; never rewrite locked rows.
