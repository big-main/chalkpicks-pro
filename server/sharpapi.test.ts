import { describe, it, expect } from "vitest";

// Live SharpAPI checks. CI deliberately supplies no real secrets ("Tests must
// not need real secrets" — .github/workflows/ci.yml), so this suite skips
// unless SHARPAPI_KEY is present, matching oddsApiIo.test.ts / railway.test.ts.
//
// There is no fallback key on purpose: a literal here is a published
// credential, since this repository is public.
const KEY = process.env.SHARPAPI_KEY;
const BASE = "https://api.sharpapi.io/api/v1";
const h = { "X-API-Key": KEY ?? "" };

describe.skipIf(!KEY)("SharpAPI Sharp Plan Validation", () => {
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
