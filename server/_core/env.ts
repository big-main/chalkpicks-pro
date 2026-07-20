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
  // OpenRouter — GPT-4o-mini fallback when Qwen is down or JSON schema needed
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterApiUrl: "https://openrouter.ai/api/v1/chat/completions",
  openRouterModel: "openai/gpt-4o-mini",
  // OddsHarvester API on Cloud Computer — OddsPortal scraper for supplemental odds
  oddsHarvesterApiUrl: process.env.ODDSHARVESTER_API_URL ?? "http://35.237.81.82:8090",
  // Twitter/X API — OAuth 1.0a for automated posting (@chalkpickspro)
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY ?? "",
  twitterConsumerSecret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
  twitterAccessSecret: process.env.TWITTER_ACCESS_SECRET ?? "",
};
