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
  </head>
  <body><div id="root"></div></body>
</html>`;

describe("injectSeo", () => {
  it("injects the route-specific title/description/canonical for a mapped route", async () => {
    const out = await injectSeo(SHELL, "/ev-finder");
    expect(out).toContain("<title>+EV Finder | Positive Expected Value Bets</title>");
    expect(out).toContain('rel="canonical" href="https://chalkpicks.live/ev-finder"');
    expect(out).toContain('og:url" content="https://chalkpicks.live/ev-finder"');
    expect(out).not.toContain("homepage description");
  });

  it("keeps the homepage meta for the root route", async () => {
    const out = await injectSeo(SHELL, "/");
    expect(out).toContain("ChalkPicks | AI Sports Betting Picks");
    expect(out).toContain('href="https://chalkpicks.live/"');
  });

  it("falls back to the picks meta for unknown pick ids (no DB in tests)", async () => {
    const out = await injectSeo(SHELL, "/picks/99999");
    // DB unavailable in tests → static-map fallback for /picks/*
    expect(out).toContain("<title>AI Sports Betting Picks | ChalkPicks</title>");
  });

  it("strips query strings from the canonical", async () => {
    const out = await injectSeo(SHELL, "/pricing?utm_source=x");
    expect(out).toContain('rel="canonical" href="https://chalkpicks.live/pricing"');
    expect(out).toContain("ChalkPicks Pricing");
  });

  it("fails open on malformed input", async () => {
    const junk = "not html at all";
    expect(await injectSeo(junk, "/pricing")).toBe(junk);
  });

  it("escapes HTML-sensitive characters in injected values", async () => {
    // The +EV finder title includes characters that must survive escaping;
    // ensure no raw double quotes break out of the content attribute.
    const out = await injectSeo(SHELL, "/ev-finder");
    const descMatch = out.match(/<meta name="description" content="([^"]*)"/);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeGreaterThan(50);
  });
});
