/**
 * Twitter/X Automated Posting Handler
 * Called by Manus Heartbeat cron 4x daily (8am, 1pm, 6pm, 9pm PT)
 * Endpoint: POST /api/scheduled/twitter-post
 *
 * Per periodic-updates.md §4a: Project-level Heartbeat (no end-user).
 * Payload includes { slot: "morning" | "afternoon" | "evening" | "night" }
 * to determine which tweet type to generate and post.
 */
import type { Request, Response } from "express";
import {
  postMorningPick,
  postAfternoonAlert,
  postEveningResults,
  postNightPreview,
} from "../services/twitterBot";

type TweetSlot = "morning" | "afternoon" | "evening" | "night";

export async function twitterPostHandler(req: Request, res: Response) {
  const taskUid = req.headers["x-manus-cron-task-uid"] as string || "manual";
  const slot = (req.body?.slot as TweetSlot) || "morning";

  console.log(`[TwitterPost] Triggered — slot: ${slot}, task: ${taskUid}`);

  try {
    let result: { success: boolean; tweetId?: string; error?: string };

    switch (slot) {
      case "morning":
        result = await postMorningPick();
        break;
      case "afternoon":
        result = await postAfternoonAlert();
        break;
      case "evening":
        result = await postEveningResults();
        break;
      case "night":
        result = await postNightPreview();
        break;
      default:
        result = await postMorningPick();
    }

    if (result.success) {
      console.log(`[TwitterPost] Success — slot: ${slot}, tweetId: ${result.tweetId}`);
      res.json({ ok: true, slot, tweetId: result.tweetId });
    } else {
      console.error(`[TwitterPost] Failed — slot: ${slot}, error: ${result.error}`);
      // Return 200 so Heartbeat doesn't retry (tweet failures are not transient)
      res.json({ ok: false, slot, error: result.error });
    }
  } catch (error: any) {
    console.error("[TwitterPost] Unhandled error:", error);
    res.status(500).json({
      error: error.message || "Unknown error",
      stack: error.stack,
      context: { url: req.url, taskUid, slot },
      timestamp: new Date().toISOString(),
    });
  }
}
