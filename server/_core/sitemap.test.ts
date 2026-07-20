import { describe, it, expect } from "vitest";
import { buildSitemapXml } from "./sitemap";

describe("buildSitemapXml", () => {
  it("renders a valid urlset with loc/lastmod/changefreq/priority", () => {
    const xml = buildSitemapXml([
      {
        loc: "https://chalkpicks.live/",
        lastmod: "2026-07-20",
        changefreq: "daily",
        priority: 1,
      },
    ]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(xml).toContain("<loc>https://chalkpicks.live/</loc>");
    expect(xml).toContain("<lastmod>2026-07-20</lastmod>");
    expect(xml).toContain("<changefreq>daily</changefreq>");
    expect(xml).toContain("<priority>1.0</priority>");
  });

  it("includes a published blog slug entry", () => {
    const xml = buildSitemapXml([
      {
        loc: "https://chalkpicks.live/blog/some-new-article",
        lastmod: "2026-07-20",
        changefreq: "weekly",
        priority: 0.7,
      },
    ]);

    expect(xml).toContain(
      "<loc>https://chalkpicks.live/blog/some-new-article</loc>"
    );
  });

  it("omits optional fields that are not provided", () => {
    const xml = buildSitemapXml([{ loc: "https://chalkpicks.live/tools" }]);

    expect(xml).toContain("<loc>https://chalkpicks.live/tools</loc>");
    expect(xml).not.toContain("<lastmod>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
  });

  it("XML-escapes special characters in URLs", () => {
    const xml = buildSitemapXml([{ loc: "https://chalkpicks.live/blog/a&b" }]);

    expect(xml).toContain("<loc>https://chalkpicks.live/blog/a&amp;b</loc>");
    expect(xml).not.toContain("a&b</loc>");
  });

  it("renders an empty urlset for no entries", () => {
    const xml = buildSitemapXml([]);

    expect(xml).toContain("<urlset");
    expect(xml).not.toContain("<url>");
  });
});
