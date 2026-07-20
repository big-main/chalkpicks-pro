/**
 * cloudSyncHandler.ts
 * Nightly Cloud Computer auto-sync handler.
 *
 * Triggered by Heartbeat at 07:00 UTC (midnight PT) every day.
 * SSHes into the Cloud Computer (35.237.81.82) and runs:
 *   git pull → pnpm install --frozen-lockfile → pnpm build → pm2 restart
 *
 * This keeps the production mirror in sync with GitHub without manual SSH.
 * Endpoint: POST /api/scheduled/cloud-sync
 */
import type { Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CLOUD_IP = "35.237.81.82";
const CLOUD_USER = "ubuntu";
const CLOUD_PROJECT = "/home/ubuntu/chalkpicks-prod";

export async function cloudSyncHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  console.log(`[CloudSync] Nightly sync triggered — task: ${taskUid}`);

  const deployScript = [
    `cd ${CLOUD_PROJECT}`,
    "git pull origin main 2>&1 | tail -5",
    "pnpm install --frozen-lockfile 2>&1 | tail -3",
    "pnpm run build 2>&1 | tail -5",
    "pm2 restart chalkpicks-prod 2>&1 | tail -5",
    "pm2 list 2>&1 | grep chalkpicks-prod",
  ].join(" && ");

  try {
    const { stdout, stderr } = await execAsync(
      `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o BatchMode=yes ${CLOUD_USER}@${CLOUD_IP} '${deployScript}'`,
      { timeout: 100_000 } // 100s — build can take ~25s
    );

    const output = (stdout + (stderr ? `\nSTDERR: ${stderr}` : "")).trim();
    console.log(`[CloudSync] Deploy complete:\n${output.slice(-800)}`);

    return res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      output: output.slice(-1000),
    });
  } catch (err: any) {
    const output = (err.stdout ?? "") + (err.stderr ? `\nSTDERR: ${err.stderr}` : "");
    console.error(`[CloudSync] Deploy failed: ${err.message}\n${output.slice(-500)}`);
    return res.status(500).json({
      error: err.message,
      output: output.slice(-500),
      context: { url: req.url, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
