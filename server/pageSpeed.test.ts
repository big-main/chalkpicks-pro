import { describe, it, expect } from "vitest";

// Config assertion, not a unit test: it only says something when the key is
// actually present. CI supplies no real secrets by design (see
// .github/workflows/ci.yml), so skip rather than fail there.
describe.skipIf(!process.env.PAGESPEED_API_KEY)("PageSpeed API key", () => {
  it("PAGESPEED_API_KEY env var is set", () => {
    expect(process.env.PAGESPEED_API_KEY).toBeTruthy();
    expect(process.env.PAGESPEED_API_KEY?.length).toBeGreaterThan(10);
  });

  it("PAGESPEED_API_KEY starts with AIza (Google API key format)", () => {
    expect(process.env.PAGESPEED_API_KEY?.startsWith("AIza")).toBe(true);
  });
});
