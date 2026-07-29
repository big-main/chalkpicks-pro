import { z } from "zod";
import { spawn } from "child_process";
import { premiumProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const AGENT_SCRIPT = "/home/ubuntu/antigravity-agents/pick_analysis_agent.py";
const PYTHON_BIN = "/home/ubuntu/antigravity-env/bin/python3";
const AGENT_TIMEOUT_MS = 90_000;

async function runPickAnalysisAgent(pickData: object): Promise<object> {
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
        resolve(JSON.parse(stdout));
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
        sport: z.string(),
        homeTeam: z.string(),
        awayTeam: z.string(),
        line: z.number(),
        odds: z.number(),
        publicBettingPct: z.number().optional(),
        homeElo: z.number().optional(),
        awayElo: z.number().optional(),
        injuryReport: z.string().optional(),
        lineMovement: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await runPickAnalysisAgent(input);
        return { success: true, analysis };
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
