/**
 * IndexNow integration — instantly notifies participating search engines
 * (Bing, Yandex, Seznam, …) when a URL is published or updated. Bing powers
 * ChatGPT Search, so fast Bing indexation directly feeds AI answer engines.
 *
 * - getIndexNowKey()
 * - pingIndexNow()          → auto-batches + response-code monitoring
 * - registerIndexNowKeyRoute()
 *
 * Key resolves from env INDEXNOW_KEY, falling back to the pre-shipped
 * client/public/chalkpicks2026indexnow.txt value.
 */
import type { Express } from "express";
import { SITE_URL } from "@shared/seo-routes";

const HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
const DEFAULT_KEY = "chalkpicks2026indexnow";
const MAX_BATCH = 100; // Optimal for ChalkPicks volume + IndexNow best practice

/** The IndexNow key: env override, else the pre-shipped static key file's value. */
export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || DEFAULT_KEY;
}

/**
 * Notify IndexNow that the given site-relative paths (or absolute URLs) changed.
 * Fire-and-forget. Auto-chunks into ≤100 URL batches and logs every response code.
 * Never throws, never blocks the caller.
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

    const batches: string[][] = [];
    for (let i = 0; i < urlList.length; i += MAX_BATCH) {
      batches.push(urlList.slice(i, i + MAX_BATCH));
    }

    void (async () => {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: HOST,
              key,
              keyLocation: `${SITE_URL}/${key}.txt`,
              urlList: batch,
            }),
          });

          const status = res.status;
          const label = `batch ${i + 1}/${batches.length} (${batch.length} URLs)`;

          if (status === 200 || status === 202) {
            console.warn(`[IndexNow] SUCCESS ${status} — ${label}`);
          } else {
            let body = "";
            try {
              body = await res.text();
            } catch {
              /* ignore */
            }

            switch (status) {
              case 400:
                console.error(
                  `[IndexNow] 400 Bad Request — ${label} | ${body.slice(0, 180)}`
                );
                break;
              case 403:
                console.error(
                  `[IndexNow] 403 Forbidden — KEY INVALID or keyLocation unreachable. Check /${key}.txt | ${label}`
                );
                break;
              case 422:
                console.error(
                  `[IndexNow] 422 Unprocessable — too many URLs or invalid entries. ${label}`
                );
                break;
              case 429:
                console.warn(
                  `[IndexNow] 429 Rate Limited — back off. ${label}`
                );
                break;
              default:
                console.error(
                  `[IndexNow] Unexpected ${status} — ${label} | ${body.slice(0, 180)}`
                );
            }
          }
        } catch (err) {
          console.warn(
            `[IndexNow] network error batch ${i + 1}:`,
            (err as Error)?.message ?? err
          );
        }

        if (i < batches.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
    })();
  } catch (err) {
    console.warn("[IndexNow] ping skipped:", (err as Error)?.message ?? err);
  }
}

/**
 * Register GET /<key>.txt serving the raw key as text/plain —
 * the ownership proof IndexNow fetches. Must be mounted before the SPA catch-all.
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
