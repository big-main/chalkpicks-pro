import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
  replyMarkup?: any;
}

export async function sendTelegramMessage(message: TelegramMessage) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: message.chatId,
      text: message.text,
      parse_mode: message.parseMode || "HTML",
      reply_markup: message.replyMarkup,
    });

    return response.status === 200;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

export async function sendPickAlert(chatId: string, pick: any) {
  const text = `
🎯 <b>New Pick Alert!</b>

<b>${pick.sport}</b> - ${pick.league}
<b>Pick:</b> ${pick.pick}
<b>Odds:</b> ${pick.odds}
<b>Confidence:</b> ${pick.confidence}%
<b>+EV:</b> ${pick.ev}%

<a href="https://chalkpicks.live/picks/${pick.id}">View Full Analysis →</a>
  `.trim();

  return sendTelegramMessage({
    chatId,
    text,
    parseMode: "HTML",
  });
}

export async function sendWinAlert(chatId: string, result: any) {
  const text = `
✅ <b>Pick Won!</b>

<b>${result.pick}</b>
<b>Payout:</b> +${result.payout}
<b>ROI:</b> +${result.roi}%

Great job! Keep the streak going! 🔥
  `.trim();

  return sendTelegramMessage({
    chatId,
    text,
    parseMode: "HTML",
  });
}

export async function sendSteamAlert(chatId: string, steam: any) {
  const text = `
🚨 <b>Steam Move Detected!</b>

<b>${steam.sport}</b> - ${steam.matchup}
<b>Line Movement:</b> ${steam.movement}
<b>Volume:</b> ${steam.volume}x normal
<b>Direction:</b> ${steam.direction}

<a href="https://chalkpicks.live/tools/line-movement">Check Line Movement Tool →</a>
  `.trim();

  return sendTelegramMessage({
    chatId,
    text,
    parseMode: "HTML",
  });
}

export async function sendLeaderboardUpdate(chatId: string, rank: number, prize: number) {
  const text = `
🏆 <b>Leaderboard Update!</b>

You're now ranked <b>#${rank}</b> on the live leaderboard!
<b>Weekly Prize:</b> $${prize}

Keep winning! 💪
  `.trim();

  return sendTelegramMessage({
    chatId,
    text,
    parseMode: "HTML",
  });
}
