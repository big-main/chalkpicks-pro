import { z } from "zod/v4";
import { spawn } from "child_process";
import { premiumProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const AGENT_SCRIPT = "/home/ubuntu/antigravity-agents/pick_analysis_agent.py";
const PYTHON_BIN = "/home/ubuntu/antigravity-env/bin/python3";
const AGENT_TIMEOUT_MS = 90_000;

interface PickAnalysisResult {
  summary?: string;
  confidence?: number;
  recommendation?: string;
  keyFactors?: string[];
  error?: string;
}

async function runPickAnalysisAgent(pickData: object): Promise<PickAnalysisResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Agent timed out after 90s"));
    }, AGENT_TIMEOUT_MS);

    const proc = spawn(PYTHON_BIN, [AGENT_SCRIPT], {
      env: {
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
      },
    });

    let stdout = "";
    let stderr = "";
    proc.stdin.write(JSON.stringify(pickData));
    proc.stdin.end();
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`Agent exited ${code}: ${stderr.slice(0, 500)}`));
      }
      try {
        resolve(JSON.parse(stdout) as PickAnalysisResult);
      } catch {
        reject(new Error(`Invalid JSON from agent: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

export const antigravityRouter = router({
  /** Analyze a pick using the Antigravity Gemini agent. Premium only. */
  analyzePick: premiumProcedure
    .input(
      z.object({
        pickId: z.number().optional(),
        sport: z.string().optional(),
        homeTeam: z.string().optional(),
        awayTeam: z.string().optional(),
        line: z.number().optional(),
        odds: z.number().optional(),
        publicBettingPct: z.number().optional(),
        homeElo: z.number().optional(),
        awayElo: z.number().optional(),
        injuryReport: z.string().optional(),
        lineMovement: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // If pickId provided, fetch pick data from DB
        let pickData: object = input;
        if (input.pickId) {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
          const rows = await db.select().from(picks).where(eq(picks.id, input.pickId)).limit(1);
          const pick = rows[0];
          if (!pick) throw new TRPCError({ code: "NOT_FOUND", message: "Pick not found" });
          pickData = {
            sport: pick.sportKey,
            homeTeam: pick.homeTeam ?? "Home",
            awayTeam: pick.awayTeam ?? "Away",
            line: 0,
            odds: pick.odds ?? -110,
            recommendation: pick.recommendation,
            confidence: pick.confidenceScore,
            aiAnalysis: pick.aiAnalysis,
          };
        }
        const result = await runPickAnalysisAgent(pickData);
        const analysisText = result.summary
          ? `${result.summary}\n\nKey Factors: ${(result.keyFactors ?? []).join(", ")}\n\nRecommendation: ${result.recommendation ?? "N/A"}`
          : result.error ?? "Analysis unavailable";
        return { success: !result.error, analysis: analysisText, error: result.error };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Agent failed",
        });
      }
    }),

  /** Health check — verifies the agent script is reachable. */
  healthCheck: publicProcedure.query(async () => {
    const fs = await import("fs/promises");
    try {
      await fs.access(AGENT_SCRIPT);
      return { available: true, script: AGENT_SCRIPT };
    } catch {
      return { available: false, script: AGENT_SCRIPT };
    }
  }),
});
