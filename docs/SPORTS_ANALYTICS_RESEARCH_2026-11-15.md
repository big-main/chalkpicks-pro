# ChalkPicks Pro Sports Analytics Research — 2026-11-15

## Decision

The highest-leverage path is not scraping more websites or adding generic AI. ChalkPicks should win on verifiable, timestamped data; source-ranked availability changes; transparent model evaluation; and premium analytics that fail closed when inputs are stale, suspended, mismatched, or unlicensed.

## Ship first

1. Add a provider-neutral identity and provenance contract: internal event/player/market IDs, provider IDs, sport/league/season, source, fetched/effective timestamps, freshness, provisional/final state, and conflict status.
2. Add visible freshness and source badges to analytics; distinguish live/base data from delayed advanced metrics and corrected/postgame data.
3. Keep premium EV/core analytics fail-closed when price, market identity, availability, or source freshness is unresolved. Show model probability, implied probability, price timestamp, model version, and uncertainty.
4. Normalize player availability as a time series: source tier, stable IDs, publication/update time, exact source link, conflict state, official inactive/scratch status, and correction history.
5. Preserve the immutable pick ledger with exact reference odds, decision timestamp, model version, result/void rules, closing comparison, vig method, and losses. Report CLV, calibration, Brier/log loss, drawdown, turnover, and confidence intervals separately.
6. Use authorized provider adapters only. The Odds API is suitable for an MVP only within its commercial terms; CFBD and BALLDONTLIE are useful supplements but require commercial-rights confirmation. Do not treat ESPN/league pages as open APIs.
7. Improve mobile-first onboarding and premium boundaries around a useful preview, transparent renewal, alert quiet hours, and frequency caps.
8. Build durable SEO around substantive sport hubs, event/update logs, methodology, probability/risk education, calibration reports, internal links, and valid visible structured data.

## Review before production

Provider contracts and rights for The Odds API, OpticOdds, SportsDataIO, Sportradar, CFBD, BALLDONTLIE, official league feeds, AP/Reuters, X, Reddit, Discord, and Telegram must be verified for commercial display, caching, derived models, attribution, geography, retention, quotas, and deletion handling. Public pages and API keys are not proof of redistribution rights.

Gambling, advertising, age/geo, responsible-play, privacy, health-information, and sports-integrity requirements need jurisdiction-specific review before sportsbook links, creator campaigns, personalized wagering recommendations, or automated alerts.

## Do not ship

Do not scrape undocumented league/ESPN endpoints, ingest broad Discord/Telegram/Reddit content without consent, rank individual bettors, use social chatter as truth, automate wagering, publish guaranteed or unverifiable win-rate claims, resell raw odds feeds, or use vendor survey/chart/traffic numbers as proof of product-market fit.

## Evidence highlights

- NBA documents real-time base-stat updates but advanced-stat updates can lag 10–15 minutes: https://www.nba.com/stats/help/faq
- NCAA documents rejected, missing, and corrected XML uploads: http://fs.ncaa.org/Docs/stats/ForSIDs/LiveStats.pdf and http://fs.ncaa.org/Docs/stats/ForSIDs/single_game_faq.pdf
- NFL Next Gen Stats and NHL EDGE describe proprietary/partner-grade tracking, not open commercial feeds: https://operations.nfl.com/game-operations-logistics/technology/performance-tracking-data-next-gen-stats and https://www.nhl.com/news/nhl-edge-advanced-stats-section-brings-fans-closer-to-game
- The Odds API documents commercial analytics/derived-model use but prohibits standalone raw-feed resale and warns that data may be stale/inaccurate: https://the-odds-api.com/terms-and-conditions.html
- OpticOdds documents historical/current odds, injuries, grading, and SSE limits: https://developer.opticodds.com/reference/getting-started and https://developer.opticodds.com/docs/api-faq
- SportsDataIO scopes commercial rights per license: https://sportsdata.io/help/data-rights-and-licensing-questions
- X, Reddit, Discord, and Telegram impose meaningful restrictions on redistribution, profiling, scraping, automation, and retention: https://docs.x.com/developer-terms/policy, https://support.reddithelp.com/hc/en-us/articles/26410290525844-Public-Content-Policy, https://docs.discord.com/developers/policies/developer-policy, https://telegram.org/tos
- Action Network, RotoWire, FantasyPros, and numberFire evidence a market pattern of transparent methodology, tiered pricing, trackers, projections, and responsible-play disclosures: https://www.actionnetwork.com/subscribe, https://www.rotowire.com/subscribe/pricing/, https://www.fantasypros.com/premium/plans/fp-ft/, https://www.numberfire.com/research/horse-racing/picks
- Calibration and leakage controls matter: https://arxiv.org/html/2504.04906v3, https://arxiv.org/html/1910.08858v2, https://www.ibm.com/think/topics/data-leakage-in-machine-learning
- Google recommends helpful people-first content and treats Trends as normalized/directional: https://developers.google.com/search/docs/essentials, https://developers.google.com/search/docs/monitor-debug/trends-start, https://support.google.com/trends/answer/4365533?hl=en
- App Store Connect, RevenueCat, and Mobbin provide useful but non-causal product benchmarks: https://developer.apple.com/app-store-connect/analytics/, https://www.revenuecat.com/state-of-subscription-apps/, https://mobbin.com/blog/the-long-onboarding-a-study-of-1-460-flows

## Source caveat

Vendor surveys, traffic estimates, app-store ranks, HN activity, and GitHub activity are directional hypotheses, not evidence of ChalkPicks conversion, retention, profitability, or prediction lift. Revalidate current prices, terms, quotas, and availability during procurement.
