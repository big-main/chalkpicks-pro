import { describe, it, expect } from "vitest";

const KEY = process.env.SHARPAPI_KEY ?? "";
const BASE = "https://api.sharpapi.io/api/v1";
const h = { "X-API-Key": KEY };

describe.skipIf(
  process.env.RUN_EXTERNAL_INTEGRATION_TESTS !== "true" ||
    !process.env.SHARPAPI_KEY
)("SharpAPI Sharp Plan Validation", () => {
  it("odds endpoint returns data", async () => {
    const r = await fetch(`${BASE}/odds?limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(Array.isArray(d.data)).toBe(true);
  }, 15000);

  it("+EV opportunities endpoint returns data", async () => {
    const r = await fetch(`${BASE}/opportunities/ev?limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(Array.isArray(d.data)).toBe(true);
  }, 15000);

  it("arbitrage opportunities endpoint returns data", async () => {
    const r = await fetch(`${BASE}/opportunities/arbitrage?limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(d.data !== undefined || d.opportunities !== undefined).toBe(true);
  }, 15000);

  it("low hold lines endpoint returns data", async () => {
    const r = await fetch(`${BASE}/opportunities/low_hold?limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(d.data !== undefined || d.opportunities !== undefined).toBe(true);
  }, 15000);
});
