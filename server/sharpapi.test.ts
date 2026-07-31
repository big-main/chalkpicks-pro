import { describe, it, expect } from "vitest";

describe("SharpAPI Key Validation", () => {
  it("can fetch odds from SharpAPI with the configured key", async () => {
    const key = process.env.SHARPAPI_KEY;
    expect(key).toBeTruthy();

    const res = await fetch("https://api.sharpapi.io/api/v1/odds?limit=1", {
      headers: { "X-API-Key": key! },
      signal: AbortSignal.timeout(10000),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  }, 15000);
});
