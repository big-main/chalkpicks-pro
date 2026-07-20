# ChalkPicks — AI-Powered Sports Betting Analytics

**Live at:** [chalkpicks.live](https://chalkpicks.live)

ChalkPicks is a high-performance, AI-powered sports betting analytics platform designed for bettors who want a real, mathematical edge. Built with a premium **Neon Cyber** aesthetic, it combines advanced LLM analysis with real-time market data from 10+ sportsbooks and prediction markets like Kalshi.

---

## Key Features

### AI-Powered Picks
- **Multi-Model Analysis** — Uses Claude for deep qualitative analysis and OpenAI for concise summaries
- **Edge Scoring** — Every pick includes a confidence bar and calculated edge against market lines
- **Weather Impact Model** — Open-Meteo API integrated into NFL/MLB picks for outdoor game conditions
- **24/7 Generation** — Automated daily picks across NFL, NBA, MLB, NHL, and more

### Professional Tools
- **+EV Finder** — Identifies positive expected value bets by comparing lines across 10+ sportsbooks
- **Steam Move Detector** — Alerts you to sudden, sharp line movements where the smart money is flowing
- **Kalshi Market Integration** — Real-time tracking of prediction markets for non-sports events and sports outcomes
- **Arbitrage Finder** — Spot guaranteed profit opportunities through line discrepancies
- **Parlay Builder** — AI-powered correlated parlay optimizer
- **CLV Tracker** — Track your closing line value on every bet
- **Kelly Criterion Tool** — Mathematically optimal bet sizing
- **Bankroll Tracker** — Full P&L and ROI tracking with CSV export

### Sportsbooks & Affiliates
- Dedicated `/sportsbooks` page with affiliate links to DraftKings, FanDuel, BetMGM, Caesars, PointsBet, BetRivers, Bet365, WynnBET, BetUS, Bovada, and more

### Sponsorship System
- `/sponsors` page with Bronze ($299/mo), Silver ($699/mo), and Gold ($1,499/mo) advertising tiers

---

## Subscription Plans

| Plan | Price | Billing |
|------|-------|---------|
| Daily Pass | $9.99 | Per day |
| Monthly | $29.99 | Per month |
| Yearly | $199.99 | Per year |

No free trial. All plans include full access to AI picks, tools, and analytics.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **Backend** | Node.js, tRPC 11, Express 4 |
| **Database** | MySQL (TiDB) with Drizzle ORM |
| **Payments** | Stripe (subscriptions + webhooks) |
| **AI** | Claude (Anthropic) + OpenAI via OpenRouter |
| **Auth** | Manus OAuth + bcrypt session cookies |
| **Storage** | S3-compatible object storage |
| **Weather** | Open-Meteo API (free, no key required) |

---

## Project Structure

```
client/src/
  pages/          <- Feature pages (Picks, EVFinder, Arbitrage, etc.)
  components/     <- Reusable UI components
  lib/trpc.ts     <- tRPC client binding
  App.tsx         <- Routes & layout

server/
  routers/        <- tRPC feature routers
  routers.ts      <- Root router
  db.ts           <- Database query helpers
  scheduler.ts    <- Daily picks generation cron
  webhook.ts      <- Stripe webhook handler

drizzle/
  schema.ts       <- Database schema & types
```

---

## Admin Access

To promote a user to admin via SQL:

```sql
UPDATE users SET role = 'admin', subscription_tier = 'yearly' WHERE email = 'user@example.com';
```

---

## Development

```bash
pnpm install
pnpm dev          # Start dev server on :3000
pnpm test         # Run Vitest tests
pnpm tsc --noEmit # TypeScript check
```

---

## Deployment

Hosted on Manus with autoscale (serverless) deployment.

Production domains:
- [chalkpicks.live](https://chalkpicks.live)
- [www.chalkpicks.live](https://www.chalkpicks.live)

To deploy: create a checkpoint in the Manus Management UI, then click **Publish**.

---

*21+ Only. Bet Responsibly.*

(c) 2026 ChalkPicks. All rights reserved.
