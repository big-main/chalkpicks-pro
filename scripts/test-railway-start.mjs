import { spawnSync } from "child_process";

const env = {
  ...process.env,
  NODE_ENV: "production",
  JWT_SECRET: "chalkpicks_production_jwt_secret_2026_secure_key_992352",
  DATABASE_URL: "mysql://user:pass@host:3306/db",
  PORT: "3000",
};

console.log("Testing prod-start-guard...");
const guard = spawnSync("node", ["scripts/prod-start-guard.mjs"], { env, encoding: "utf8" });
console.log("Guard stdout:", guard.stdout);
console.log("Guard stderr:", guard.stderr);
console.log("Guard exit code:", guard.status);

console.log("\nTesting build...");
const build = spawnSync("pnpm", ["build"], { env, encoding: "utf8", stdio: "inherit" });
console.log("Build exit code:", build.status);
