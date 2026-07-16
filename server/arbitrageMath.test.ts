/**
 * Arbitrage Math Tests
 *
 * Regression coverage for stake-sizing: both legs of a two-way arbitrage
 * must pay out the same amount regardless of which side wins, and the
 * guaranteed profit must be positive whenever a real arbitrage exists.
 */
import { describe, it, expect } from "vitest";
import { calculateOptimalBets, detectArbitrage } from "./services/arbitrageDetector";
import { calculateStakes } from "./routers/arbitrage";

describe("calculateOptimalBets", () => {
  it("splits the bankroll so both legs pay out equally", () => {
    const result = calculateOptimalBets(100, 150, -105);
    expect(result).not.toBeNull();
    const { bet1, bet2 } = result!;

    const decimalOdds1 = 150 / 100 + 1; // 2.5
    const decimalOdds2 = 100 / 105 + 1; // ~1.9524

    const payout1 = bet1 * decimalOdds1;
    const payout2 = bet2 * decimalOdds2;

    // bet1/bet2 are rounded to whole dollars, so payouts only match within
    // a dollar or two, not exactly.
    expect(Math.abs(payout1 - payout2)).toBeLessThan(2);
    expect(bet1 + bet2).toBeCloseTo(100, 0);
  });

  it("reports a positive guaranteed profit for a real arbitrage", () => {
    const result = calculateOptimalBets(100, 150, -105);
    expect(result).not.toBeNull();
    expect(result!.profit).toBeGreaterThan(0);
  });

  it("returns null when no arbitrage exists", () => {
    expect(calculateOptimalBets(100, -110, -110)).toBeNull();
  });
});

describe("calculateStakes", () => {
  it("splits the stake so both legs pay out equally, guaranteeing a profit", () => {
    const { stakeA, stakeB, guaranteedProfit } = calculateStakes(150, -105, 100);

    const decimalA = 1 + 150 / 100; // 2.5
    const decimalB = 1 + 100 / 105; // ~1.9524

    expect(stakeA * decimalA).toBeCloseTo(stakeB * decimalB, 0);
    expect(stakeA + stakeB).toBeCloseTo(100, 0);
    expect(guaranteedProfit).toBeGreaterThan(0);
  });

  it("gives the underdog (higher payout multiplier) the smaller stake", () => {
    // oddsA (+150) is the underdog with the bigger payout multiplier, so it
    // needs a smaller stake than oddsB (-105), the favorite, to match payouts.
    const { stakeA, stakeB } = calculateStakes(150, -105, 100);
    expect(stakeA).toBeLessThan(stakeB);
  });
});

describe("detectArbitrage", () => {
  it("flags a real cross-book edge", () => {
    const result = detectArbitrage(150, -105);
    expect(result).not.toBeNull();
    expect(result!.arbitragePercent).toBeGreaterThan(0);
  });

  it("does not flag vig-laden matched lines", () => {
    expect(detectArbitrage(-110, -110)).toBeNull();
  });
});
