#!/usr/bin/env node
/**
 * scripts/dev-server-check.mjs
 * ─────────────────────────────
 * Local dev-server smoke check.
 *
 * Usage:
 *   pnpm dev:check                           # default http://127.0.0.1:3000
 *   BASE_URL=http://127.0.0.1:3001 pnpm dev:check
 *
 * Exit 0 = all required checks pass.
 * Exit 1 = server down or a required route broken.
 */

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

const CHECKS = [
  // [path, required, validator]
  { path: "/health", required: true, validate: validateHealth },
  { path: "/robots.txt", required: true, validate: validateContains("User-agent") },
  { path: "/sitemap.xml", required: true, validate: validateContains("<urlset") },
  { path: "/", required: true, validate: validateContains("</html>") },
  { path: "/free-picks", required: true, validate: validateContains("</html>") },
  { path: "/verify", required: false, validate: validateStatus([200, 301, 302, 404]) },
  { path: "/openapi.json", required: false, validate: validateStatus([200, 404]) },
];

// ─── Validators ─────────────────────────────────────────────────────────────

function validateHealth(res, body) {
  if (res.status !== 200) return `Expected 200, got ${res.status}`;
  try {
    const json = JSON.parse(body);
    if (json.status !== "ok") return `Expected { status: "ok" }, got ${JSON.stringify(json)}`;
  } catch {
    return `Response is not valid JSON: ${body.slice(0, 100)}`;
  }
  return null;
}

function validateContains(needle) {
  return (res, body) => {
    if (res.status !== 200) return `Expected 200, got ${res.status}`;
    if (!body.includes(needle)) return `Body missing "${needle}"`;
    return null;
  };
}

function validateStatus(allowed) {
  return (res) => {
    if (!allowed.includes(res.status)) return `Expected one of [${allowed}], got ${res.status}`;
    return null;
  };
}

// ─── Runner ─────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🔍 Dev Server Smoke Check → ${BASE}\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const check of CHECKS) {
    const url = `${BASE}${check.path}`;
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.text();
      const error = check.validate(res, body);

      if (error) {
        if (check.required) {
          console.log(`  ❌ ${check.path} — ${error}`);
          failed++;
        } else {
          console.log(`  ⚠️  ${check.path} — ${error} (optional)`);
          skipped++;
        }
      } else {
        console.log(`  ✅ ${check.path} — ${res.status}`);
        passed++;
      }
    } catch (err) {
      if (check.required) {
        console.log(`  ❌ ${check.path} — ${err.message}`);
        failed++;
      } else {
        console.log(`  ⚠️  ${check.path} — ${err.message} (optional)`);
        skipped++;
      }
    }
  }

  console.log(`\n─── Results ───`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log();

  if (failed > 0) {
    console.log("💀 FAIL — required checks did not pass.\n");
    process.exit(1);
  } else {
    console.log("✅ PASS — all required checks green.\n");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(`\n💀 Unexpected error: ${err.message}\n`);
  process.exit(1);
});
