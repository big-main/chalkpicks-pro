# Ops + Security applied (2026-07-29)

## Landed on `main`

| Item | Status |
|------|--------|
| `server/_core/env.ts` | No hard-coded cloud IPs; `assertProductionSecrets()`; `hasOddsApiKey` |
| `server/_core/boot-env.ts` | JWT length ≥32 in prod + assertProductionSecrets |
| `server/scheduler.ts` | **Hard-stop** pick gen in production if no odds API key |
| `.github/workflows/ci.yml` | `pnpm check` + `pnpm test` on main/PRs |
| Security middleware | Already mounted (`registerSecurityMiddleware`) |
| JWT required at boot | Already in `index.ts` |

## Wire remaining (manual / next session)

1. **`index.ts`**: at start of `startServer()`, call:
   ```ts
   import { runBootGuards } from "./boot-env";
   runBootGuards();
   ```
   (replaces the single JWT_SECRET check)

2. **`picks.generateAI`**: after insert, call:
   ```ts
   import { commitPickRowToLedger, extractInsertId } from "../_core/pick-ledger";
   const pickId = extractInsertId(inserted) ?? (inserted as any).insertId;
   if (pickId) void commitPickRowToLedger({ id: pickId, ...fields });
   ```

3. **Deploy checklist**
   - Apply `drizzle/0024_pick_ledger.sql`
   - Set `JWT_SECRET` ≥32 chars, `DATABASE_URL`, `ODDS_API_KEY`
   - Deploy main
   - GSC + IndexNow

## Production behavior

- Missing odds key in **production** → scheduler logs REFUSING and exits (no fake matchups).
- Missing odds key in **development** → DEV fallback matchups still allowed.
- Missing JWT / short JWT in production → process must not start (boot guards).
