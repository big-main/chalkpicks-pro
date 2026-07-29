import { describe, it, expect } from "vitest";

describe("n8n Webhook Secret", () => {
  it("N8N_WEBHOOK_SECRET is set in environment", () => {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret!.length).toBeGreaterThan(5);
  });

  it("N8N_PICKS_WEBHOOK_URL is set and contains webhook path", () => {
    const url = process.env.N8N_PICKS_WEBHOOK_URL;
    expect(url).toBeDefined();
    expect(url).toContain("webhook");
  });

  it("N8N_DRIP_WEBHOOK_URL is set and contains webhook path", () => {
    const url = process.env.N8N_DRIP_WEBHOOK_URL;
    expect(url).toBeDefined();
    expect(url).toContain("webhook");
  });
});
