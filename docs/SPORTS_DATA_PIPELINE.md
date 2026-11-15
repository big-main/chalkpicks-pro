# ChalkPicks multi-provider sports-data implementation

## Current repository reality

The repository currently uses **MySQL + Drizzle**, not Supabase/PostgreSQL. Do not add Supabase migrations without an explicit database decision. Existing integrations include ESPN, API-Sports, The Odds API, odds-api.io and SharpAPI. Reuse these before adding duplicate providers.

## Phase 1 correctness fixes

- Injury reports must be provider-sourced. Empty means unavailable; never return hand-curated sample players.
- Odds movement must come from timestamped bookmaker snapshots. Never synthesize historical prices or random line movement.
- API-Sports season identifiers are resolved at request time: NFL/MLB use the current season year; NBA/NHL use YYYY-YYYY.
- Credentials remain server-only environment variables; never commit keys or expose Vite/browser variables.
- Provider failure must not silently fall back to fabricated data.

## Provider rollout

| Provider            | Role                                           | State                                                                               |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| ESPN                | Baseline scores, schedules, news               | Existing                                                                            |
| API-Sports          | Supplemental stats, injuries, standings        | Existing                                                                            |
| The Odds API        | Bookmaker odds and scores                      | Existing                                                                            |
| odds-api.io         | Secondary odds feed                            | Existing                                                                            |
| SharpAPI            | Odds, EV and market tools                      | Existing; plan/credential gates apply                                               |
| CollegeFootballData | College football game retrieval by season/week | Adapter implemented; `CFBD_API_KEY` required                                        |
| BALLDONTLIE         | NBA games by date                              | Adapter implemented; `BALLDONTLIE_API_KEY` required; player stats remain plan-gated |
| PandaScore          | Esports schedules/results/stats                | Candidate                                                                           |
| API-Tennis          | Tennis fixtures/results/rankings               | Candidate                                                                           |
| TheSportsDB         | Metadata/branding supplement                   | Candidate only                                                                      |

## Canonical data contract

Each normalized record should carry provider, providerRecordId, sport/league, event/team/player identity, sourceUpdatedAt (if supplied), fetchedAt, validFrom/validTo for point-in-time replay, verificationStatus, and a raw-payload reference/hash subject to provider terms. Never overwrite point-in-time odds/injury snapshots.

## Validation and source selection

1. Reject malformed records, impossible timestamps, unknown identities and duplicate provider IDs.
2. Mark data stale by category-specific TTL; do not quietly serve stale values as current.
3. Compare sources only after identity reconciliation.
4. Prefer authoritative league/team feeds for injuries and lineups; odds providers for prices; statistical providers for box scores.
5. Keep disagreements visible with source timestamps; do not average incompatible injury statuses.
6. Track latency, success/error counts, quota headers, last successful sync and circuit-breaker state.

## Database decision

Current server/db.ts configures Drizzle with drizzle-orm/mysql2 and .env.example documents DATABASE_URL as MySQL. The next schema phase should therefore use Drizzle/MySQL unless the team deliberately approves a separate Supabase store. Inspect existing Drizzle schema/migrations before creating equivalent tables. Logical entities: provider_health, sports_events, sports_teams, sports_players, player_game_stats, team_game_stats, injury_reports, sports_odds, odds_snapshots, player_props, player_prop_history, sports_standings, model_predictions and prediction_results.

## Operational rollout

1. Configure keys in Vercel/Railway project secrets, never in GitHub files.
2. Validate each provider individually with a server-side smoke test.
3. Add adapters incrementally: CollegeFootballData and BALLDONTLIE are implemented behind admin-only procedures; esports/tennis remain candidates.
4. Add persistent ingestion jobs with per-provider budgets, retries/backoff, idempotency and distributed locking.
5. Use `/admin/data-intelligence` for live provider health checks; extend it with freshness, quotas, gaps and conflicts as persistent ingestion is added.
6. Gate picks on required-field freshness and verification; log why a pick was withheld.
7. Run typecheck, lint, unit tests, provider contract tests and production build before merge.

## Non-goals

- No fake data, random odds movement, placeholder injuries or synthetic analyst completion.
- No client-side provider secrets.
- No automatic production deployment or merge without review.
- Do not claim 300 parallel independent agents unless 300 distinct analyses actually execute and are persisted.
