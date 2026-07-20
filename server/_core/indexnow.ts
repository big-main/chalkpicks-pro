/**
 * IndexNow integration — instantly notifies participating search engines
 * (Bing, Yandex, Seznam, …) when a URL is published or updated. Bing powers
 * ChatGPT Search, so fast Bing indexation directly feeds AI answer engines.
 *
 * Two pieces:
 *   - getIndexNowKey()  — the key we advertise and sign pings with.
 *   - pingIndexNow()    — fire-and-forget POST to api.indexnow.org. Never throws,
 *                         never blocks the caller (used from the publish flow).
 *   - registerIndexNowKeyRoute() — serves GET /<key>.txt with the raw key, which
 *                         is how IndexNow verifies ownership of the key.
 *
 * The key resolves from env INDEXNOW_KEY, falling back to the value already
 * shipped as client/public/chalkpicks2026indexnow.txt so this works out of the
 * box without new configuration.
 */
import type { Express } from "express";
import { SITE_URL } from "@shared/seo-routes";

const HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
const DEFAULT_KEY = "chalkpicks2026indexnow";

/** The IndexNow key: env override, else the pre-shipped static key file's value. */
export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || DEFAULT_KEY;
}

/**
 * Notify IndexNow that the given site-relative paths (or absolute URLs) changed.
 * Fire-and-forget: resolves immediately, swallows every error, never throws.
 */
export function pingIndexNow(paths: string[]): void {
  try {
    const key = getIndexNowKey();
    if (!key) return;

    const urlList = paths
      .filter(Boolean)
      .map(p =>
        /^https?:\/\//.test(p)
          ? p
          : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`
      );
    if (urlList.length === 0) return;

    // Intentionally not awaited — publishing must never block on this.
    void fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
    })
      .then(res => {
        console.log(
          `[IndexNow] pinged ${urlList.length} URL(s) → ${res.status}`
        );
      })
      .catch(err => {
        console.warn("[IndexNow] ping failed:", err?.message ?? err);
      });
  } catch (err) {
    // Resolving the key / building the body should never break the caller.
    console.warn("[IndexNow] ping skipped:", (err as Error)?.message ?? err);
  }
}

/**
 * Register GET /<key>.txt serving the raw key as text/plain — the ownership
 * proof IndexNow fetches. Must be mounted before the SPA catch-all.
 */
export function registerIndexNowKeyRoute(app: Express): void {
  const key = getIndexNowKey();
  if (!key) return;
  app.get(`/${key}.txt`, (_req, res) => {
    res.set("Content-Type", "text/plain");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(key);
  });
}
