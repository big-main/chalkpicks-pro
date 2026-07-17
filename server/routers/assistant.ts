import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM, type Message } from "../_core/llm";

/**
 * ChalkPicks Assistant — the mini AI chat helper on the site.
 *
 * Public but tightly bounded: short history, small responses, per-IP rate
 * limiting, and a system prompt that keeps it on ChalkPicks topics with
 * responsible-gambling guardrails. Uses invokeLLM's normal provider chain
 * (local Ollama for cheap/fast when healthy, hosted model as fallback).
 */

const SYSTEM_PROMPT = `You are ChalkPal, the friendly in-site assistant for ChalkPicks (chalkpicks.live), an AI-powered sports betting ANALYTICS platform.

What you help with:
- Explaining ChalkPicks tools: AI Picks (/picks), +EV Finder (/ev-finder), Arbitrage Finder (/arbitrage), Odds Comparison (/odds-comparison), Line Movement (/line-movement), CLV Tracker (/clv-tracker), Parlay Builder (/parlay-builder), Bankroll Tracker (/bankroll-tracker), free calculators under /tools and /bet-calculator.
- Explaining betting concepts simply: expected value (EV), no-vig/fair odds, closing line value (CLV), Kelly criterion, arbitrage, steam moves, implied probability, vig/hold.
- Plans & pricing: Basic $9.99/mo, Pro $19.99/mo, Elite $59.99/yr — every plan starts with a 3-day free trial (card required, cancel anytime before it ends). Signup at /signup, plans at /pricing.
- Navigating the site and troubleshooting basics (login, trial, billing portal under account settings).

Hard rules:
- You are NOT a tipster. Never promise profit, never claim specific win rates, never present any bet as a sure thing. ChalkPicks provides analytics and education; all betting involves risk.
- No financial, legal, or tax advice.
- Responsible gambling: users must be 21+. If someone mentions problem gambling, losses they can't afford, or chasing losses, respond with care and share the helpline 1-800-GAMBLER before anything else.
- Stay on ChalkPicks and sports-betting-education topics. For anything else, politely redirect.
- Be concise: 2-5 short sentences unless the user asks for detail. Link site paths like /pricing when helpful.`;

// ── Per-IP sliding-window rate limit (in-memory; resets on restart) ─────────
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const list = (hits.get(ip) ?? []).filter(t => t > windowStart);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > 5000) {
    hits.forEach((times: number[], key: string) => {
      if (times.every(t => t <= windowStart)) hits.delete(key);
    });
  }
  return true;
}

const chatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000),
});

export const assistantRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        // Client sends the visible history; we keep only the last 8 turns.
        messages: z.array(chatMessage).min(1).max(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket?.remoteAddress ||
        "unknown";
      if (!rateLimit(ip)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Slow down a little — try again in a minute.",
        });
      }

      const history = input.messages.slice(-8);
      const messages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map(m => ({ role: m.role, content: m.content })),
      ];

      try {
        const result = await invokeLLM({
          messages,
          maxTokens: 400,
          complexity: "medium",
        });
        const content = result.choices[0]?.message?.content;
        const reply =
          typeof content === "string"
            ? content
            : content
                ?.map(part => ("text" in part ? part.text : ""))
                .join("") ?? "";
        if (!reply.trim()) throw new Error("empty completion");
        return { reply: reply.trim() };
      } catch (err) {
        console.error("[Assistant] LLM error:", (err as Error).message);
        return {
          reply:
            "I'm having trouble thinking right now. Meanwhile: today's picks are at /picks, tools are at /tools, and plans (with a 3-day free trial) are at /pricing.",
        };
      }
    }),
});
