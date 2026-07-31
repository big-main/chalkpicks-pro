# Dev Server Smoke Check

A lightweight local smoke test that verifies the dev server is healthy and serving all critical routes.

## Usage

```bash
# Terminal 1 — start the dev server
pnpm dev

# Terminal 2 — run the smoke check (after "Server running on …")
pnpm dev:check
```

Non-default port:

```bash
BASE_URL=http://127.0.0.1:3001 pnpm dev:check
```

## What It Verifies

| Check           | Required | Pass Condition              |
| --------------- | -------- | --------------------------- |
| `/health`       | yes      | 200 + `{ status: "ok" }`    |
| `/robots.txt`   | yes      | 200 + contains `User-agent` |
| `/sitemap.xml`  | yes      | 200 + contains `<urlset`    |
| `/`             | yes      | 200 + contains `</html>`    |
| `/free-picks`   | yes      | 200 + contains `</html>`    |
| `/verify`       | optional | 200, 301, 302, or 404       |
| `/openapi.json` | optional | 200 or 404                  |

## Exit Codes

- **Exit 0** — all required checks pass
- **Exit 1** — server down or a required route broken

## Files

- `scripts/dev-server-check.mjs` — the check script
- `package.json` → `"dev:check"` script

## When to Run

- After `git pull` + `pnpm install`
- After any server-side code change
- Before committing / pushing
- In CI as a post-start health gate
