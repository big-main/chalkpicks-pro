/**
 * Discord Webhook Service — Posts daily picks, alerts, results, and previews
 * Uses Discord Webhook API (native fetch, no discord.js dependency)
 * Rich embed cards with colors, fields, and ChalkPicks branding
 *
 * Called by Heartbeat 4x daily (8am, 1pm, 6pm, 9pm PT) via discordPostHandler.ts
 */
import { getDb } from "../db";
import { picks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { ENV } from "../_core/env";

// Discord embed color palette (decimal)
const COLORS = {
  morning: 0x00ff88,   // Neon green — morning pick
  afternoon: 0xff6b00, // Orange — sharp money alert
  evening: 0x5865f2,   // Discord blurple — results
  night: 0x9b59b6,     // Purple — night preview
  win: 0x00ff88,
  loss: 0xff4444,
};

// --- Helpers ---
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

function getConfidenceBar(score: number | null): string {
  const s = score ?? 0;
  const filled = Math.round(s / 20);
  return "█".repeat(filled) + "░".repeat(5 - filled);
}

function formatOdds(odds: string | number | null): string {
  if (!odds) return "N/A";
  const n = typeof odds === "string" ? parseFloat(odds) : odds;
  if (isNaN(n)) return String(odds);
  return n > 0 ? `+${n}` : String(n);
}

function getPTDate(offsetDays = 0): string {
  const now = new Date();
  const pt = new Date(now.getTime() - 7 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  return pt.toISOString().split("T")[0];
}

// --- Discord Webhook Sender ---
async function sendWebhook(payload: object): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = ENV.discordWebhookUrl;
  if (!webhookUrl) {
    return { success: false, error: "DISCORD_WEBHOOK_URL not configured" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

// ─── Morning Pick Embed (8am PT) ─────────────────────────────────────────────

export async function postMorningPickToDiscord(): Promise<{ success: boolean; error?: string }> {
  const today = getPTDate(0);
  const db = await getDb();

  let embed: object;

  if (db) {
    const topPick = await db
      .select()
      .from(picks)
      .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
      .orderBy(desc(picks.confidenceScore))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (topPick) {
      const emoji = getSportEmoji(topPick.sportKey);
      const bar = getConfidenceBar(topPick.confidenceScore);
      const odds = formatOdds(topPick.odds);
      const sportName = topPick.sportKey.split("_")[1]?.toUpperCase() ?? "SPORTS";

      embed = {
        title: `${emoji} FREE DAILY PICK — ${sportName}`,
        description: `**${topPick.homeTeam ?? "Home"} vs ${topPick.awayTeam ?? "Away"}**\n\n${(topPick.recommendation ?? "").slice(0, 200)}...`,
        color: COLORS.morning,
        fields: [
          { name: "📈 Confidence", value: `${bar} **${topPick.confidenceScore}%**`, inline: true },
          { name: "💰 Odds", value: `**${odds}**`, inline: true },
          { name: "🎯 Pick Type", value: topPick.pickType?.toUpperCase() ?? "MONEYLINE", inline: true },
          { name: "🔓 Full Analysis", value: "[View on ChalkPicks →](https://chalkpicks.live/picks)", inline: false },
        ],
        footer: { text: "ChalkPicks Pro • AI-Powered Sports Analytics • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    } else {
      embed = {
        title: "🎯 FREE DAILY PICK",
        description: "Our AI is analyzing today's slate. The free daily pick drops shortly!\n\n[View all picks →](https://chalkpicks.live/picks)",
        color: COLORS.morning,
        footer: { text: "ChalkPicks Pro • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    embed = {
      title: "🎯 FREE DAILY PICK",
      description: "Today's free pick is live on ChalkPicks!\n\n[View all picks →](https://chalkpicks.live/picks)",
      color: COLORS.morning,
      footer: { text: "ChalkPicks Pro • chalkpicks.live" },
      timestamp: new Date().toISOString(),
    };
  }

  const payload = {
    username: "ChalkPicks Bot",
    embeds: [embed],
  };

  const result = await sendWebhook(payload);
  if (result.success) console.log("[DiscordBot] Morning pick posted successfully");
  else console.error("[DiscordBot] Morning pick failed:", result.error);
  return result;
}

// ─── Afternoon Steam Alert Embed (1pm PT) ────────────────────────────────────

export async function postAfternoonAlertToDiscord(): Promise<{ success: boolean; error?: string }> {
  const today = getPTDate(0);
  const db = await getDb();

  let embed: object;

  if (db) {
    const topEdgePick = await db
      .select()
      .from(picks)
      .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
      .orderBy(desc(picks.edgeScore))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (topEdgePick) {
      const emoji = getSportEmoji(topEdgePick.sportKey);
      const edgeScore = Number(topEdgePick.edgeScore ?? 0);
      const edgeDisplay = edgeScore > 0 ? `+${edgeScore.toFixed(1)}%` : `${edgeScore.toFixed(1)}%`;

      embed = {
        title: `🔥 SHARP MONEY ALERT ${emoji}`,
        description: `**${topEdgePick.homeTeam ?? "Home"} vs ${topEdgePick.awayTeam ?? "Away"}**\n\n${(topEdgePick.recommendation ?? "Sharp action detected on this line.").slice(0, 200)}...`,
        color: COLORS.afternoon,
        fields: [
          { name: "📊 Edge", value: `**${edgeDisplay}**`, inline: true },
          { name: "💰 Odds", value: `**${formatOdds(topEdgePick.odds)}**`, inline: true },
          { name: "⚡ Real-Time Alerts", value: "[Steam Move Tracker →](https://chalkpicks.live/sharp-money)", inline: false },
        ],
        footer: { text: "ChalkPicks Pro • Sharp Money Tracker • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    } else {
      embed = {
        title: "🔥 SHARP MONEY ALERT",
        description: "Our steam move detector is scanning 40+ sportsbooks for line movement.\n\n[Real-time alerts →](https://chalkpicks.live/sharp-money)",
        color: COLORS.afternoon,
        footer: { text: "ChalkPicks Pro • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    embed = {
      title: "🔥 SHARP MONEY ALERT",
      description: "Check the latest sharp money movements on ChalkPicks.\n\n[View alerts →](https://chalkpicks.live/sharp-money)",
      color: COLORS.afternoon,
      footer: { text: "ChalkPicks Pro • chalkpicks.live" },
      timestamp: new Date().toISOString(),
    };
  }

  const payload = {
    username: "ChalkPicks Bot",
    embeds: [embed],
  };

  const result = await sendWebhook(payload);
  if (result.success) console.log("[DiscordBot] Afternoon alert posted successfully");
  else console.error("[DiscordBot] Afternoon alert failed:", result.error);
  return result;
}

// ─── Evening Results Embed (6pm PT) ──────────────────────────────────────────

export async function postEveningResultsToDiscord(): Promise<{ success: boolean; error?: string }> {
  const yesterday = getPTDate(-1);
  const db = await getDb();

  let embed: object;

  if (db) {
    const yesterdayPicks = await db
      .select()
      .from(picks)
      .where(eq(picks.pickDate, yesterday))
      .orderBy(desc(picks.confidenceScore));

    const resolved = yesterdayPicks.filter((p: any) => p.result && p.result !== "pending");
    const wins = resolved.filter((p: any) => p.result === "win").length;
    const losses = resolved.filter((p: any) => p.result === "loss").length;
    const pushes = resolved.filter((p: any) => p.result === "push").length;
    const total = wins + losses + pushes;
    const winRate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

    if (total > 0) {
      const record = `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ""}`;
      const resultEmoji = winRate >= 60 ? "🔥" : winRate >= 50 ? "✅" : "📊";
      const color = winRate >= 60 ? COLORS.win : winRate >= 50 ? COLORS.evening : COLORS.loss;

      const fields: object[] = [];
      if (wins > 0) fields.push({ name: "✅ Wins", value: `**${wins}**`, inline: true });
      if (losses > 0) fields.push({ name: "❌ Losses", value: `**${losses}**`, inline: true });
      if (pushes > 0) fields.push({ name: "➡️ Pushes", value: `**${pushes}**`, inline: true });
      fields.push({ name: "📈 Full History", value: "[Track our record →](https://chalkpicks.live/picks)", inline: false });

      embed = {
        title: `${resultEmoji} YESTERDAY'S RESULTS`,
        description: `**Record: ${record}** (${winRate}% win rate)`,
        color,
        fields,
        footer: { text: "ChalkPicks Pro • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    } else {
      embed = {
        title: "📊 DAILY RESULTS",
        description: "Yesterday's picks are still being graded. Check back soon!\n\n[Track our record →](https://chalkpicks.live/picks)",
        color: COLORS.evening,
        footer: { text: "ChalkPicks Pro • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    embed = {
      title: "📊 DAILY RESULTS",
      description: "Check yesterday's pick results on ChalkPicks.\n\n[View results →](https://chalkpicks.live/picks)",
      color: COLORS.evening,
      footer: { text: "ChalkPicks Pro • chalkpicks.live" },
      timestamp: new Date().toISOString(),
    };
  }

  const payload = {
    username: "ChalkPicks Bot",
    embeds: [embed],
  };

  const result = await sendWebhook(payload);
  if (result.success) console.log("[DiscordBot] Evening results posted successfully");
  else console.error("[DiscordBot] Evening results failed:", result.error);
  return result;
}

// ─── Night Preview Embed (9pm PT) ────────────────────────────────────────────

export async function postNightPreviewToDiscord(): Promise<{ success: boolean; error?: string }> {
  const tomorrow = getPTDate(1);
  const db = await getDb();

  let embed: object;

  if (db) {
    const tomorrowTopPick = await db
      .select()
      .from(picks)
      .where(and(eq(picks.pickDate, tomorrow), eq(picks.isActive, true)))
      .orderBy(desc(picks.confidenceScore))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (tomorrowTopPick) {
      const emoji = getSportEmoji(tomorrowTopPick.sportKey);
      embed = {
        title: `🌙 TOMORROW'S TOP GAME ${emoji}`,
        description: `**${tomorrowTopPick.homeTeam ?? "Home"} vs ${tomorrowTopPick.awayTeam ?? "Away"}**\n\n${(tomorrowTopPick.recommendation ?? "AI analysis coming soon.").slice(0, 200)}...`,
        color: COLORS.night,
        fields: [
          { name: "🎯 Confidence", value: `**${tomorrowTopPick.confidenceScore}%**`, inline: true },
          { name: "💰 Odds", value: `**${formatOdds(tomorrowTopPick.odds)}**`, inline: true },
          { name: "🔓 Full Pick", value: "[Available at 8am PT →](https://chalkpicks.live/picks)", inline: false },
        ],
        footer: { text: "ChalkPicks Pro • Free pick drops at 8am PT • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    } else {
      embed = {
        title: "🌙 TOMORROW'S PREVIEW",
        description: "Our AI is analyzing tomorrow's slate overnight. Free daily pick drops at **8am PT**.\n\n[Get notified →](https://chalkpicks.live)",
        color: COLORS.night,
        footer: { text: "ChalkPicks Pro • chalkpicks.live" },
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    embed = {
      title: "🌙 TOMORROW'S PREVIEW",
      description: "Tomorrow's top pick is being analyzed. Free pick drops at **8am PT**.\n\n[Subscribe for alerts →](https://chalkpicks.live)",
      color: COLORS.night,
      footer: { text: "ChalkPicks Pro • chalkpicks.live" },
      timestamp: new Date().toISOString(),
    };
  }

  const payload = {
    username: "ChalkPicks Bot",
    embeds: [embed],
  };

  const result = await sendWebhook(payload);
  if (result.success) console.log("[DiscordBot] Night preview posted successfully");
  else console.error("[DiscordBot] Night preview failed:", result.error);
  return result;
}
