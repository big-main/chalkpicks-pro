import { describe, it, expect } from "vitest";
import { SPORTSBOOKS, getBookByOddsKey, getFeaturedBooks, getAllBooksSorted, buildDeepLink } from "../../shared/sportsbooks";

describe("Sportsbooks Config", () => {
  it("should have at least 10 sportsbooks configured", () => {
    expect(SPORTSBOOKS.length).toBeGreaterThanOrEqual(10);
  });

  it("each sportsbook should have required fields", () => {
    for (const book of SPORTSBOOKS) {
      expect(book.id).toBeTruthy();
      expect(book.name).toBeTruthy();
      expect(book.shortName).toBeTruthy();
      expect(book.affiliateUrl).toContain("http");
      expect(book.color).toMatch(/^#/);
      expect(book.signupBonus).toBeTruthy();
      expect(book.rating).toBeGreaterThan(0);
      expect(book.rating).toBeLessThanOrEqual(5);
      expect(book.oddsApiKey).toBeTruthy();
      expect(book.availableStates.length).toBeGreaterThan(0);
    }
  });

  it("getBookByOddsKey should find DraftKings", () => {
    const dk = getBookByOddsKey("draftkings");
    expect(dk).toBeDefined();
    expect(dk!.shortName).toBe("DraftKings");
  });

  it("getBookByOddsKey should return undefined for unknown key", () => {
    const unknown = getBookByOddsKey("nonexistent_book_xyz");
    expect(unknown).toBeUndefined();
  });

  it("getFeaturedBooks should return only featured books", () => {
    const featured = getFeaturedBooks();
    expect(featured.length).toBeGreaterThan(0);
    for (const book of featured) {
      expect(book.featured).toBe(true);
    }
  });

  it("getAllBooksSorted should return books sorted by rating descending", () => {
    const sorted = getAllBooksSorted();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].rating).toBeGreaterThanOrEqual(sorted[i].rating);
    }
  });

  it("buildDeepLink should use affiliate URL when no event ID available", () => {
    const dk = SPORTSBOOKS[0]; // DraftKings
    const link = buildDeepLink(dk, {});
    expect(link).toBe(dk.affiliateUrl);
  });

  it("buildDeepLink should replace eventId placeholder", () => {
    const dk = SPORTSBOOKS[0]; // DraftKings
    const link = buildDeepLink(dk, { eventId: "12345" });
    expect(link).toContain("12345");
    expect(link).not.toContain("{eventId}");
  });

  it("all affiliate URLs should contain ref=chalkpicks", () => {
    for (const book of SPORTSBOOKS) {
      expect(book.affiliateUrl).toContain("chalkpicks");
    }
  });

  it("no duplicate IDs", () => {
    const ids = SPORTSBOOKS.map(b => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("no duplicate oddsApiKeys", () => {
    const keys = SPORTSBOOKS.map(b => b.oddsApiKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
