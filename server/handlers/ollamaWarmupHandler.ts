/**
 * ollamaWarmupHandler.ts
 * Sends a lightweight ping to the Ollama server every 4 minutes to keep
 * qwen2.5:7b loaded in memory, reducing cold-start latency from ~11s to ~1s.
 *
 * Triggered by Heartbeat: POST /api/scheduled/ollama-warmup
 */
import type { Request, Response } from "express";
import { ENV } from "../_core/env";

export async function ollamaWarmupHandler(_req: Request, res: Response) {
  const ollamaUrl = ENV.ollamaApiUrl || "http://35.237.81.82:11434/v1";
  const model = ENV.ollamaModel || "qwen2.5:7b";

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000); // 20s max

    const response = await fetch(`${ollamaUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const elapsed = Date.now() - start;

    if (response.ok) {
      console.log(`[OllamaWarmup] ${model} is warm — responded in ${elapsed}ms`);
      return res.json({ ok: true, model, elapsed_ms: elapsed });
    } else {
      const text = await response.text().catch(() => "");
      console.warn(`[OllamaWarmup] ${model} returned HTTP ${response.status}: ${text.slice(0, 100)}`);
      return res.json({ ok: false, model, status: response.status, elapsed_ms: elapsed });
    }
  } catch (err: any) {
    const elapsed = Date.now() - start;
    const isTimeout = err?.name === "AbortError";
    console.warn(`[OllamaWarmup] ${model} ${isTimeout ? "timed out" : "failed"} after ${elapsed}ms: ${err?.message}`);
    // Return 200 even on failure — Heartbeat should not retry on model cold-start
    return res.json({ ok: false, model, error: err?.message, elapsed_ms: elapsed });
  }
}
