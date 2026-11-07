#!/usr/bin/env node
/**
 * Mirror the canonical Manus checkpoint to the read-only GitHub mirror.
 * Run only after webdev_save_checkpoint has created a clean checkpoint.
 */
import { execFileSync } from "node:child_process";

const REPO = "big-main/chalkpicks-pro";
const EXPECTED_REMOTE = `https://github.com/${REPO}.git`;
const remoteName = "github";
const rewriteRequested = process.argv.includes("--rewrite");
const checkOnly = process.argv.includes("--check");

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.quiet ? ["ignore", "pipe", "pipe"] : "inherit",
  }).trim();
}

function fail(message) {
  console.error(`[sync:github] ${message}`);
  process.exit(1);
}

const status = git(["status", "--porcelain"], { quiet: true });
if (status) {
  fail("working tree is not clean; save a Manus checkpoint before syncing");
}

const configuredRemote = git(["remote", "get-url", remoteName], { quiet: true });
if (configuredRemote !== EXPECTED_REMOTE) {
  fail(`remote '${remoteName}' must be ${EXPECTED_REMOTE}; found ${configuredRemote}`);
}

const canonicalSha = git(["rev-parse", "HEAD"], { quiet: true });
git(["fetch", remoteName, "main"]);
const mirrorSha = git(["rev-parse", `${remoteName}/main`], { quiet: true });

if (checkOnly) {
  console.log(`[sync:github] canonical=${canonicalSha}`);
  console.log(`[sync:github] mirror=${mirrorSha}`);
  if (canonicalSha !== mirrorSha) {
    fail("mirror is not synchronized");
  }
  console.log("[sync:github] mirror is synchronized");
  process.exit(0);
}

if (canonicalSha === mirrorSha) {
  console.log(`[sync:github] already synchronized at ${canonicalSha}`);
  process.exit(0);
}

let mirrorIsAncestor = true;
try {
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", mirrorSha, canonicalSha],
    { cwd: process.cwd(), stdio: "ignore" }
  );
} catch {
  mirrorIsAncestor = false;
}

if (!mirrorIsAncestor && !rewriteRequested) {
  fail(
    `GitHub mirror ${mirrorSha} is not an ancestor of canonical ${canonicalSha}; review history, then rerun with --rewrite`
  );
}

const lease = `refs/heads/main:${mirrorSha}`;
const pushArgs = ["push", `--force-with-lease=${lease}`, remoteName, "HEAD:main"];
git(pushArgs);
git(["fetch", remoteName, "main"]);
const verifiedSha = git(["rev-parse", `${remoteName}/main`], { quiet: true });
if (verifiedSha !== canonicalSha) {
  fail(`post-push SHA mismatch: canonical=${canonicalSha}, mirror=${verifiedSha}`);
}
console.log(`[sync:github] synchronized ${REPO} main at ${canonicalSha}`);
