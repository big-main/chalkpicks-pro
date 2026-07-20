/**
 * ChalkPicks Discord Bot
 *
 * Posts to two channels:
 *   #free-daily-pick  — one free pick per day for everyone (retention + word-of-mouth)
 *   #steam-alerts     — real-time steam move alerts (sharp money signals)
 *
 * Setup:
 *   1. Create a Discord application at https://discord.com/developers/applications
 *   2. Add a Bot user, copy the token → DISCORD_BOT_TOKEN env var
 *   3. Invite the bot with permissions: Send Messages, Embed Links, Use External Emojis
 *   4. Copy channel IDs (right-click channel → Copy Channel ID) →
 *        DISCORD_FREE_PICKS_CHANNEL_ID
 *        DISCORD_STEAM_ALERTS_CHANNEL_ID
 */
import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from "discord.js";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const FREE_PICKS_CHANNEL_ID = process.env.DISCORD_FREE_PICKS_CHANNEL_ID;
const STEAM_ALERTS_CHANNEL_ID = process.env.DISCORD_STEAM_ALERTS_CHANNEL_ID;

let client: Client | null = null;
let isReady = false;

// ─── Bot Initialization ───────────────────────────────────────────────────────

export async function initDiscordBot(): Promise<void> {
  if (!DISCORD_BOT_TOKEN) {
    console.log("[Discord] DISCORD_BOT_TOKEN not set — bot disabled");
    return;
  }

  try {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once("ready", (c) => {
      isReady = true;
      console.log(`[Discord] Bot ready — logged in as ${c.user.tag}`);
    });

    client.on("error", (err) => {
      console.error("[Discord] Client error:", err.message);
    });

    await client.login(DISCORD_BOT_TOKEN);
    // Wait up to 10s for ready event
    await new Promise<void>((resolve) => {
      if (isReady) return resolve();
      const timeout = setTimeout(() => resolve(), 10000);
      client!.once("ready", () => { clearTimeout(timeout); resolve(); });
    });
  } catch (err) {
    console.error("[Discord] Failed to initialize bot:", err);
    client = null;
  }
}

async function getChannel(channelId: string): Promise<TextChannel | null> {
  if (!client || !isReady || !channelId) return null;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel instanceof TextChannel) return channel;
    return null;
  } catch {
    return null;
  }
}

// ─── Free Daily Pick Post ─────────────────────────────────────────────────────

export interface DiscordPickPayload {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  pickType: string;
  recommendation: string;
  confidence: number;
  odds?: string;
  analysis?: string;
  pickId?: number;
}

export async function postFreeDailyPick(pick: DiscordPickPayload): Promise<boolean> {
  if (!FREE_PICKS_CHANNEL_ID) {
    console.log("[Discord] FREE_PICKS_CHANNEL_ID not set — skipping daily pick post");
    return false;
  }

  const channel = await getChannel(FREE_PICKS_CHANNEL_ID);
  if (!channel) {
    console.warn("[Discord] Could not fetch #free-daily-pick channel");
    return false;
  }

  const sportEmoji: Record<string, string> = {
    nfl: "🏈", nba: "🏀", mlb: "⚾", nhl: "🏒",
    ncaaf: "🏈", ncaab: "🏀", mma: "🥊", soccer: "⚽",
  };
  const emoji = sportEmoji[pick.sport?.toLowerCase()] ?? "🎯";
  const confidenceBar = "█".repeat(Math.round(pick.confidence / 10)) + "░".repeat(10 - Math.round(pick.confidence / 10));
  const confidenceColor = pick.confidence >= 80 ? 0x39ff14 : pick.confidence >= 65 ? 0xd4a017 : 0x888888;

  const embed = new EmbedBuilder()
    .setColor(confidenceColor)
    .setTitle(`${emoji} FREE DAILY PICK — ${pick.sport.toUpperCase()}`)
    .setDescription(`**${pick.awayTeam} @ ${pick.homeTeam}**`)
    .addFields(
      { name: "📋 Pick", value: `\`${pick.recommendation}\``, inline: true },
      { name: "📊 Type", value: pick.pickType.replace("_", " ").toUpperCase(), inline: true },
      { name: "💯 Confidence", value: `${pick.confidence}%\n\`${confidenceBar}\``, inline: false },
    );

  if (pick.odds) {
    embed.addFields({ name: "💰 Odds", value: pick.odds, inline: true });
  }

  if (pick.analysis) {
    const shortAnalysis = pick.analysis.length > 300
      ? pick.analysis.substring(0, 297) + "..."
      : pick.analysis;
    embed.addFields({ name: "🧠 AI Analysis", value: shortAnalysis, inline: false });
  }

  embed
    .addFields({
      name: "🔒 Want ALL picks + Arb Finder + Steam Alerts?",
      value: "[**Upgrade to ChalkPicks Pro →**](https://chalkpicks.live/pricing)",
      inline: false,
    })
    .setFooter({ text: "ChalkPicks Pro • AI-Powered Sports Betting Analytics" })
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
    console.log(`[Discord] Posted free daily pick: ${pick.recommendation} (${pick.sport})`);
    return true;
  } catch (err) {
    console.error("[Discord] Failed to post daily pick:", err);
    return false;
  }
}

