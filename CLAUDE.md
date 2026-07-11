# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ChalkPicks Pro — an AI-powered sports betting analytics platform (React + tRPC + MySQL). See `README.md` for the product feature list, subscription plans, and tech stack summary.

## Commands

```bash
pnpm install         # install deps (packageManager is pinned to pnpm — do not use npm/yarn)
pnpm dev              # start dev server (tsx watch) on :3000, falls back to next free port
pnpm build            # vite build (client) + esbuild bundle (server) -> dist/
pnpm start            # run production build (dist/index.js)
pnpm check            # tsc --noEmit — run this after any non-trivial change
pnpm test             # vitest run, all *.test.ts under server/
pnpm format           # prettier --write .
pnpm db:push          # drizzle-kit generate && drizzle-kit migrate
```

Run a single test file: `pnpm vitest run server/kalshi.test.ts`
Run tests matching a name: `pnpm vitest run -t "arbitrage"`

There is no separate lint script; `pnpm check` (TypeScript, `strict: true`) and `pnpm format` (Prettier) are the two static gates. Vitest config only picks up `server/**/*.test.ts` — client code has no test runner configured.

## Architecture

**Monorepo layout, single Express process serves both API and client:**
- `server/_core/index.ts` is the entrypoint. It wires up webhooks (raw body, registered *before* JSON body parsers), security middleware, compression, the tRPC handler at `/api/trpc`, a `/health` check, a public OpenAPI/Scalar doc at `/openapi.json`, and (in production) static file serving for the built client. In dev, `server/_core/vite.ts` mounts Vite as middleware for HMR.
- `server/routers.ts` is the tRPC root router (`appRouter`) — it composes every feature router from `server/routers/*.ts` plus an inline `auth` sub-router (register/login/logout/onboarding) that manages session cookies directly via `sdk.createSessionToken`/`bcrypt`.
- `server/_core/trpc.ts` defines the procedure tiers used across all routers: `publicProcedure`, `protectedProcedure` (any logged-in user), `adminProcedure` (`role === 'admin'`), `premiumProcedure` (any non-free subscription), `proProcedure` (monthly/yearly only). Pick the narrowest tier that satisfies the endpoint's access requirement.
- `server/_core/context.ts` builds the per-request tRPC context; auth is resolved via `sdk.authenticateRequest` and failures degrade to `user: null` rather than throwing, since most procedures are public.
- Path aliases (`@` -> `client/src`, `@shared` -> `shared`) are declared three times independently and must stay in sync: `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`.

**Client** (`client/src/`): React 19 + Wouter routing, all defined in `App.tsx`. Only `Home` and a handful of above-the-fold components are eager-loaded; every other page is `lazy()`-imported for code splitting — follow this pattern when adding new pages. tRPC access goes through `client/src/lib/trpc.ts` (`createTRPCReact<AppRouter>()`), which imports the server's `AppRouter` type directly for full end-to-end type safety — never hand-write client-side API types.

**Data layer**: `drizzle/schema.ts` is the single source of truth for the MySQL (TiDB) schema; `drizzle/relations.ts` holds relational config. `server/db.ts` exposes query helpers (`getDb()`, `getUserByEmail`, etc.) — routers should go through these helpers or `getDb()` + Drizzle query builder rather than raw SQL. Migrations live in `drizzle/*.sql`, generated via `pnpm db:push`.

**Background jobs**: `server/scheduler.ts` drives daily pick generation and result resolution (`startScheduler`, wired up in `index.ts`). `server/handlers/*` hold additional cron-style handlers (arbitrage refresh, social posts, newsletters, welcome drip, blog content) that are also started from `index.ts`. `server/_core/liveDataStreamer.ts` + `server/websocket.ts` push live updates over WebSocket/Socket.IO.

**AI picks**: `server/_core/llm.ts` wraps LLM calls (Claude for deep analysis, OpenAI for summaries — see `.env.example` for `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`BUILT_IN_FORGE_API_*`). `server/scheduler.ts` has a `DEV_FALLBACK_MATCHUPS` list explicitly gated to dev-only use — production must never publish picks for fabricated games; real slates come from `server/services/dataService.ts` (Odds API) filtered against a `MOCK_EVENT_ID` regex to keep mock data out of paid content.

**External integrations**: Stripe (`server/webhook.ts`, `server/routers/subscription.ts`), PayPal (`server/paypal-webhook.ts`), Kalshi prediction markets (`server/_core/kalshi.ts`), SendGrid email (`server/email.ts`), Twilio SMS (`server/routers/sms.ts`), web push (`server/services/pushNotifications.ts`), Open-Meteo weather (no key required).

**Shared code** (`shared/`): `shared/const.ts` (cookie name, TTLs, shared error message strings), `shared/types.ts`, `shared/utils.ts`, `shared/_core/errors.ts` (custom error classes like `ForbiddenError`) — importable from both server and client via the `@shared` alias.

## Notes

- `JWT_SECRET` is required at boot — the server throws immediately in `startServer()` if it's unset.
- Session auth uses a signed JWT in a cookie (`server/_core/sdk.ts`, `jose` for signing), not a third-party auth provider, despite the README's "Manus OAuth" mention in places — check `sdk.ts` and `routers.ts`'s `auth` router for the actual current implementation before assuming OAuth is live.
- `pnpm.overrides` and `pnpm.patchedDependencies` in `package.json` pin `tailwindcss`'s nested `nanoid` and patch `wouter@3.7.1` — be aware these exist if you touch those deps.
