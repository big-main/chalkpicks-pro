/**
 * Bot pre-rendering middleware.
 *
 * Serves static HTML snapshots to known search engine crawlers for
 * SEO-critical routes, while regular users continue to receive the SPA.
 * Snapshots are generated at build time by scripts/generate-snapshots.mjs
 * into dist/public/snapshots/.
 */
import { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

const BOT_UA_PATTERN =
  /googlebot|google-inspectiontool|adsbot-google|mediapartners-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|slackbot|telegrambot|whatsapp|pinterestbot|semrushbot|ahrefsbot|mj12bot|screaming frog|gptbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|amazonbot|ccbot/i;

function isBot(req: Request): boolean {
  const ua = req.headers["user-agent"] ?? "";
  return BOT_UA_PATTERN.test(ua);
}

/** Convert a URL path into the snapshot filename, e.g. "/blog/foo" -> "blog__foo.html" */
export function snapshotFileFor(urlPath: string): string {
  const normalized = urlPath.replace(/\/+$/, "").replace(/^\//, "") || "index";
  return normalized.replace(/\//g, "__") + ".html";
}

export function registerPrerender(app: Express) {
  const snapshotsDir =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "..", "dist", "public", "snapshots")
      : path.resolve(import.meta.dirname, "public", "snapshots");

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only handle GET requests for HTML from bots
    if (req.method !== "GET") return next();
    if (!isBot(req)) return next();

    const urlPath = req.path;
    // Never prerender API or asset requests
    if (urlPath.startsWith("/api") || urlPath.includes(".")) return next();

    const file = path.join(snapshotsDir, snapshotFileFor(urlPath));
    if (fs.existsSync(file)) {
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8", "X-Prerendered": "1" }).sendFile(file);
      return;
    }
    next();
  });
}
