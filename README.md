<p align="center">
  <a href="https://chalkpicks.pro">
    <img src="https://chalkpicks.pro/favicon.ico" width="64" alt="ChalkPicks Logo" />
  </a>
</p>

<h1 align="center">ChalkPicks Pro</h1>

<p align="center">
  <strong>AI-Powered Sports Betting Analytics &amp; +EV Discovery Platform</strong>
</p>

<p align="center">
  <a href="https://chalkpicks.pro">Live Site</a> &bull;
  <a href="https://chalkpicks.pro/methodology">Methodology</a> &bull;
  <a href="https://chalkpicks.pro/pricing">Pricing</a> &bull;
  <a href="https://chalkpicks.pro/blog">Blog</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/tRPC-11-2596be?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Stripe-Subscriptions-635bff?logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/AI-Grok--4%20%7C%20Claude%20%7C%20Gemini-ff6600" alt="AI Models" />
  <img src="https://img.shields.io/badge/Tests-180%20passing-brightgreen" alt="Tests" />
</p>

---

## Overview

ChalkPicks is a production SaaS platform that gives sports bettors a mathematical edge through multi-model AI analysis, real-time odds from 10+ sportsbooks, and professional-grade tools. The platform processes live market data 24/7 and generates picks with calculated edge scores, confidence ratings, and closing-line value tracking.