// ─── Steam Move Alert ─────────────────────────────────────────────────────────

export interface DiscordSteamAlertPayload {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  lineMove: string;        // e.g. "-3 → -5.5"
  percentageMove: number;  // e.g. 8.3
  bookmaker: string;
  sharpSide: string;       // e.g. "Chiefs -5.5"
  severity: "low" | "medium" | "high" | "extreme";
}

export async function postSteamAlert(alert: DiscordSteamAlertPayload): Promise<boolean> {
  if (!STEAM_ALERTS_CHANNEL_ID) {
    console.log("[Discord] STEAM_ALERTS_CHANNEL_ID not set — skipping steam alert");
    return false;
  }

  const channel = await getChannel(STEAM_ALERTS_CHANNEL_ID);
  if (!channel) {
    console.warn("[Discord] Could not fetch #steam-alerts channel");
    return false;
  }

  const severityConfig = {
    low:     { emoji: "🟡", color: 0xd4a017, label: "MILD STEAM" },
    medium:  { emoji: "🟠", color: 0xff6b00, label: "STEAM MOVE" },
    high:    { emoji: "🔴", color: 0xff2222, label: "SHARP STEAM" },
    extreme: { emoji: "🚨", color: 0xff0000, label: "EXTREME STEAM" },
  };
  const cfg = severityConfig[alert.severity];

  const sportEmoji: Record<string, string> = {
    nfl: "🏈", nba: "🏀", mlb: "⚾", nhl: "🏒",
    ncaaf: "🏈", ncaab: "🏀", mma: "🥊", soccer: "⚽",
  };
  const sEmoji = sportEmoji[alert.sport?.toLowerCase()] ?? "🎯";

  const embed = new EmbedBuilder()
    .setColor(cfg.color)
    .setTitle(`${cfg.emoji} ${cfg.label} DETECTED — ${sEmoji} ${alert.sport.toUpperCase()}`)
    .setDescription(`**${alert.awayTeam} @ ${alert.homeTeam}**`)
    .addFields(
      { name: "📈 Line Move", value: `\`${alert.lineMove}\``, inline: true },
      { name: "⚡ Move Size", value: `${alert.percentageMove.toFixed(1)}%`, inline: true },
      { name: "🏦 Book", value: alert.bookmaker, inline: true },
      { name: "🎯 Sharp Side", value: `**${alert.sharpSide}**`, inline: false },
      { name: "📊 Market", value: alert.market.replace("_", " ").toUpperCase(), inline: true },
    )
    .addFields({
      name: "🔒 Full Steam Analysis + CLV Tracker",
      value: "[**ChalkPicks Pro →**](https://chalkpicks.live/sharp-money)",
      inline: false,
    })
    .setFooter({ text: "ChalkPicks Pro • Sharp Money Intelligence" })
    .setTimestamp();

  try {
    // For extreme steam, ping @everyone
    const content = alert.severity === "extreme" ? "@everyone 🚨 EXTREME STEAM DETECTED!" : undefined;
    await channel.send({ content, embeds: [embed] });
    console.log(`[Discord] Posted ${cfg.label} for ${alert.awayTeam} @ ${alert.homeTeam}`);
    return true;
  } catch (err) {
    console.error("[Discord] Failed to post steam alert:", err);
    return false;
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export async function destroyDiscordBot(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    isReady = false;
    console.log("[Discord] Bot disconnected");
  }
}
