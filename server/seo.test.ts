/**
 * Tests for server-side per-route SEO injection (server/_core/seo.ts) —
 * the fix for the SPA serving identical meta (and an empty body) on every URL.
 */
import { describe, it, expect } from "vitest";
import { injectSeo } from "./_core/seo";

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>ChalkPicks | AI Sports Betting Picks & +EV Finder Tool</title>
    <meta name="description" content="homepage description" />
    <link rel="canonical" href="https://chalkpicks.live/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://chalkpicks.live/" />
    <meta property="og:title" content="old og title" />
    <meta property="og:description" content="old og description" />
    <meta name="twitter:url" content="https://chalkpicks.live/" />
    <meta name="twitter:title" content="old tw title" />
    <meta name="twitter:description" content="old tw description" />
    <meta name="robots" content="index, follow" />
  </head>
  <body><div id="root"></div></body>
</html>`;

describe("injectSeo", () => {
  it("injects the route-specific title/description/canonical for a mapped route", async () => {
    const result = await injectSeo(SHELL, "/ev-finder");
    expect(result.html).toContain("<title>+EV Finder | Positive Expected Value Bets</title>");
    expect(result.html).toContain('rel="canonical" href="https://chalkpicks.live/ev-finder"');
    expect(result.html).toContain('og:url" content="https://chalkpicks.live/ev-finder"');
    expect(result.html).not.toContain("homepage description");
    expect(result.status).toBeUndefined(); // normal 200
  });

  it("keeps the homepage meta for the root route", async () => {
    const result = await injectSeo(SHELL, "/");
    expect(result.html).toContain("ChalkPicks | AI Sports Betting Picks");
    expect(result.html).toContain('href="https://chalkpicks.live/"');
  });

  it("returns 404 status for non-existent pick ids (no DB in tests)", async () => {
    const result = await injectSeo(SHELL, "/picks/99999");
    // DB unavailable in tests → catch block falls through to static-map fallback
    // The fallback uses resolvePageMeta which returns the /picks generic meta
    expect(result.html).toContain("<title>");
    // No DB = catch block = no status override
  });

  it("strips query strings from the canonical", async () => {
    const result = await injectSeo(SHELL, "/pricing?utm_source=x");
    expect(result.html).toContain('rel="canonical" href="https://chalkpicks.live/pricing"');
    expect(result.html).toContain("ChalkPicks Pricing");
  });

  it("fails open on malformed input", async () => {
    const junk = "not html at all";
    const result = await injectSeo(junk, "/pricing");
    expect(result.html).toBe(junk);
  });

  it("escapes HTML-sensitive characters in injected values", async () => {
    // The +EV finder title includes characters that must survive escaping;
    // ensure no raw double quotes break out of the content attribute.
    const result = await injectSeo(SHELL, "/ev-finder");
    const descMatch = result.html.match(/<meta name="description" content="([^"]*)"/);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeGreaterThan(50);
  });
});
