# ChalkPicks Pro — Railway Environment Manifest

This file lists **variable names only**. It intentionally contains no secret values. Values must be entered directly in the Railway service's Variables interface or through a secure secret-management workflow; they must never be committed to GitHub or placed in a public export bundle.

## Required for the application to boot

| Variable                 | Purpose                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | Set to `production`.                                                                                                                                 |
| `PORT`                   | Supplied by Railway; the server must bind to it.                                                                                                     |
| `DATABASE_URL`           | MySQL/TiDB-compatible database connection string. Preserve the current engine for the first cutover.                                                 |
| `JWT_SECRET`             | Session-cookie signing secret; use the existing production value and do not rotate during the first cutover unless planned.                          |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL used by remaining platform helpers. Audit before external cutover because this may need a replacement or compatibility layer. |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus helper credential. Do not export to GitHub.                                                                                        |

## Sports data and odds

`SHARPAPI_KEY`, `SHARPAPI_KEY_2`, `SHARPAPI_KEY_3`, `ODDS_API_KEY`, `ODDS_API_IO_KEY`, `API_SPORTS_KEY`, `ODDSHARVESTER_API_URL`, `QUANT_SIDECAR_URL`, `DISABLE_LIVE_STREAMING`

## AI and language services

`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_API_URL`, `OLLAMA_MODEL`

## Payments and subscriptions

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_REVENUECAT_ANDROID_KEY`, `VITE_REVENUECAT_IOS_KEY`, `REVENUECAT_WEBHOOK_SECRET`

## Email, SMS, and push notifications

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SENDGRID_API_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_FROM`, `TWILIO_PHONE_NUMBER`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VITE_VAPID_PUBLIC_KEY`

## Social and automation integrations

`DISCORD_WEBHOOK_URL`, `DISCORD_STEAM_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `N8N_DRIP_WEBHOOK_URL`, `N8N_PICKS_WEBHOOK_URL`, `N8N_SOCIAL_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `CRON_SERVICE_TOKEN`, `SCHEDULER_SECRET`, `WORKER_API_TOKEN`

## SEO, analytics, and operations

`AHREFS_API_KEY`, `BABYLOVEGROWTH_API_KEY`, `PAGESPEED_API_KEY`, `INDEXNOW_KEY`, `APP_URL`, `BASE_URL`, `RAILWAY_API_TOKEN`, `RAILWAY_PROJECT_ID`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

## Browser-exposed variables

Only values intentionally safe for browser exposure may use the `VITE_` prefix. Re-check every `VITE_` value before migration; never place private API keys under a `VITE_` name.

## Migration rule

Copy values from the existing secure secret store into the replacement host manually or through an approved encrypted deployment process. Do not export `.env`, `.env.production`, Railway variable values, database passwords, webhook URLs containing tokens, OAuth secrets, Stripe keys, SharpAPI keys, or social credentials into the repository, backup zip, or GitHub.
