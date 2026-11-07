# ChalkPicks Pro — Single-Pathway Sync Workflow

## Source of Truth

**Manus workspace** is the single source of truth for ChalkPicks Pro.

- All code changes happen in the Manus sandbox (`/home/ubuntu/chalkpicks-pro`)
- Every `webdev_save_checkpoint` auto-deploys to production at `chalkpicks.pro`
- GitHub (`big-main/chalkpicks-pro`) is a **read-only mirror** — never edit code directly on GitHub

## Sync Flow (One-Way)

```
Manus Workspace (edit here)
    │
    ├── webdev_save_checkpoint → auto-deploys to chalkpicks.pro
    │
    └── pnpm sync:github → verifies and mirrors the checkpoint to GitHub
```

## Rules

1. **Never push to GitHub independently** — all pushes come from Manus after a checkpoint
2. **Never create PRs on GitHub** — they will conflict with force-pushes from Manus
3. **Never edit code on GitHub** (web editor, Codespaces, etc.) — those changes will be overwritten
4. **Force-push is intentional** — Manus owns the history; GitHub is a mirror for backup/visibility
5. **After every checkpoint**, run `pnpm sync:github`. The command verifies the
   configured mirror, refuses a dirty working tree, uses a lease-protected push,
   and confirms that both branches end on the same SHA.

## Why Force-Push?

Manus rewrites history on each checkpoint (squash-like behavior). Regular pushes fail because
the histories diverge. Force-push keeps GitHub in sync without merge conflicts.

## Recovery

If GitHub somehow gets ahead of Manus (someone pushed directly):

1. `git fetch github`
2. `git log --oneline github/main` — check what was added
3. Cherry-pick any needed commits into the Manus workspace
4. Save checkpoint
5. Force-push to re-sync

## Connected Platforms

| Platform       | Role                                  | URL                                |
| -------------- | ------------------------------------- | ---------------------------------- |
| Manus (origin) | Source of truth + deploy              | chalkpicks.pro                     |
| GitHub         | Read-only mirror                      | github.com/big-main/chalkpicks-pro |
| Railway        | DNS registrar for chalkpicks.pro only | railway.com (no code deployed)     |

## Automated Sync

Every Manus session must end with `pnpm sync:github` after the final checkpoint.
Use `pnpm sync:github -- --check` to verify parity without pushing. Only use
`pnpm sync:github -- --rewrite` after reviewing a divergent GitHub history and
confirming that the Manus checkpoint remains the intended source of truth.
