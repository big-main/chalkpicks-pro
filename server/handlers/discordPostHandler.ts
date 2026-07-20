/**
 * Discord Automated Posting Handler
 * Called by Manus Heartbeat cron 4x daily (8am, 1pm, 6pm, 9pm PT)
 * Endpoint: POST /api/scheduled/discord-post
 *
 * Per periodic-updates.md §4a: Project-level Heartbeat (no end-user).
 * Payload includes { slot: "morning" | "afternoon" | "evening" | "night" }
 * to determine which Discord embed to generate and post.
 */
import type { Request, Response } from "express";
import {
  postMorningPickToDiscord,
  postAfternoonAlertToDiscord,
  postEveningResultsToDiscord,
  postNightPreviewToDiscord,
} from "../services/discordBot";

type DiscordSlot = "morning" | "afternoon" | "evening" | "night";

export async function discordPostHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";
  const slot = (req.body?.slot as DiscordSlot) || "morning";

  console.log(`[DiscordPost] Triggered — slot: ${slot}, task: ${taskUid}`);

  try {
    let result: { success: boolean; error?: string };

    switch (slot) {
      case "morning":
        result = await postMorningPickToDiscord();
        break;
      case "afternoon":
        result = await postAfternoonAlertToDiscord();
        break;
      case "evening":
        result = await postEveningResultsToDiscord();
        break;
      case "night":
        result = await postNightPreviewToDiscord();
        break;
      default:
        result = await postMorningPickToDiscord();
    }

    if (result.success) {
      console.log(`[DiscordPost] Success — slot: ${slot}`);
      res.json({ ok: true, slot });
    } else {
      console.error(`[DiscordPost] Failed — slot: ${slot}, error: ${result.error}`);
      // Return 200 so Heartbeat doesn't retry (webhook failures are not transient)
      res.json({ ok: false, slot, error: result.error });
    }
  } catch (error: any) {
    console.error("[DiscordPost] Unhandled error:", error);
    res.status(500).json({
      error: error.message || "Unknown error",
      stack: error.stack,
      context: { url: req.url, taskUid, slot },
      timestamp: new Date().toISOString(),
    });
  }
}
