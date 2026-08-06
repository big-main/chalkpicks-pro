/**
 * SharpAPI Real-Time Odds Stream Proxy
 *
 * Proxies the SharpAPI SSE stream to authenticated frontend clients.
 * - Requires valid session cookie (protects the API key)
 * - Forwards SSE events: connected, snapshot, update, heartbeat
 * - Supports optional sport/league filter via query params
 *
 * Usage: GET /api/sharp/stream?sport=mlb&market=main
 */
import { Request, Response } from "express";
import { sdk } from "../_core/sdk";

const SHARPAPI_KEY = process.env.SHARPAPI_KEY || "";
const SHARPAPI_STREAM_URL = "https://api.sharpapi.io/api/v1/stream";

export async function sharpStreamHandler(req: Request, res: Response) {
  // Require authenticated user (protects the API key)
  let user = null;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {}

  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!SHARPAPI_KEY) {
    res.status(503).json({ error: "SharpAPI not configured" });
    return;
  }

  // Build upstream URL with optional filters
  const params = new URLSearchParams();
  if (req.query.sport) params.set("sport", String(req.query.sport));
  if (req.query.league) params.set("league", String(req.query.league));
  if (req.query.market) params.set("market", String(req.query.market));
  if (req.query.sportsbook)
    params.set("sportsbook", String(req.query.sportsbook));
  if (req.query.live) params.set("live", String(req.query.live));
  // Only stream main lines by default to reduce bandwidth
  if (!req.query.all) params.set("is_main_line", "true");

  const upstreamUrl = `${SHARPAPI_STREAM_URL}?${params}`;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  const upstreamRes: Response | null = null;
  let aborted = false;

  const cleanup = () => {
    aborted = true;
  };

  req.on("close", cleanup);
  req.on("aborted", cleanup);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "X-API-Key": SHARPAPI_KEY,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (!upstream.ok) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ status: upstream.status })}\n\n`
      );
      res.end();
      return;
    }

    if (!upstream.body) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "No stream body" })}\n\n`
      );
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    // Stream chunks from SharpAPI → client
    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      if (aborted) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      // Flush if possible
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    }

    reader.cancel();
  } catch (err) {
    if (!aborted) {
      console.warn("[SharpStream] Proxy error:", (err as Error).message);
      try {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: "Stream disconnected" })}\n\n`
        );
      } catch {}
    }
  } finally {
    try {
      res.end();
    } catch {}
  }
}
