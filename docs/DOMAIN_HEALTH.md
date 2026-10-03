# Domain health — 2026-10-03 probe

## Live status (external probes)

| Host | Result |
|------|--------|
| `https://chalkpicks.live/` | **404** `Application not found` (Railway fallback) |
| `https://www.chalkpicks.live/` | **404** same |
| `https://chalkpicks.pro/` | **404** same |
| `https://www.chalkpicks.pro/` | **SSL handshake failure** |
| `https://chalkpicks-pro-chalkpicks-env.up.railway.app/` | **404** Railway fallback |
| `*/health` on above | **404** — not the app `/health` |

Headers include `x-railway-fallback: true` and `x-railway-edge`. DNS reaches Railway; **no healthy deployment** answers.

## Root cause (from prior Railway dashboard inspection + current probes)

1. Production service `chalkpicks-pro` was **Crashed** / not serving.
2. Build often **succeeds**; start fails.
3. `pnpm start` runs `scripts/prod-start-guard.mjs`, which **exits 1** without:
   - `JWT_SECRET` (≥32 chars)
   - `DATABASE_URL`
4. Dashboard previously showed **only** `RAILWAY_*` system vars — **no app secrets**.
5. Custom domains still point at Railway edge → public 404 JSON.
6. `www.chalkpicks.pro` TLS is incomplete (cert/domain not fully active).

This is **not** a Stripe/React code bug. The process never stays up.

## Fix (owner must do in Railway UI)

### A. Variables (required)

Service → **Variables** — add at least:

```text
NODE_ENV=production
JWT_SECRET=<random ≥32 characters>
DATABASE_URL=<mysql connection string>
PUBLIC_APP_URL=https://www.chalkpicks.pro
STRIPE_SECRET_KEY=<sk_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
ODDS_API_KEY=<key>   # optional for boot; required for pick gen
```

Use MySQL plugin reference if applicable, e.g. `${{MySQL.MYSQL_URL}}` (exact name from Railway UI).

### B. Redeploy / restart

1. Deployments → **Redeploy** latest successful build, or push a commit to `main`.
2. Open **Deploy Logs** — must see `[prod-start-guard] ok` then `Server running on...`.
3. If guard fails, secrets are still missing/wrong.

### C. Domains

1. Settings → Networking → Custom domains:
   - `www.chalkpicks.pro` (canonical)
   - `chalkpicks.pro`
   - optionally `chalkpicks.live` / `www` (or 301 at Cloudflare to www `.pro`)
2. Wait until certificates are **Active**.
3. Fix www SSL failure before marketing www as primary.

### D. Verify

```bash
curl -sS https://chalkpicks-pro-chalkpicks-env.up.railway.app/health
# expect: {"status":"ok",...}  NOT Application not found

curl -sS https://www.chalkpicks.pro/health
curl -sSI https://www.chalkpicks.pro/ | head -15
```

### E. Stripe after health is green

Webhook: `https://www.chalkpicks.pro/api/stripe/webhook`  
Update `STRIPE_WEBHOOK_SECRET` from the new endpoint.

## What cannot be fixed from GitHub alone

- Setting Railway secrets
- Restarting a crashed replica
- Issuing Cloudflare/Railway TLS for www
- Paying for Railway compute

Repo `railway.json` + `Dockerfile` support a correct deploy once secrets exist.
