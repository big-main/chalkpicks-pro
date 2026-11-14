import { describe, it, expect } from "vitest";

describe.skipIf(!process.env.PAGESPEED_API_KEY)("PageSpeed API key", () => {
  it("PAGESPEED_API_KEY env var is set", () => {
    expect(process.env.PAGESPEED_API_KEY).toBeTruthy();
    expect(process.env.PAGESPEED_API_KEY?.length).toBeGreaterThan(10);
  });

  it("PAGESPEED_API_KEY starts with AIza (Google API key format)", () => {
    expect(process.env.PAGESPEED_API_KEY?.startsWith("AIza")).toBe(true);
  });
});
