# Pick Ledger + CLV Skill (applied)

## Status on `main`

| Item                                  | Status                             |
| ------------------------------------- | ---------------------------------- |
| `drizzle/0024_pick_ledger.sql`        | Ready — **run on prod DB**         |
| `server/_core/pick-ledger.ts`         | Hash + lock + grade                |
| `server/_core/clv-skill.ts`           | Skill rating math                  |
| Scheduler publish → ledger            | Wired                              |
| Settle → grade ledger                 | Wired                              |
| Closing-line job                      | Scheduled 9/21 UTC + after results |
| `clv.modelSkill` / `clv.verifyByHash` | Public tRPC                        |
| `/verify/:hash` page                  | Live route                         |

## Ops (required once)

```bash
mysql $DATABASE < drizzle/0024_pick_ledger.sql
```

Without this table, lock/grade fail open (logs only).

## Flow

1. Daily picks job inserts pick → `commitPickRowToLedger`
2. Results resolver sets W/L/P → `gradeLedgerEntry`
3. Closing-line job fills `closingLine` + `clvValue`
4. `clv.modelSkill` replays CLV series → skill rating
5. Public proof: `/verify/{contentHash}`

## Skill formula

```
skill = 1500 + Σ 16·tanh(clv%/4)
tiers: unranked (<20) | developing | solid (≥1520) | sharp (≥1600) | elite (≥1700)
```
