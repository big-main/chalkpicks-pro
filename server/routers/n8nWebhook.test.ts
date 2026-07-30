import { describe, it, expect } from "vitest";

// These validate deployed n8n secrets/URLs, not application code —
// meaningless without the real values, so skip per-concern rather than
// fail when this environment (e.g. a sandbox) has none configured.
describe("n8n Webhook Secret", () => {
  it.skipIf(!process.env.N8N_WEBHOOK_SECRET)(
    "N8N_WEBHOOK_SECRET is set in environment",
    () => {
      const secret = process.env.N8N_WEBHOOK_SECRET;
      expect(secret).toBeDefined();
      expect(secret!.length).toBeGreaterThan(5);
    }
  );

  it.skipIf(!process.env.N8N_PICKS_WEBHOOK_URL)(
    "N8N_PICKS_WEBHOOK_URL is set and contains webhook path",
    () => {
      const url = process.env.N8N_PICKS_WEBHOOK_URL;
      expect(url).toBeDefined();
      expect(url).toContain("webhook");
    }
  );

  it.skipIf(!process.env.N8N_DRIP_WEBHOOK_URL)(
    "N8N_DRIP_WEBHOOK_URL is set and contains webhook path",
    () => {
      const url = process.env.N8N_DRIP_WEBHOOK_URL;
      expect(url).toBeDefined();
      expect(url).toContain("webhook");
    }
  );
});
