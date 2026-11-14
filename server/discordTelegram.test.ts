import { describe, it, expect } from "vitest";

describe("Discord & Telegram Secrets Validation", () => {
  it.skipIf(!process.env.DISCORD_WEBHOOK_URL)(
    "DISCORD_WEBHOOK_URL is set and looks like a Discord webhook",
    () => {
      const url = process.env.DISCORD_WEBHOOK_URL ?? "";
      expect(url.length).toBeGreaterThan(0);
      // Discord webhooks are either discord.com or discordapp.com URLs
      expect(/discord(app)?\.com\/api\/webhooks\//.test(url)).toBe(true);
    }
  );

  it.skipIf(!process.env.DISCORD_STEAM_WEBHOOK_URL)(
    "DISCORD_STEAM_WEBHOOK_URL is set and looks like a Discord webhook",
    () => {
      const url = process.env.DISCORD_STEAM_WEBHOOK_URL ?? "";
      expect(url.length).toBeGreaterThan(0);
      expect(/discord(app)?\.com\/api\/webhooks\//.test(url)).toBe(true);
    }
  );

  it.skipIf(!process.env.TELEGRAM_BOT_TOKEN)(
    "TELEGRAM_BOT_TOKEN is set and has correct format",
    () => {
      const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
      expect(token.length).toBeGreaterThan(0);
      // Telegram bot tokens look like: 1234567890:ABCdef...
      expect(token).toMatch(/^\d+:[A-Za-z0-9_-]+$/);
    }
  );

  for (const name of [
    "DISCORD_WEBHOOK_URL",
    "DISCORD_STEAM_WEBHOOK_URL",
  ] as const) {
    it.skipIf(!process.env[name])(
      `can reach ${name} (live API check)`,
      async () => {
        const url = process.env[name] ?? "";
        // GET the webhook info (no auth needed, returns webhook metadata)
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(12_000),
        });
        // Discord returns 200 with webhook info for valid webhooks
        expect(res.status, `${name}: HTTP ${res.status}`).toBe(200);
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("id");
        expect(data).toHaveProperty("channel_id");
      },
      15_000
    );
  }

  it.skipIf(!process.env.TELEGRAM_BOT_TOKEN)(
    "can reach Telegram bot API (live API check)",
    async () => {
      const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
      if (!token) return; // skip if not set
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.result).toHaveProperty("username");
    }
  );
});
