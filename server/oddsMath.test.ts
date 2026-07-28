/**
 * Tests for the ChalkPicks betting-math module (shared/oddsMath.ts) — the
 * no-vig/devig, EV, Kelly and CLV math that powers the +EV finder and trackers.
 */
import { describe, it, expect } from "vitest";
import {
  decimalToImpliedProb,
  fractionalToDecimal,
  decimalToFractional,
  noVigProbabilities,
  noVigProbability,
  bookmakerHold,
  expectedValue,
  edgeVsFairLine,
  kellyFraction,
  closingLineValue,
  flatUnitProfit,
  flatROI,
} from "@shared/oddsMath";

describe("odds conversions", () => {
  it("decimal <-> implied probability", () => {
    expect(decimalToImpliedProb(2)).toBeCloseTo(0.5, 6);
    expect(decimalToImpliedProb(4)).toBeCloseTo(0.25, 6);
    expect(() => decimalToImpliedProb(1)).toThrow();
  });

  it("fractional -> decimal", () => {
    expect(fractionalToDecimal(3, 1)).toBeCloseTo(4, 6); // 3/1 = +300 = 4.0
    expect(fractionalToDecimal(1, 2)).toBeCloseTo(1.5, 6); // 1/2 = -200 = 1.5
    expect(() => fractionalToDecimal(1, 0)).toThrow();
  });

  it("decimal -> reduced fractional", () => {
    expect(decimalToFractional(4)).toEqual([3, 1]);
    expect(decimalToFractional(1.5)).toEqual([1, 2]);
  });
});

describe("no-vig / devig", () => {
  it("splits a balanced -110/-110 market to 50/50", () => {
    const [a, b] = noVigProbabilities([-110, -110]);
    expect(a).toBeCloseTo(0.5, 6);
    expect(b).toBeCloseTo(0.5, 6);
  });

  it("fair probabilities always sum to 1", () => {
    const probs = noVigProbabilities([-150, 130]);
    const total = probs.reduce((s, p) => s + p, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it("favorite gets the higher fair probability", () => {
    // -150 is the favorite vs +130 underdog
    const fav = noVigProbability(-150, 130);
    const dog = noVigProbability(130, -150);
    expect(fav).toBeGreaterThan(0.5);
    expect(dog).toBeLessThan(0.5);
    expect(fav + dog).toBeCloseTo(1, 9);
  });

  it("supports n-way markets", () => {
    const probs = noVigProbabilities([200, 250, 300]);
    expect(probs).toHaveLength(3);
    expect(probs.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 9);
  });

  it("reports the bookmaker hold on a standard market", () => {
    // -110/-110 holds ~4.76%
    expect(bookmakerHold([-110, -110])).toBeCloseTo(0.0476, 3);
    expect(bookmakerHold([-105, -105])).toBeGreaterThan(0);
  });

  it("needs at least two outcomes", () => {
    expect(() => noVigProbabilities([-110])).toThrow();
  });
});

describe("expected value", () => {
  it("is zero at a fair price", () => {
    // fair prob 0.5 priced at +100 (even money) is break-even
    expect(expectedValue(0.5, 100)).toBeCloseTo(0, 6);
  });

  it("is positive when the price beats the true probability", () => {
    // true 50% priced at +120 -> +EV
    expect(expectedValue(0.5, 120)).toBeGreaterThan(0);
  });

  it("is negative when the price is worse than true probability", () => {
    expect(expectedValue(0.5, -120)).toBeLessThan(0);
  });

  it("edgeVsFairLine flags value across books", () => {
    // Sharp book fair line -120 (~54.5%); a soft book offers +110 on the same side
    expect(edgeVsFairLine(-120, 110)).toBeGreaterThan(0);
    // ...and offers a worse price than fair -> negative
    expect(edgeVsFairLine(-120, -140)).toBeLessThan(0);
  });

  it("rejects out-of-range probabilities", () => {
    expect(() => expectedValue(1.2, 100)).toThrow();
  });
});

describe("kelly staking", () => {
  it("stakes nothing when there is no edge", () => {
    expect(kellyFraction(0.5, 100)).toBe(0); // fair even-money coin flip
    expect(kellyFraction(0.4, -110)).toBe(0); // negative edge
  });

  it("stakes a positive fraction with a real edge and applies fractional Kelly", () => {
    const full = kellyFraction(0.6, 100, 1);
    const quarter = kellyFraction(0.6, 100, 0.25);
    expect(full).toBeGreaterThan(0);
    expect(quarter).toBeCloseTo(full * 0.25, 9);
  });
});

describe("closing line value", () => {
  it("is positive when you beat the close", () => {
    // Bet +120 (~45.5%), closed -110 (~52.4%) -> you got a better price
    expect(closingLineValue(120, -110)).toBeGreaterThan(0);
  });

  it("is negative when the line moved against you", () => {
    // Bet -110, closed +120 -> you got a worse price than the close
    expect(closingLineValue(-110, 120)).toBeLessThan(0);
  });

  it("is ~zero when you bet the closing number", () => {
    expect(closingLineValue(-110, -110)).toBeCloseTo(0, 9);
  });
});

describe("flat 1-unit ROI", () => {
  it("pays decimal-payout-minus-one on a win, loses exactly 1 unit on a loss, nothing on a push", () => {
    expect(flatUnitProfit("win", 100)).toBeCloseTo(1, 9); // +100 -> risk 1 to win 1
    expect(flatUnitProfit("win", -110)).toBeCloseTo(100 / 110, 9);
    expect(flatUnitProfit("loss", -110)).toBe(-1);
    expect(flatUnitProfit("push", -110)).toBe(0);
  });

  it("treats missing odds as zero profit without throwing", () => {
    expect(flatUnitProfit("win", null)).toBe(0);
  });

  it("computes ROI as average unit profit across decided bets, excluding pushes from the denominator", () => {
    const roi = flatROI([
      { result: "win", odds: 100 }, // +1 unit
      { result: "loss", odds: -110 }, // -1 unit
      { result: "push", odds: -110 }, // excluded
    ]);
    expect(roi).toBeCloseTo(0, 9); // (+1 - 1) / 2 decided bets = 0%
  });

  it("returns 0 when there are no decided bets", () => {
    expect(flatROI([])).toBe(0);
    expect(flatROI([{ result: "push", odds: -110 }])).toBe(0);
  });
});
