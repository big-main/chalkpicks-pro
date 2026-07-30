# Changelog

All notable changes to ChalkPicks Pro are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `/learn/expected-value-betting` evergreen guide, rounding out the `/learn` fundamentals set (CLV, no-vig odds, Kelly Criterion, line movement) with an explainer on +EV betting, wired into sitemap/FAQ schema/route meta via the shared `learnPagesMeta.ts` pattern.

### Planned

- Mobile app (Expo) companion
- Google Search Console verification + sitemap submission

---

## [2.6.0] - 2026-07-29

### Added

- **Grok-4 Strategy Builder** — `strategy.analyze` tRPC mutation routes to xAI API for deep strategy analysis
- **ESLint 9 flat config** with typescript-eslint, react-hooks, jsx-a11y (0 errors)
- **Husky + lint-staged** pre-commit hook (auto-lint + format on commit)
- **Authority pages** — `/methodology` (ensemble models, CLV, Monte Carlo) and `/how-it-works` (4-step flow)
- **Security headers** — Permissions-Policy, Referrer-Policy, X-Content-Type-Options
- **CI/CD hardening** — Lighthouse CI step, broken-link checker (manual trigger)
- **n8n webhook secrets** — N8N_WEBHOOK_SECRET, N8N_PICKS_WEBHOOK_URL, N8N_DRIP_WEBHOOK_URL
- **Pick Ledger table** — `pick_ledger` for CLV tracking
- **Branch protection** — main requires 1 PR review, force-push blocked

### Changed

- LLM routing: `complexity: 'high'` routes to Grok-4 when XAI_API_KEY is set
- 122 `console.log` converted to `console.warn` (server) or removed (client)
- 16 `eqeqeq` violations fixed (== to ===)
- robots.txt cleaned and deduplicated
- README.md rewritten with architecture diagram and badges
- All 4 stale branches deleted from GitHub

### Fixed

- TypeScript error in closingLineJob.ts (undefined check on outcome)
- Husky prepare script graceful fallback in CI/production

---

## [2.5.0] - 2026-07-29

### Added

- GitLab Kubernetes Agent (`chalk`) deployed on Cloud Computer (35.237.81.82)
- Observability pipeline: traces, metrics, logs via `GITLAB_OBSERVABILITY_EXPORT`
- Socket security patch for CVE-2026-25896 (fast-xml-parser entity encoding bypass)
- `postinstall` script runs `socket-patch apply` automatically on every install

### Changed

- GitHub repo updated with Socket patch manifest and `pnpm.patchedDependencies`

---

## [2.4.0] - 2026-07-28

### Added

- Non-render-blocking Google Fonts (preload + media=print onload swap)
- Preconnect hints for CloudFront CDN in `index.html`
- `LazyRechartsChart` component — Recharts lazy-loaded below the fold
- HeroBackground hidden on mobile to reduce TBT

### Fixed

- **Soft 404**: `/picks/:id` for non-existent picks now returns HTTP 404 (was 200)
- **Sitemap bloat**: pruned from 564 → 77 URLs (removed 487 paywall-gated pick pages)
- **CLS (0.229 → ~0.05)**: PageTransition animation changed to opacity-only (no y-axis shift)
- **LCP**: Hero image converted from 2.8 MB PNG to 65 KB WebP with `fetchpriority=high`
- All individual pick pages now serve `noindex, follow` to prevent thin content indexing
- HorizontalScrollTicker capped at 15 items (was 37+) to reduce DOM node count

### Security

- Accessibility fixes: `aria-label` on Navbar buttons, email input, mobile menu toggle
- Contrast improvements: `text-white/25` → `text-white/45+` across footer and disclaimer text

---

## [2.3.0] - 2026-07-15

### Added

- n8n 3-step email drip workflow (Day 1 welcome, Day 3 missed picks, Day 5 EXIT15 offer)
- Railway deployment status widget (`RailwayStatusWidget`)
- Railway webhook handler for deployment notifications

### Changed

- Stripe production webhook configured at `/api/stripe/webhook`
- Auto-publish enabled: every checkpoint deploys to production immediately

---

## [2.2.0] - 2026-06-28

### Added

- Stripe subscription tiers: Free, Pro ($19.99/mo), Elite ($49.99/mo), Annual ($399/yr)
- Subscription-gated premium tools (EV Finder, Parlay Builder, Advanced Analytics)
- Leaderboard with gamification and tier badges
- Backtesting engine with historical pick performance
- AI confidence scores powered by Claude/OpenAI

### Fixed

- SQL error exposure in production API responses
- Site health fixes across multiple pages

---

## [2.1.0] - 2026-05-10

### Added

- Real-time player stats integration (The Odds API)
- Daily pick automation pipeline
- NFL, NBA, MLB, NHL sport coverage
- Manus OAuth authentication

### Changed

- Migrated from Railway to Manus Cloud Computer deployment (PM2)

---

## [2.0.0] - 2026-04-07

### Added

- Initial full-stack scaffold: React 19 + Tailwind 4 + Express 4 + tRPC 11
- TiDB/MySQL database with Drizzle ORM
- Manus OAuth integration
- ChalkPicks Pro landing page with hero section
- Picks listing and detail pages
- Pricing page with subscription tiers

---

[Unreleased]: https://github.com/big-main/chalkpicks-pro/compare/main...HEAD
[2.6.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/big-main/chalkpicks-pro/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/big-main/chalkpicks-pro/releases/tag/v2.0.0
