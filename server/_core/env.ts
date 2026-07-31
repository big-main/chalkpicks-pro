/**
 * Environment configuration.
 * Production: missing critical secrets throw at assertProductionSecrets().
 * Never ship hard-coded internal IPs as defaults.
 */
export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  // LLM — require env in production; empty default avoids leaking infra
  ollamaApiUrl: process.env.OLLAMA_API_URL ?? "",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  xaiApiKey: process.env.XAI_API_KEY ?? "",
  xaiApiUrl: "https://api.x.ai/v1/chat/completions",
  xaiModel: "grok-4",
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterApiUrl: "https://openrouter.ai/api/v1/chat/completions",
  openRouterModel: "openai/gpt-4o-mini",
  oddsHarvesterApiUrl: process.env.ODDSHARVESTER_API_URL ?? "",
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY ?? "",
  twitterConsumerSecret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
  twitterAccessSecret: process.env.TWITTER_ACCESS_SECRET ?? "",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
  discordSteamWebhookUrl: process.env.DISCORD_STEAM_WEBHOOK_URL ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "2144002777",
  n8nDripWebhookUrl: process.env.N8N_DRIP_WEBHOOK_URL ?? "",
  n8nPicksWebhookUrl: process.env.N8N_PICKS_WEBHOOK_URL ?? "",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET ?? "",
  railwayApiToken: process.env.RAILWAY_API_TOKEN ?? "",
  sharpApiKey: process.env.SHARPAPI_KEY ?? "",
  hasOddsApiKey: Boolean(
    process.env.SHARPAPI_KEY ||
      process.env.ODDS_API_KEY ||
      process.env.ODDS_API_IO_KEY
  ),
  pageSpeedApiKey: process.env.PAGESPEED_API_KEY ?? "",
};

/** Call once at boot. Fails hard in production if critical secrets missing. */
export function assertProductionSecrets(): void {
  if (!ENV.isProduction) return;

  const missing: string[] = [];
  if (!ENV.cookieSecret || ENV.cookieSecret.length < 32) {
    missing.push("JWT_SECRET (min 32 chars)");
  }
  if (!ENV.databaseUrl) {
    missing.push("DATABASE_URL");
  }
  if (!ENV.hasOddsApiKey) {
    // Warn loud but do not crash web process — scheduler will refuse pick gen
    console.error(
      "[ENV] PRODUCTION WARNING: ODDS_API_KEY / ODDS_API_IO_KEY missing — pick generation will be refused"
    );
  }
  if (missing.length > 0) {
    throw new Error(
      `[ENV] Production requires: ${missing.join(", ")}. Refusing to start.`
    );
  }
}
