/**
 * ChalkPicks betting-math module (`@chalkpicks/odds-math`)
 *
 * The canonical, dependency-free home for the wagering math that powers the
 * +EV finder, CLV tracker, arbitrage detection and the public calculators.
 *
 * Everything here is pure and isomorphic (safe on server and client). Odds-format
 * primitives are re-exported from `shared/utils` so there is a single source of
 * truth; this module adds the higher-value pieces the platform's edge depends on:
 * no-vig (devig) fair probabilities, EV from a fair probability, and Kelly.
 */
import {
  americanToDecimal,
  americanToImpliedProb,
  decimalToAmerican,
} from "./utils";

export { americanToDecimal, decimalToAmerican, americanToImpliedProb };

// ─── Odds-format conversions ─────────────────────────────────────────────────

/** Decimal odds -> implied probability (includes the book's vig). */
export function decimalToImpliedProb(decimalOdds: number): number {
  if (decimalOdds <= 1) throw new RangeError("Decimal odds must be > 1");
  return 1 / decimalOdds;
}

/** Fractional odds (e.g. "3/1" or [3,1]) -> decimal odds. */
export function fractionalToDecimal(numerator: number, denominator: number): number {
  if (denominator === 0) throw new RangeError("Fractional denominator cannot be 0");
  return numerator / denominator + 1;
}

/** Decimal odds -> reduced fractional [numerator, denominator]. */
export function decimalToFractional(decimalOdds: number): [number, number] {
  if (decimalOdds <= 1) throw new RangeError("Decimal odds must be > 1");
  // Represent the profit part (decimal - 1) as a fraction, then reduce.
  const profit = decimalOdds - 1;
  const denominator = 100;
  let numerator = Math.round(profit * denominator);
  const g = gcd(numerator, denominator);
  return [numerator / g, denominator / g];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

// ─── No-vig / devig fair probabilities ───────────────────────────────────────

/**
 * Remove the bookmaker's margin ("vig") from a set of American odds for the
 * outcomes of a single market, returning each outcome's fair probability.
 *
 * Uses the standard proportional (normalization) method: take each outcome's
 * vig-inclusive implied probability and divide by their sum so the fair
 * probabilities total exactly 1. Works for 2-way (moneyline, spread, total) and
 * n-way markets alike.
 *
 * @example noVigProbabilities([-110, -110]) -> [0.5, 0.5]
 */
export function noVigProbabilities(americanOddsList: number[]): number[] {
  if (americanOddsList.length < 2) {
    throw new RangeError("A market needs at least two outcomes to devig");
  }
  const raw = americanOddsList.map(americanToImpliedProb);
  const overround = raw.reduce((sum, p) => sum + p, 0);
  if (overround <= 0) throw new RangeError("Invalid odds produced a non-positive overround");
  return raw.map(p => p / overround);
}

/**
 * Two-way convenience: fair probability of the FIRST outcome after devigging.
 * `noVigProbability(-150, +130)` returns the fair win probability of the -150 side.
 */
export function noVigProbability(americanOdds: number, opponentAmericanOdds: number): number {
  return noVigProbabilities([americanOdds, opponentAmericanOdds])[0];
}

/**
 * The bookmaker's hold ("vig" / overround) on a market, as a fraction.
 * A standard -110/-110 market holds ~0.0476 (4.76%).
 */
export function bookmakerHold(americanOddsList: number[]): number {
  const overround = americanOddsList
    .map(americanToImpliedProb)
    .reduce((sum, p) => sum + p, 0);
  return overround - 1;
}

// ─── Expected value ──────────────────────────────────────────────────────────

/**
 * Expected value of a 1-unit bet, given a fair win probability and the American
 * odds actually on offer. Positive means the price beats its true probability
 * (a +EV bet). Returned in units of stake (e.g. 0.05 = +5% EV per unit).
 */
export function expectedValue(fairProbability: number, americanOdds: number): number {
  assertProbability(fairProbability);
  const decimal = americanToDecimal(americanOdds);
  const profitIfWin = decimal - 1;
  return fairProbability * profitIfWin - (1 - fairProbability) * 1;
}

/**
 * Convenience for the +EV finder: given the fair odds of one book and the price
 * at another, returns the EV% of taking that price. Both are American odds.
 * `edgeVsFairLine(fairAmerican=-120, offeredAmerican=+105)` > 0 means value.
 */
export function edgeVsFairLine(fairAmerican: number, offeredAmerican: number): number {
  const fairProb = americanToImpliedProb(fairAmerican);
  return expectedValue(fairProb, offeredAmerican);
}

// ─── Kelly staking ───────────────────────────────────────────────────────────

/**
 * Kelly Criterion stake as a fraction of bankroll for a bet with the given fair
 * win probability and American odds. Returns 0 when there is no edge. `fraction`
 * applies fractional Kelly (default quarter-Kelly) to temper variance.
 */
export function kellyFraction(
  fairProbability: number,
  americanOdds: number,
  fraction: number = 0.25
): number {
  assertProbability(fairProbability);
  const b = americanToDecimal(americanOdds) - 1; // net decimal profit per unit
  if (b <= 0) return 0;
  const q = 1 - fairProbability;
  const edge = (b * fairProbability - q) / b;
  return edge <= 0 ? 0 : edge * fraction;
}

// ─── Closing line value ──────────────────────────────────────────────────────

/**
 * Closing Line Value in percentage points of implied probability: how much the
 * price you got beat (or lagged) the closing price. Positive = you beat the
 * close, the strongest signal of long-term betting skill.
 */
export function closingLineValue(betAmericanOdds: number, closingAmericanOdds: number): number {
  const betProb = americanToImpliedProb(betAmericanOdds);
  const closeProb = americanToImpliedProb(closingAmericanOdds);
  // You beat the close when your bet's implied probability is LOWER than the
  // closing implied probability (you got a better price / bigger payout).
  return (closeProb - betProb) * 100;
}

function assertProbability(p: number): void {
  if (!(p >= 0 && p <= 1)) {
    throw new RangeError(`Probability must be within [0, 1], got ${p}`);
  }
}
