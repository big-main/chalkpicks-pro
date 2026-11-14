/**
 * Telegram Daily Pick Handler
 * Posts the top daily pick to the configured Telegram channel/chat.
 *
 * Endpoint: POST /api/scheduled/telegram-pick
 * Heartbeat: Daily at 8 AM PT = 15:00 UTC (0 0 15 * * *)
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
// The ChalkPicks Telegram channel chat ID — uses the trading bot's chat ID
// Users can also subscribe via the bot by messaging it
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "2144002777";

function getPTDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 7); // PT = UTC-7 (PDT)
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function getSportEmoji(sportKey: string): string {
  const map: Record<string, string> = {
    americanfootball_nfl: "🏈",
    basketball_nba: "🏀",
    baseball_mlb: "⚾",
    icehockey_nhl: "🏒",
    soccer_epl: "⚽",
    soccer_mls: "⚽",
    mma_mixed_martial_arts: "🥊",
    tennis_atp: "🎾",
    golf_pga: "⛳",
  };
  return map[sportKey] ?? "🎯";
}

function formatOdds(odds: string | number | null): string {
  if (!odds) return "N/A";
  const n = typeof odds === "string" ? parseFloat(odds) : odds;
  if (isNaN(n)) return String(odds);
  return n > 0 ? `+${n}` : String(n);
}

async function sendTelegramMessage(
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${body}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

export async function telegramPickHandler(req: Request, res: Response) {
  const taskUid = (req.headers["x-manus-cron-task-uid"] as string) || "manual";

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "DB unavailable", taskUid });
    }

    const today = getPTDate(0);
    const topPick = await db
      .select()
      .from(picks)
      .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
      .orderBy(desc(picks.confidenceScore))
      .limit(1)
      .then((r: any[]) => r[0]);

    let text: string;

    if (topPick) {
      const emoji = getSportEmoji(topPick.sportKey ?? "");
      const sportName =
        (topPick.sportKey ?? "").split("_")[1]?.toUpperCase() ?? "SPORTS";
      const odds = formatOdds(topPick.odds);
      const confidence = topPick.confidenceScore ?? 0;
      const ev = topPick.edgeScore ?? 0;
      const recommendation = (topPick.recommendation ?? "").slice(0, 300);

      text = [
        `${emoji} <b>FREE DAILY PICK — ${sportName}</b>`,
        ``,
        `<b>${topPick.homeTeam ?? "Home"} vs ${topPick.awayTeam ?? "Away"}</b>`,
        ``,
        `📈 Confidence: <b>${confidence}%</b>`,
        `💰 Odds: <b>${odds}</b>`,
        `⚡ Edge: <b>+${ev.toFixed(1)}%</b>`,
        ``,
        `${recommendation}...`,
        ``,
        `🔗 <a href="https://chalkpicks.pro/picks">View Full Analysis →</a>`,
        ``,
        `<i>ChalkPicks Pro — AI-Powered Sports Betting Analytics</i>`,
      ].join("\n");
    } else {
      text = [
        `🎯 <b>ChalkPicks Daily Update</b>`,
        ``,
        `No picks scheduled for today. Check back tomorrow for our AI-powered analysis.`,
        ``,
        `🔗 <a href="https://chalkpicks.pro">Visit ChalkPicks →</a>`,
      ].join("\n");
    }

    const result = await sendTelegramMessage(text);

    console.warn(
      `[TelegramPick] task=${taskUid} success=${result.success} error=${result.error ?? "none"}`
    );

    if (!result.success) {
      return res.status(500).json({
        ok: false,
        error: result.error,
        taskUid,
      });
    }

    return res.json({ ok: true, taskUid, hasPick: !!topPick });
  } catch (err: any) {
    console.error("[TelegramPick] Error:", err);
    return res.status(500).json({
      error: String(err),
      stack: err?.stack,
      context: { taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
