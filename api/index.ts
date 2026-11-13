import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

let initialization: ReturnType<typeof createApp> | undefined;

/** Reuse the existing application and session guards within a warm Function. */
export default async function handler(req: Request, res: Response) {
  try {
    initialization ??= createApp({ serverless: true });
    const { app } = await initialization;
    app(req, res);
  } catch (error) {
    initialization = undefined;
    console.error("[Vercel] Backend initialization failed", error);
    res.status(503).json({ error: "Backend temporarily unavailable" });
  }
}
