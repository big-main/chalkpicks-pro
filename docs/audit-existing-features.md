# Audit: What Already Exists vs What Needs Building

## Already Exists (DO NOT REBUILD)
- SEO system: shared/seo-routes.ts with per-route titles/descriptions
- Prerender middleware: server/prerender.ts (serves HTML snapshots to bots)
- Sitemap generation: scripts/generate-sitemap.mjs (29 URLs)
- Sport-specific pick pages: /nfl-picks, /nba-picks, /mlb-picks, /nhl-picks, /ncaaf-picks, /ncaab-picks, /mma-picks, /soccer-picks
- Daily picks archive: /daily-picks (PicksLanding.tsx)
- Blog system: /blog, /blog/:slug with AI-generated content pipeline
- Calculator tools: /tools/odds-calculator, /tools/roi-calculator, /tools/parlay-calculator, /tools/devig-calculator, /tools/bankroll-manager
- Bet Calculator: /bet-calculator
- Performance/Stats: /stats, /performance
- Leaderboard: /leaderboard, /live-leaderboard
- EV Finder: /ev-finder
- Arbitrage: /arbitrage, /arbitrage-opportunities
- Sharp Money: /sharp-money
- CLV Tracker: /clv-tracker
- Elo Ratings: /elo-ratings
- Monte Carlo: /monte-carlo
- Consensus: /consensus
- DFS Optimizer: /dfs-optimizer
- Parlay Builder: /parlay-builder, /parlay-flow, /parlay-tracker
- Line Movement: /line-movement
- Correlation Finder: /correlation-finder
- Odds Comparison: /odds-comparison
- Odds pages: /odds/nfl, /odds/nba, /odds/mlb, /odds/nhl
- Sportsbooks: /sportsbooks
- Sponsors: /sponsors
- Blog SEO pages: /blog/best-sports-betting-picks, /blog/ai-sports-betting, /blog/sports-betting-strategy
- Pricing: /pricing
- Subscription management: /subscription-management, /subscription-dashboard
- Referral: /referral, /affiliate
- Community: /community
- Story Generator: /story-generator, /story-history
- Admin: /admin, /admin/promos, /admin/blog
- Notifications: /notifications (push notifications already built)
- Onboarding: /onboarding
- Account Settings: /account-settings
- Profile: /profile

## NEEDS BUILDING (from Monica recommendations)
1. **Free Daily Pick Page** — A public, no-login-required page showing 1 free AI pick per day with full analysis (currently all picks require login/subscription)
2. **Public Track Record Page** — Transparent, filterable results page showing all graded picks with ROI, win rate, units (currently /stats and /performance exist but may require login)
3. **Free Kelly Criterion Calculator** — Standalone free tool page at /tools/kelly-calculator (currently Kelly is part of premium tools)
4. **Free EV Calculator** — Standalone free tool at /tools/ev-calculator (currently EV Finder requires subscription)
5. **Homepage Trust Bar** — Live results ticker + stats bar ("X Units All-Time | Y% Win Rate")
6. **README Security Cleanup** — Remove admin credentials from public GitHub README
7. **Verify prerender covers all new pages** — Ensure sitemap and snapshots include free tool pages
8. **Structured Data (JSON-LD)** — Organization, Article, FAQ schemas

## ALREADY PARTIALLY EXISTS (needs enhancement)
- Track record: /stats and /performance exist — need to verify if public or gated
- Calculator tools: Several exist — need to verify if they're free/public or gated
- SEO titles: Already have per-route SEO — just need to add entries for new pages