**Live at:** [chalkpicks.pro](https://chalkpicks.pro)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (React 19 + Vite + Tailwind 4)                          │
│  ├── Pages: Picks, EVFinder, Arbitrage, Strategy, Kalshi, etc.  │
│  ├── Real-time: WebSocket live scores + odds streaming          │
│  └── PWA: Offline caching, push notifications                   │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (tRPC 11 + Express 4)                                │
│  ├── 15+ feature routers (picks, strategy, kalshi, clv, etc.)   │
│  ├── Stripe webhooks + subscription gating                      │
│  └── n8n webhook integration for automation                     │
├─────────────────────────────────────────────────────────────────┤
│  AI Engine                                                      │
│  ├── Grok-4 (xAI) — Strategy analysis + deep reasoning         │
│  ├── Claude (Anthropic) — Pick analysis + qualitative insights  │
│  ├── Gemini (Google) — Blog content + structured output         │
│  ├── Ollama (local) — Free-tier volume processing               │
│  └── OpenRouter — Fallback routing                              │
├─────────────────────────────────────────────────────────────────┤
│  Data Sources                                                   │
│  ├── The Odds API — 10+ sportsbook lines (live)                 │
│  ├── ESPN — Scores, stats, injury reports                       │
│  ├── Kalshi — Prediction market contracts                       │
│  ├── Open-Meteo — Weather impact for outdoor games              │
│  └── OddsHarvester — OddsPortal historical scraping             │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── TiDB Cloud (MySQL-compatible, serverless)                  │
│  ├── Manus Autoscale (production hosting)                       │
│  ├── Cloud Computer (GCE) — Ollama, Quant Sidecar, PM2          │
│  ├── S3 — File storage                                          │
│  └── GitLab CI/CD + k3s + Lighthouse CI                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### AI Picks Engine

- Multi-model ensemble (Grok-4, Claude, Gemini, Ollama) with confidence scoring
- Edge calculation against market consensus
- Weather impact modeling for outdoor sports (NFL, MLB)
- Automated daily generation across NFL, NBA, MLB, NHL
- Closing Line Value (CLV) tracking and post-game grading

### Professional Tools

| Tool                    | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **+EV Finder**          | Identifies positive expected value across 10+ books |
| **Steam Move Detector** | Real-time sharp money flow alerts                   |
| **Arbitrage Finder**    | Guaranteed profit from line discrepancies           |
| **Strategy Builder**    | Grok-4 powered custom strategy analysis             |
| **Kalshi Markets**      | Prediction market tracking + implied odds           |
| **CLV Tracker**         | Closing line value on every bet                     |
| **Parlay Builder**      | Correlation-aware AI optimizer                      |
| **Kelly Calculator**    | Optimal bet sizing                                  |
| **Bankroll Tracker**    | P&L, ROI, CSV export                                |
| **Free Bet Converter**  | Maximize free bet value                             |
| **Middles Finder**      | Identify middling opportunities                     |

### Platform

- Stripe subscriptions (Daily $9.99 / Monthly $29.99 / Yearly $199.99)
- Tier-gated access with paywall enforcement
- Real-time WebSocket live scores and odds streaming
- PWA with offline support and push notifications
- Blog with AI-generated SEO content pipeline
- Programmatic SEO pages (sport-specific picks, daily archive)
- Bot pre-rendering for search engine crawlers (Googlebot, GPTBot, etc.)

---

## Tech Stack

| Layer    | Technology                                                |
| -------- | --------------------------------------------------------- |
| Frontend | React 19, TypeScript 5, Vite 6, Tailwind CSS 4, shadcn/ui |
| Backend  | Node.js 22, tRPC 11, Express 4, Drizzle ORM               |
| Database | TiDB Cloud (MySQL-compatible serverless)                  |
| Payments | Stripe (subscriptions, webhooks, promo codes)             |
| AI       | Grok-4 (xAI), Claude (Anthropic), Gemini (Google), Ollama |
| Auth     | Manus OAuth + bcrypt session cookies                      |
| Storage  | S3-compatible object storage                              |
| CI/CD    | GitLab CI + Lighthouse CI + ESLint 9 + Husky              |
| Infra    | Manus Autoscale + GCE Cloud Computer (PM2, nginx)         |
| Data     | The Odds API, ESPN, Kalshi, Open-Meteo, OddsHarvester     |

---

## Subscription Plans

| Plan        | Price   | Billing   | Access                          |
| ----------- | ------- | --------- | ------------------------------- |
| Free        | $0      | —         | Limited picks, blurred analysis |
| Daily Pass  | $9.99   | Per day   | Full access for 24h             |
| Monthly Pro | $29.99  | Per month | All tools + priority picks      |
| Yearly Pro  | $199.99 | Per year  | Everything + 2 months free      |

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (port 3000)
pnpm dev

# Type check (0 errors)
pnpm check

# Lint (ESLint 9 flat config, 0 errors)
pnpm lint

# Run tests (180 specs passing)
pnpm test

# Build for production
pnpm build
```

---

## Project Structure

```
client/src/
  pages/           ← 30+ feature pages
  components/      ← Reusable UI (NeonCard, Paywall, SEO, etc.)
  hooks/           ← Custom hooks (useAuth, useRouteSEO, etc.)
  lib/trpc.ts      ← tRPC client binding
  App.tsx          ← Routes & lazy loading

server/
  routers/         ← 15+ tRPC feature routers
  services/        ← AI, odds, weather, closing-line services
  middleware/      ← Security headers, rate limiting, prerender
  scheduler.ts     ← Daily picks, results resolution, blog gen

drizzle/
  schema.ts        ← 20+ tables (picks, users, subscriptions, etc.)

shared/
  seo-routes.ts    ← 80+ route SEO metadata entries

scripts/           ← Sitemap gen, snapshots, IndexNow, seed
```

---

## Deployment

**Production:** Manus Autoscale (serverless, auto-publish on checkpoint)

**Domains:**

- [chalkpicks.pro](https://chalkpicks.pro)
- [www.chalkpicks.pro](https://www.chalkpicks.pro)
- [bet.chalkpicks.pro](https://bet.chalkpicks.pro)

**Cloud Computer Mirror:** GCE VM with nginx, PM2, Ollama, Quant Sidecar

---

## Contributing

This is a private commercial project. For feature requests or bug reports, contact the maintainer.

---

## License

Proprietary. All rights reserved.

---

<p align="center"><em>21+ Only. Bet Responsibly.</em></p>
<p align="center">&copy; 2026 ChalkPicks. All rights reserved.</p>
