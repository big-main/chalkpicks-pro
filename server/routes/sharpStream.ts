import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  hasSharpApiKey,
  sharpApiRequest,
  SharpApiError,
} from "../services/sharpApiClient";

/** Server-side proxy only: credentials never enter browser URLs or SSE data. */
export async function sharpStreamHandler(req: Request, res: Response) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    // Missing or invalid sessions are handled by the 401 branch below.
  }
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const premium =
    user.role === "admin" ||
    (["daily", "monthly", "yearly"].includes(user.subscriptionTier) &&
      (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date()));
  if (!premium) {
    res
      .status(403)
      .json({ error: "An active premium subscription is required" });
    return;
  }
  if (!hasSharpApiKey()) {
    res.status(503).json({ error: "SharpAPI not configured" });
    return;
  }

  const params = new URLSearchParams();
  for (const name of ["sport", "league", "market", "sportsbook"] as const) {
    if (req.query[name]) params.set(name, String(req.query[name]));
  }
  if (req.query.live) params.set("is_live", String(req.query.live));
  if (!req.query.all) params.set("is_main_line", "true");
  const controller = new AbortController();
  let headerTimedOut = false;
  const headerTimeout = setTimeout(() => {
    headerTimedOut = true;
    controller.abort();
  }, 10_000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const cleanup = () => {
    controller.abort();
    void reader?.cancel().catch(() => {});
  };
  res.on("close", cleanup);
  req.on("aborted", cleanup);
  try {
    const upstream = await sharpApiRequest(`/stream?${params}`, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    });
    clearTimeout(headerTimeout);
    if (!upstream.ok) {
      await upstream.body?.cancel();
      res.status(503).json({
        error:
          "SharpAPI streaming unavailable. Check provider key and streaming add-on.",
        upstreamStatus: upstream.status,
      });
      return;
    }
    if (!upstream.body) {
      res.status(502).json({ error: "SharpAPI returned no stream" });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (!controller.signal.aborted) {
      const { done, value } = await reader.read();
      if (done || controller.signal.aborted) break;
      res.write(decoder.decode(value, { stream: true }));
      if (typeof (res as any).flush === "function") (res as any).flush();
    }
  } catch (error) {
    if (headerTimedOut && !res.headersSent && !res.destroyed) {
      res.status(504).json({ error: "SharpAPI stream connection timed out" });
    } else if (!controller.signal.aborted) {
      if (!res.headersSent)
        res.status(503).json({
          error:
            error instanceof SharpApiError
              ? error.message
              : "SharpAPI stream unavailable",
        });
      else res.write('event: error\ndata: {"error":"Stream disconnected"}\n\n');
    }
  } finally {
    clearTimeout(headerTimeout);
    res.off("close", cleanup);
    req.off("aborted", cleanup);
    controller.abort();
    await reader?.cancel().catch(() => {});
    if (!res.writableEnded && !res.destroyed) res.end();
  }
}
