export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  // Qwen2.5 7B on Cloud Computer (35.237.81.82) — free local inference
  ollamaApiUrl: process.env.OLLAMA_API_URL ?? "http://35.237.81.82:11434/v1",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  // xAI Grok-4 — high-complexity reasoning for strategy-builder and pick analysis
  xaiApiKey: process.env.XAI_API_KEY ?? "",
  xaiApiUrl: "https://api.x.ai/v1/chat/completions",
  xaiModel: "grok-4",
  // OpenRouter — GPT-4o-mini fallback when Qwen is down or JSON schema needed
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterApiUrl: "https://openrouter.ai/api/v1/chat/completions",
  openRouterModel: "openai/gpt-4o-mini",
  // OddsHarvester API on Cloud Computer — OddsPortal scraper for supplemental odds
  oddsHarvesterApiUrl:
    process.env.ODDSHARVESTER_API_URL ?? "http://35.237.81.82:8090",
  // Twitter/X API — OAuth 1.0a for automated posting (@chalkpickspro)
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY ?? "",
  twitterConsumerSecret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
  twitterAccessSecret: process.env.TWITTER_ACCESS_SECRET ?? "",
  // Discord Webhook — automated daily picks/alerts/results/previews
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
  // n8n Email Drip Webhook — fires on new user registration (Day 0/1/3/7 sequence)
  n8nDripWebhookUrl: process.env.N8N_DRIP_WEBHOOK_URL ?? "",
  // n8n AI Pick Analyzer Webhook — fires when a new pick is created (triggers AI analysis workflow)
  n8nPicksWebhookUrl: process.env.N8N_PICKS_WEBHOOK_URL ?? "",
  // Shared secret for n8n → ChalkPicks API calls (validates incoming n8n requests)
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET ?? "",
  // Railway API token — full access for deploy management
  railwayApiToken: process.env.RAILWAY_API_TOKEN ?? "",
};
