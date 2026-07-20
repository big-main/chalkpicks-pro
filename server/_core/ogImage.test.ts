import { describe, it, expect } from "vitest";
import { wrapText, buildCardSvg } from "./ogImage";

describe("wrapText", () => {
  it("keeps a short line as a single element", () => {
    expect(wrapText("Lakers vs Celtics", 30, 3)).toEqual(["Lakers vs Celtics"]);
  });

  it("wraps long text across multiple lines within maxChars", () => {
    const lines = wrapText(
      "Los Angeles Lakers @ Boston Celtics NBA Pick",
      20,
      3
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20 + 20);
    }
  });

  it("truncates to at most maxLines", () => {
    const lines = wrapText(
      "one two three four five six seven eight nine ten eleven twelve",
      5,
      2
    );
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});

describe("buildCardSvg", () => {
  it("renders a valid SVG containing the title and dimensions", () => {
    const svg = buildCardSvg({ title: "Lakers @ Celtics" });
    expect(svg).toContain("<svg width=\"1200\" height=\"630\"");
    expect(svg).toContain("Lakers @ Celtics");
  });

  it("escapes special characters in title/subtitle/badge/kicker", () => {
    const svg = buildCardSvg({
      kicker: "A & B",
      title: "<script>alert(1)</script>",
      subtitle: 'Quote "test"',
      badge: "NBA",
    });
    expect(svg).not.toContain("<script>alert(1)</script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("A &amp; B");
  });

  it("omits optional kicker/subtitle/badge blocks when absent", () => {
    const svg = buildCardSvg({ title: "Just a title" });
    expect(svg).toContain("Just a title");
  });
});
