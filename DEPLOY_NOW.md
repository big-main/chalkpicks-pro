# ChalkPicks — deploy now checklist

## 1. Database

```sql
-- Must run before relying on /verify or CLV
SOURCE drizzle/0024_pick_ledger.sql;
-- or paste contents of that file into MySQL
```

## 2. Env (production)

```
NODE_ENV=production
JWT_SECRET=<32+ random chars>
DATABASE_URL=mysql://...
ODDS_API_KEY=...          # required or picks job refuses
STRIPE_...=
N8N_WEBHOOK_SECRET=...    # if using n8n
```

## 3. Deploy main

```bash
git pull origin main
pnpm install
pnpm build
pnpm start   # runs prod-start-guard then server
```

## 4. Wire generateAI ledger (if not already)

```bash
node scripts/apply-remaining-wires.mjs
# commit if diff
```

## 5. SEO

- GSC → Sitemaps → `https://chalkpicks.pro/sitemap-index.xml`
- IndexNow key file live: `/chalkpicks2026indexnow.txt`
- Ping Tier-1 URLs after deploy

## 6. Smoke

- [ ] `/health` → ok
- [ ] `/free-picks` loads
- [ ] `/verify/:hash` (after a free pick locks)
- [ ] No picks generated without odds key
- [ ] Login + premium gate

## 7. Mobile (optional next)

```bash
pnpm add -D @capacitor/cli @capacitor/core
pnpm add @capacitor/ios @capacitor/android @capacitor/app @capacitor/browser \
  @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications
pnpm mobile:sync
pnpm mobile:ios
pnpm mobile:android
```

Replace `TEAMID` in `.well-known/apple-app-site-association` and Play SHA256 in `assetlinks.json`.
