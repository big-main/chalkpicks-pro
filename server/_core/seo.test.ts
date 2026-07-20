import { describe, it, expect } from "vitest";
import { parseFaqPairs } from "./seo";

describe("parseFaqPairs", () => {
  it("parses 3 well-formed Q&A pairs under a ## FAQ heading", () => {
    const md = [
      "## The Matchup",
      "Some preview text.",
      "",
      "## FAQ",
      "**Q:** Who is favored in Lakers vs Celtics?",
      "**A:** The Lakers are favored at -4.5.",
      "**Q:** What is the total for this game?",
      "**A:** The total is set at 224.5.",
      "**Q:** What is ChalkPicks' confidence on this pick?",
      "**A:** ChalkPicks rates this pick at 78% confidence.",
      "",
      "*Analytics & education — not betting advice. 21+ | 1-800-GAMBLER*",
    ].join("\n");

    const pairs = parseFaqPairs(md);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toEqual({
      q: "Who is favored in Lakers vs Celtics?",
      a: "The Lakers are favored at -4.5.",
    });
    expect(pairs[2].q).toBe("What is ChalkPicks' confidence on this pick?");
  });

  it("returns [] when there is no FAQ section", () => {
    const md = "## The Matchup\nJust preview text, no FAQ here.";
    expect(parseFaqPairs(md)).toEqual([]);
  });

  it("returns [] for a malformed FAQ section with no Q/A pairs", () => {
    const md = "## FAQ\nJust a paragraph, no **Q:**/**A:** markers.";
    expect(parseFaqPairs(md)).toEqual([]);
  });

  it("stops at the next H2 heading and ignores content after it", () => {
    const md = [
      "## FAQ",
      "**Q:** Question one?",
      "**A:** Answer one.",
      "**Q:** Question two?",
      "**A:** Answer two.",
      "",
      "## Not FAQ",
      "**Q:** Should not be captured?",
      "**A:** Should not be captured either.",
    ].join("\n");

    const pairs = parseFaqPairs(md);
    expect(pairs).toHaveLength(2);
    expect(pairs.some(p => p.q.includes("Should not"))).toBe(false);
  });
});
