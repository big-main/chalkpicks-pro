import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/_core/app";

let initialization: ReturnType<typeof createApp> | undefined;

/** Reuse the existing application and session guards within a warm Function. */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    initialization ??= createApp({ serverless: true });
    const { app } = await initialization;
    app(req, res);
  } catch (error) {
    initialization = undefined;
    console.error("[Vercel] Backend initialization failed", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Backend temporarily unavailable" }));
  }
}
