# External integration recovery — 2026-11-14

## Verified provider responses

The configured primary SharpAPI credential returns HTTP 401 `invalid_api_key`. The previously supplied older alternate credential also returns that error. The currently configured `SHARPAPI_KEY_2` authenticates, but `/account` reports `tier: free`, features `odds` and `schedule`, and a 12-request/minute limit. Its account and odds requests succeed. EV, arbitrage, low-hold and game-state requests return HTTP 403 `tier_restricted`. No response proves when or why the primary key became invalid; do not present trial expiration as a verified fact.

The configured OpenAI key returns HTTP 401 `invalid_api_key` on the read-only models endpoint. Strict checks also confirm HTTP 401 for the configured Anthropic key on `/v1/models` and OpenRouter key on `/api/v1/key`; the previous Anthropic test accepted rejected credentials and the OpenRouter test was unconditionally skipped. Both configured Discord webhooks return HTTP 404 with code 10015 `Unknown Webhook`. Valid format alone is not proof of an active webhook. Credential diagnostics used only read-only metadata requests, not model generation or webhook posting.

Railway is retired from the ChalkPicks application deployment path. Its inaccessible historical project is not a production acceptance requirement. The obsolete API/router, admin deployment widget and live project probe have been removed together, with retirement regression coverage. Historical provider data and domain registrations remain untouched. Stored n8n workflow exports have not been activated or changed.

## Code recovery

All SharpAPI REST adapters and SSE now use one server-only client. It trims and deduplicates up to three configured keys, tries another existing key once for documented invalid/expired/disabled-key errors, and remembers rejected credentials until configuration changes. A 403 permission denial never triggers credential rotation. A 429 honors the provider reset window instead of bypassing rate limits. Credentials stay in headers and requests cannot redirect to another host.

Premium provider errors propagate instead of masquerading as successful empty data. SSE requires an authenticated admin or an active paid subscription. Upstream connections are canceled when the client disconnects, and stalled connection setup has a bounded timeout. These changes do not manufacture data or restore upstream plan entitlements.

Live tests use the same SharpAPI authentication client as the app. They still require HTTP 200 and documented data shapes. AI tests no longer treat network failures or rejected credentials as success. OpenRouter checks its authenticated `/key` endpoint rather than a public model catalog; Discord checks both active webhook configurations with metadata-only GET requests.

## Validation result

TypeScript and the production build pass. The 22 new auth/stream/retirement regression tests pass. The full suite completes with 320 passing tests and 9 failing live checks: four SharpAPI feature permission failures, three AI provider authentication failures, and two unknown Discord webhooks. Telegram and odds-api.io live checks pass. These failures are retained deliberately; neither rejected authentication nor skipped integration probes are a successful repair.

## Required configuration to finish

Update `SHARPAPI_KEY` in secure server settings to a valid existing key with at least the applicable premium opportunities plan, plus game-state and streaming add-ons where those features are used. Do not expose keys in client-side `VITE_*` variables. Do not buy or renew a plan without the owner's explicit payment approval.

Replace `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `DISCORD_WEBHOOK_URL` and `DISCORD_STEAM_WEBHOOK_URL` with existing valid credentials/endpoints for the intended accounts and channels. No automatic credential reset or webhook recreation has been performed.

Apply replacements both in Manus project secrets and the existing production environment, using `docs/SYNC_WORKFLOW.md`. Configuration changes in one runtime do not prove they reached another. Then run:

```bash
pnpm exec vitest run server/sharpapi.test.ts server/ai-integration.test.ts server/discordTelegram.test.ts
pnpm test
pnpm check
pnpm build
# Save Manus checkpoint before mirroring source:
pnpm sync:github
```

Verify the real production deployment and JSON/API health after the build; a checkpoint or GitHub push alone does not prove production has the new credential settings. Keep failing live checks visible until the provider actually authorizes the requests. Non-billable authentication checks do not prove generation credits or checkout functionality.

## Provider references

- [SharpAPI authentication and permissions](https://docs.sharpapi.io/en/authentication/)
- [SharpAPI endpoint and error reference](https://docs.sharpapi.io/en/api-reference/overview/)
- [OpenRouter authenticated key-status check](https://openrouter.ai/docs/api/reference/limits)
