# ChalkPicks Pro — External Hosting & Migration Strategy

## 1. Stack Overview

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + Wouter
- **Backend:** Node.js + Express 4 + tRPC 11 + Drizzle ORM
- **Database:** TiDB / MySQL (currently Manus-managed; exportable as MySQL-compatible SQL)
- **File Storage:** AWS S3 compatible (or local uploads bucket)
- **Real-time:** Server-Sent Events (SSE) proxy for SharpAPI

## 2. Recommended Hosting Target: Railway (or Render)

Since the user already pays for Railway and has an existing ChalkPicks Railway project, **Railway is the preferred application host** for the first migration, while `chalkpicks.pro` remains the primary domain:

- **Zero code changes required:** Railway runs Node.js apps natively using `pnpm build` and `pnpm start`.
- **Managed service deployment:** Railway can run the Node service directly. Its official Express guide documents PostgreSQL provisioning; because ChalkPicks uses MySQL/TiDB, do not silently change the database engine during the first cutover. Keep a MySQL-compatible database until a separate, tested PostgreSQL migration is approved.
- **Environment variables:** Securely inject all API keys (`SHARPAPI_KEY`, `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, etc.) directly into Railway service variables.
- **Custom domain binding:** Seamlessly bind `chalkpicks.pro` directly on Railway.

## 3. Step-by-Step Migration Checklist

1. **Export Database:** Dump the TiDB/MySQL database tables (`picks`, `users`, `subscriptions`, `backtests`, etc.) via `mysqldump` or Drizzle migration export.
2. **Push to GitHub:** Ensure the latest commit on `big-main/chalkpicks-pro` is fully up-to-date (handled by `git push github main --force`).
3. **Deploy on Railway:**
   - Create a new Railway project from the GitHub repository (`big-main/chalkpicks-pro`).
   - Add a MySQL database service in Railway and link it.
   - Set environment variables (`DATABASE_URL`, `PORT=3000`, API keys).
   - Configure build command: `pnpm install && pnpm build`
   - Configure start command: `pnpm start`
4. **DNS Cutover:** Point `chalkpicks.pro` CNAME/A records from Manus to Railway's generated domain.

## 4. Verified Hosting Research (August 2026)

Railway's official pricing page lists a $0 Free plan with $1/month of usage credits, one service replica, and a 1 vCPU / 0.5 GB per-service limit. The Hobby plan is $5/month and includes $5 of usage credits. This makes Railway the lowest-rewrite paid target for a production Node service, but the Free plan is unlikely to cover a continuously active production app with SSE and frequent external API calls. [1]

Railway's official Express deployment guide confirms that an existing GitHub repository can be deployed directly, Railway detects Node applications automatically, and a PostgreSQL service can be provisioned and referenced through `DATABASE_URL`. ChalkPicks currently uses MySQL/TiDB, so a PostgreSQL migration would add unnecessary rewrite and data-migration risk. The first cutover should preserve MySQL compatibility; PostgreSQL can be evaluated later as a separate migration with a staging restore and parity tests. [2]

Render provides a free Node web-service tier with custom domains and managed TLS, but its official documentation states that free services spin down after 15 minutes of inactivity, local files are ephemeral, free Postgres expires after 30 days, and free instances are not intended for production. It is suitable as a temporary preview or disaster-recovery target, not as the primary ChalkPicks host while live odds, SSE, payments, and scheduled jobs are active. [3]

Koyeb's current official pricing page documents paid Pro workspace pricing and usage-based compute, plus serverless Postgres and custom domains; it does not present a comparable always-on free tier for this workload. It is therefore not the first migration target when the objective is minimum cost and minimum rewrite. [4]

### Decision

Keep `chalkpicks.pro` as the primary domain. Prepare Railway as the preferred replacement host because the user already pays for it and the application is a standard Node/Express service. Do not cut over DNS, cancel Manus, or migrate production data until a replacement deployment passes the full smoke test. Keep Render only as a temporary free preview option, not the production recommendation.

### References

[1]: https://railway.com/pricing "Railway Pricing"
[2]: https://docs.railway.com/guides/express "Deploy an Express App | Railway Guides"
[3]: https://render.com/docs/free "Deploy for Free | Render Docs"
[4]: https://www.koyeb.com/pricing "Koyeb Pricing"

## 5. Current Railway Project Inspection

The existing Railway project was found through the read-only Railway API using project ID `c13dde22-2ed9-4e8e-b1c1-9c63b727f2e1`. It contains one service named `chalkpicks-pro` and a production-like environment named `Chalkpicks Env`; a separate pull-request environment also exists. The service's latest recorded deployment was `CRASHED` on August 6, 2026. Its service settings currently have no explicit build command, no explicit start command, and no healthcheck path. The repository now includes `railway.json` to make those settings deterministic on the next deployment.

The Railway API token used for inspection was not authorized to read variable values or deployment logs. No variable values were requested or exported. The Railway browser dashboard was not available in the current browser session, so no dashboard mutation was performed. The existing project and Manus deployment remain untouched.
