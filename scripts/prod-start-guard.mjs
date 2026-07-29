#!/usr/bin/env node
/**
 * Runs before `node dist/index.js` in production.
 * Fail closed on missing / weak secrets so the app never serves without auth integrity.
 */
import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";
if (!isProd) process.exit(0);

const jwt = process.env.JWT_SECRET ?? "";
if (!jwt) {
  console.error("[prod-start-guard] JWT_SECRET is required");
  process.exit(1);
}
if (jwt.length < 32) {
  console.error("[prod-start-guard] JWT_SECRET must be at least 32 characters");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("[prod-start-guard] DATABASE_URL is required");
  process.exit(1);
}
if (!process.env.ODDS_API_KEY && !process.env.ODDS_API_IO_KEY) {
  console.warn(
    "[prod-start-guard] WARNING: no odds API key — pick generation will be refused"
  );
}

console.warn("[prod-start-guard] ok");
