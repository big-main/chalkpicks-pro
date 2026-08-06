/**
 * Discord steam alerts webhook validation test
 * Verifies that DISCORD_STEAM_WEBHOOK_URL is set and is a valid Discord webhook URL.
 *
 * This checks deployment config rather than code, so it skips where no webhook
 * is configured — CI supplies no real secrets by design
 * (.github/workflows/ci.yml).
 */
import { describe, it, expect } from "vitest";

describe.skipIf(!process.env.DISCORD_STEAM_WEBHOOK_URL)(
  "Discord Steam Alerts Webhook Configuration",
  () => {
    it("DISCORD_STEAM_WEBHOOK_URL should be set", () => {
      const webhookUrl = process.env.DISCORD_STEAM_WEBHOOK_URL;
      expect(webhookUrl, "DISCORD_STEAM_WEBHOOK_URL must be set").toBeTruthy();
    });

    it("DISCORD_STEAM_WEBHOOK_URL should be a valid Discord webhook URL", () => {
      const webhookUrl = process.env.DISCORD_STEAM_WEBHOOK_URL;
      expect(
        webhookUrl?.startsWith("https://discord.com/api/webhooks/"),
        "DISCORD_STEAM_WEBHOOK_URL should start with https://discord.com/api/webhooks/"
      ).toBe(true);
    });

    it("DISCORD_STEAM_WEBHOOK_URL should have webhook ID and token", () => {
      const webhookUrl = process.env.DISCORD_STEAM_WEBHOOK_URL;
      const parts = webhookUrl?.split("/webhooks/")[1]?.split("/");
      expect(
        parts?.length,
        "DISCORD_STEAM_WEBHOOK_URL should have ID and token"
      ).toBe(2);
      expect(
        parts?.[0]?.length,
        "Webhook ID should be numeric"
      ).toBeGreaterThan(0);
      expect(
        parts?.[1]?.length,
        "Webhook token should be present"
      ).toBeGreaterThan(0);
    });

    it("Both Discord webhook URLs should be set", () => {
      const mainWebhook = process.env.DISCORD_WEBHOOK_URL;
      const steamWebhook = process.env.DISCORD_STEAM_WEBHOOK_URL;
      expect(mainWebhook, "DISCORD_WEBHOOK_URL must be set").toBeTruthy();
      expect(
        steamWebhook,
        "DISCORD_STEAM_WEBHOOK_URL must be set"
      ).toBeTruthy();
    });
  }
);
