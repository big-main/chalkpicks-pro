/**
 * @chalkpicks/odds-math
 * Native TypeScript odds math module — no external dependencies.
 *
 * Implements:
 *   - Odds format conversion (American ↔ Decimal ↔ Implied probability)
 *   - Devig (proportional normalization — removes bookmaker vig)
 *   - Expected Value (EV) calculation
 *   - Kelly Criterion (full, fractional, quarter-Kelly)
 *   - Arbitrage detection (two-way and three-way)
 *   - CLV (Closing Line Value) calculation
 *   - Hold percentage calculation
 *   - Parlay odds calculation
 *   - Middle opportunity detection
 */

// ─── Odds Format Conversion ──────────────────────────────────────────────────

/**
 * Convert American odds to decimal odds.
 * e.g. -110 → 1.909, +150 → 2.500
 */
export function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

/**
 * Convert decimal odds to American odds.
 * e.g. 1.909 → -110, 2.500 → +150
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal < 1) throw new Error("Decimal odds must be >= 1");
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

/**
 * Convert American odds to implied probability (includes vig).
 * e.g. -110 → 0.5238, +150 → 0.4000
 */
export function americanToImplied(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

/**
 * Convert decimal odds to implied probability.
 */
export function decimalToImplied(decimal: number): number {
  return 1 / decimal;
}

/**
 * Convert implied probability to American odds.
 */
export function impliedToAmerican(prob: number): number {
  if (prob <= 0 || prob >= 1) throw new Error("Probability must be between 0 and 1");
  if (prob >= 0.5) return Math.round(-100 * prob / (1 - prob));
  return Math.round(100 * (1 - prob) / prob);
}

/**
 * Convert implied probability to decimal odds.
 */
export function impliedToDecimal(prob: number): number {
  if (prob <= 0 || prob >= 1) throw new Error("Probability must be between 0 and 1");
  return 1 / prob;
}

/**
 * Format American odds with + prefix for positive values.
 * e.g. 150 → "+150", -110 → "-110"
 */
export function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

// ─── Devig (Remove Vig / Proportional Normalization) ────────────────────────

/**
 * Remove bookmaker vig using proportional normalization.
 * Returns fair (no-vig) probabilities for each outcome.
 *
 * Formula: fair_prob_i = implied_prob_i / Σ(implied_prob_j)
 *
 * @param americanOdds - Array of American odds for all outcomes (e.g. [-110, -110])
 * @returns Array of fair probabilities summing to 1.0
 */
export function devig(americanOdds: number[]): number[] {
  const impliedProbs = americanOdds.map(americanToImplied);
  const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0);
  return impliedProbs.map(p => p / totalImplied);
}

/**
 * Calculate the hold (vig) percentage for a market.
 * e.g. [-110, -110] → 4.76% hold
 */
export function calculateHold(americanOdds: number[]): number {
  const impliedProbs = americanOdds.map(americanToImplied);
  const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0);
  return (totalImplied - 1) * 100;
}

/**
 * Get fair (no-vig) American odds for each outcome.
 * @param americanOdds - Array of American odds for all outcomes
 * @returns Array of fair American odds
 */
export function fairOdds(americanOdds: number[]): number[] {
  const fairProbs = devig(americanOdds);
  return fairProbs.map(impliedToAmerican);
}

// ─── Expected Value (EV) ─────────────────────────────────────────────────────

/**
 * Calculate Expected Value given true probability and offered odds.
 * EV > 0 means the bet has positive expected value (+EV).
 *
 * @param trueProb - True (fair) probability of the outcome (0-1)
 * @param americanOdds - Offered American odds
 * @returns EV as a percentage (e.g. 5.2 means +5.2% EV)
 */
export function calculateEV(trueProb: number, americanOdds: number): number {
  const decimal = americanToDecimal(americanOdds);
  const payout = decimal - 1; // profit per unit staked
  return (trueProb * payout - (1 - trueProb)) * 100;
}

/**
 * Find +EV opportunities across multiple bookmakers for a two-outcome market.
 * Uses proportional devig on the sharpest book (lowest hold) to get fair probs.
 *
 * @param books - Array of { book: string, homeOdds: number, awayOdds: number }
 * @param minEVPercent - Minimum EV threshold (default 2%)
 */
export function findEVOpportunities(
  books: Array<{ book: string; homeOdds: number; awayOdds: number }>,
  minEVPercent = 2
): Array<{
  book: string;
  outcome: "home" | "away";
  offeredOdds: number;
  fairOdds: number;
  fairProb: number;
  ev: number;
  kellyPct: number;
}> {
  if (books.length < 2) return [];

  // Find the sharpest book (lowest hold) to use as the fair-line reference
  const booksWithHold = books.map(b => ({
    ...b,
    hold: calculateHold([b.homeOdds, b.awayOdds]),
  }));
  const sharpest = booksWithHold.reduce((a, b) => (a.hold < b.hold ? a : b));
  const [fairHomeProb, fairAwayProb] = devig([sharpest.homeOdds, sharpest.awayOdds]);

  const results: ReturnType<typeof findEVOpportunities> = [];

  for (const book of books) {
    const homeEV = calculateEV(fairHomeProb, book.homeOdds);
    const awayEV = calculateEV(fairAwayProb, book.awayOdds);

    if (homeEV >= minEVPercent) {
      results.push({
        book: book.book,
        outcome: "home",
        offeredOdds: book.homeOdds,
        fairOdds: impliedToAmerican(fairHomeProb),
        fairProb: fairHomeProb,
        ev: homeEV,
        kellyPct: kellyFraction(fairHomeProb, book.homeOdds) * 100,
      });
    }
    if (awayEV >= minEVPercent) {
      results.push({
        book: book.book,
        outcome: "away",
        offeredOdds: book.awayOdds,
        fairOdds: impliedToAmerican(fairAwayProb),
        fairProb: fairAwayProb,
        ev: awayEV,
        kellyPct: kellyFraction(fairAwayProb, book.awayOdds) * 100,
      });
    }
  }

  return results.sort((a, b) => b.ev - a.ev);
}

// ─── Kelly Criterion ─────────────────────────────────────────────────────────

/**
 * Full Kelly fraction (fraction of bankroll to bet).
 * Returns 0 if the bet has no edge.
 *
 * @param trueProb - True probability of winning (0-1)
 * @param americanOdds - Offered American odds
 * @returns Kelly fraction (0-1), e.g. 0.05 = bet 5% of bankroll
 */
export function kellyFraction(trueProb: number, americanOdds: number, fraction = 1): number {
  const decimal = americanToDecimal(americanOdds);
  const b = decimal - 1; // net odds (profit per unit)
  const q = 1 - trueProb;
  const kelly = (b * trueProb - q) / b;
  return Math.max(0, kelly) * fraction;
}

/**
 * Quarter-Kelly (recommended for retail bettors — reduces variance).
 */
export function quarterKelly(trueProb: number, americanOdds: number): number {
  return kellyFraction(trueProb, americanOdds) * 0.25;
}

/**
 * Calculate recommended bet size in dollars.
 *
 * @param trueProb - True probability of winning
 * @param americanOdds - Offered American odds
 * @param bankroll - Total bankroll in dollars
 * @param fraction - Kelly fraction multiplier (default 0.25 = quarter-Kelly)
 * @param maxPct - Maximum bet as % of bankroll (default 5%)
 */
export function recommendedBetSize(
  trueProb: number,
  americanOdds: number,
  bankroll: number,
  fraction = 0.25,
  maxPct = 0.05
): number {
  const kelly = kellyFraction(trueProb, americanOdds);
  const bet = bankroll * kelly * fraction;
  const maxBet = bankroll * maxPct;
  return Math.min(bet, maxBet);
}

// ─── Arbitrage Detection ─────────────────────────────────────────────────────

/**
 * Check if two-way arbitrage exists across books.
 * Returns arb details if profitable, null otherwise.
 *
 * @param side1 - { book, odds } for outcome 1
 * @param side2 - { book, odds } for outcome 2
 * @param stake - Total stake in dollars (default $100)
 */
export function checkArbitrage(
  side1: { book: string; odds: number },
  side2: { book: string; odds: number },
  stake = 100
): {
  isArb: boolean;
  profit: number;
  profitPct: number;
  stake1: number;
  stake2: number;
  book1: string;
  book2: string;
} | null {
  const implied1 = americanToImplied(side1.odds);
  const implied2 = americanToImplied(side2.odds);
  const totalImplied = implied1 + implied2;

  if (totalImplied >= 1) return null; // No arb

  const profitPct = (1 / totalImplied - 1) * 100;
  const stake1 = (implied1 / totalImplied) * stake;
  const stake2 = (implied2 / totalImplied) * stake;
  const profit = stake / totalImplied - stake;

  return {
    isArb: true,
    profit: parseFloat(profit.toFixed(2)),
    profitPct: parseFloat(profitPct.toFixed(2)),
    stake1: parseFloat(stake1.toFixed(2)),
    stake2: parseFloat(stake2.toFixed(2)),
    book1: side1.book,
    book2: side2.book,
  };
}

/**
 * Find the best arbitrage opportunity across all book combinations for a market.
 */
export function findBestArbitrage(
  books: Array<{ book: string; homeOdds: number; awayOdds: number }>,
  stake = 100
) {
  let bestArb: ReturnType<typeof checkArbitrage> = null;

  for (let i = 0; i < books.length; i++) {
    for (let j = 0; j < books.length; j++) {
      if (i === j) continue;
      const arb = checkArbitrage(
        { book: books[i].book, odds: books[i].homeOdds },
        { book: books[j].book, odds: books[j].awayOdds },
        stake
      );
      if (arb && (!bestArb || arb.profitPct > bestArb.profitPct)) {
        bestArb = arb;
      }
    }
  }

  return bestArb;
}

// ─── CLV (Closing Line Value) ─────────────────────────────────────────────────

/**
 * Calculate Closing Line Value.
 * Positive CLV means you bet at better odds than the closing line (sharp).
 *
 * @param bettedOdds - American odds at time of bet
 * @param closingOdds - American odds at game start (closing line)
 * @returns CLV in percentage points of implied probability
 */
export function calculateCLV(bettedOdds: number, closingOdds: number): number {
  const bettedImplied = americanToImplied(bettedOdds);
  const closingImplied = americanToImplied(closingOdds);
  // Positive = you got better odds than close (sharp money)
  return (closingImplied - bettedImplied) * 100;
}

/**
 * CLV in EV terms — how much edge you captured vs closing line.
 */
export function clvEV(bettedOdds: number, closingOdds: number): number {
  const [fairCloseProb] = devig([closingOdds, -closingOdds]); // approximate 2-way
  return calculateEV(fairCloseProb, bettedOdds);
}

// ─── Parlay Math ─────────────────────────────────────────────────────────────

/**
 * Calculate parlay payout odds from individual leg odds.
 * @param legs - Array of American odds for each leg
 * @returns Parlay American odds
 */
export function parlayOdds(legs: number[]): number {
  const decimalLegs = legs.map(americanToDecimal);
  const parlayDecimal = decimalLegs.reduce((acc, d) => acc * d, 1);
  return decimalToAmerican(parlayDecimal);
}

/**
 * Calculate true parlay probability (no vig).
 * @param legs - Array of { americanOdds, allBookOdds } for devigging each leg
 */
export function trueParlayProb(legs: Array<{ odds: number; oppositeOdds: number }>): number {
  return legs.reduce((prob, leg) => {
    const [fairProb] = devig([leg.odds, leg.oppositeOdds]);
    return prob * fairProb;
  }, 1);
}

// ─── Middle Detection ─────────────────────────────────────────────────────────

/**
 * Detect middle opportunity on spread markets.
 * A middle exists when you can bet both sides and win both if the game lands
 * between the two spread numbers.
 *
 * @param side1 - { book, spread, odds } — e.g. bet Team A -3 at book1
 * @param side2 - { book, spread, odds } — e.g. bet Team B +4 at book2
 */
export function detectMiddle(
  side1: { book: string; spread: number; odds: number },
  side2: { book: string; spread: number; odds: number }
): {
  hasMiddle: boolean;
  middleWindow: number;
  worstCaseLoss: number;
  bestCaseProfit: number;
} {
  // Middle exists when spread1 < spread2 (gap between lines)
  const gap = Math.abs(side2.spread) - Math.abs(side1.spread);
  const hasMiddle = gap > 0;

  const implied1 = americanToImplied(side1.odds);
  const implied2 = americanToImplied(side2.odds);
  const totalImplied = implied1 + implied2;

  // Worst case: one side wins (lose the vig)
  const worstCaseLoss = (totalImplied - 1) * 100;
  // Best case: both sides win (middle hits)
  const dec1 = americanToDecimal(side1.odds);
  const dec2 = americanToDecimal(side2.odds);
  const bestCaseProfit = (dec1 - 1 + dec2 - 1 - 1) * 100; // per 2 units staked

  return {
    hasMiddle,
    middleWindow: gap,
    worstCaseLoss: parseFloat(worstCaseLoss.toFixed(2)),
    bestCaseProfit: parseFloat(bestCaseProfit.toFixed(2)),
  };
}

// ─── Steam Move Detection ─────────────────────────────────────────────────────

/**
 * Detect a steam move — sudden sharp line movement across books.
 * A steam move is flagged when the line moves significantly within a short window.
 *
 * @param lineHistory - Array of { odds, timestamp } in chronological order
 * @param thresholdPoints - Minimum line movement to flag (default 3 points American)
 * @param windowMinutes - Time window to check (default 15 minutes)
 */
export function detectSteamMove(
  lineHistory: Array<{ odds: number; timestamp: number }>,
  thresholdPoints = 3,
  windowMinutes = 15
): {
  isSteam: boolean;
  openingOdds: number;
  currentOdds: number;
  movementPoints: number;
  direction: "toward" | "away" | "none";
} {
  if (lineHistory.length < 2) {
    return { isSteam: false, openingOdds: 0, currentOdds: 0, movementPoints: 0, direction: "none" };
  }

  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();
  const recent = lineHistory.filter(h => now - h.timestamp <= windowMs);

  if (recent.length < 2) {
    return { isSteam: false, openingOdds: lineHistory[0].odds, currentOdds: lineHistory[lineHistory.length - 1].odds, movementPoints: 0, direction: "none" };
  }

  const openingOdds = recent[0].odds;
  const currentOdds = recent[recent.length - 1].odds;
  const movementPoints = Math.abs(currentOdds - openingOdds);
  const isSteam = movementPoints >= thresholdPoints;

  // "toward" = line moving toward favorite (odds getting shorter = sharp action)
  const direction: "toward" | "away" | "none" =
    movementPoints === 0 ? "none" :
    currentOdds < openingOdds ? "toward" : "away";

  return { isSteam, openingOdds, currentOdds, movementPoints, direction };
}

// ─── Reverse Line Movement ────────────────────────────────────────────────────

/**
 * Detect reverse line movement (RLM).
 * RLM occurs when public betting % favors one side but the line moves the other way
 * — indicating sharp/professional money on the other side.
 *
 * @param publicBettingPct - % of public bets on the favored side (0-100)
 * @param lineMovement - How much the line moved (positive = moved toward favored side)
 */
export function isReverseLineMovement(publicBettingPct: number, lineMovement: number): boolean {
  // RLM: public > 60% on one side but line moved against them
  return publicBettingPct > 60 && lineMovement < 0;
}

// ─── Power Ratings / Elo ─────────────────────────────────────────────────────

/**
 * Simple Elo-based win probability.
 * @param eloA - Elo rating of team A
 * @param eloB - Elo rating of team B
 * @param homeAdvantage - Home field advantage in Elo points (default 65 for NFL)
 * @returns Win probability for team A
 */
export function eloProbability(eloA: number, eloB: number, homeAdvantage = 0): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA - homeAdvantage) / 400));
}

/**
 * Update Elo ratings after a game.
 * @param eloA - Pre-game Elo of team A
 * @param eloB - Pre-game Elo of team B
 * @param resultA - Result for team A: 1 = win, 0.5 = draw, 0 = loss
 * @param k - K-factor (default 20)
 */
export function updateElo(
  eloA: number,
  eloB: number,
  resultA: number,
  k = 20
): { newEloA: number; newEloB: number } {
  const expectedA = eloProbability(eloA, eloB);
  const expectedB = 1 - expectedA;
  const resultB = 1 - resultA;

  return {
    newEloA: parseFloat((eloA + k * (resultA - expectedA)).toFixed(1)),
    newEloB: parseFloat((eloB + k * (resultB - expectedB)).toFixed(1)),
  };
}

// ─── ROI & Performance Metrics ────────────────────────────────────────────────

/**
 * Calculate ROI from a series of bets.
 * @param bets - Array of { stake, profit } (profit is negative for losses)
 */
export function calculateROI(bets: Array<{ stake: number; profit: number }>): number {
  const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalProfit = bets.reduce((sum, b) => sum + b.profit, 0);
  if (totalStake === 0) return 0;
  return (totalProfit / totalStake) * 100;
}

/**
 * Calculate win rate from bet results.
 */
export function winRate(bets: Array<{ result: "win" | "loss" | "push" | "pending" }>): number {
  const settled = bets.filter(b => b.result === "win" || b.result === "loss");
  if (settled.length === 0) return 0;
  return (settled.filter(b => b.result === "win").length / settled.length) * 100;
}

/**
 * Estimate required win rate to break even at given odds.
 */
export function breakEvenWinRate(americanOdds: number): number {
  return americanToImplied(americanOdds) * 100;
}


// ─── Compatibility & Extended API ────────────────────────────────────────────
// These exports satisfy both the oddsMath router and the oddsMath.test.ts file.

/** decimalToImpliedProb: throws if decimal <= 1 */
export function decimalToImpliedProb(decimal: number): number {
  if (decimal <= 1) throw new Error("Decimal odds must be > 1");
  return 1 / decimal;
}

/** fractionalToDecimal: e.g. 3/1 → 4.0, 1/2 → 1.5 */
export function fractionalToDecimal(numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error("Denominator cannot be zero");
  return numerator / denominator + 1;
}

/** decimalToFractional: e.g. 4.0 → [3,1], 1.5 → [1,2] */
export function decimalToFractional(decimal: number): [number, number] {
  if (decimal <= 1) throw new Error("Decimal odds must be > 1");
  const profit = decimal - 1;
  const precision = 1000;
  const num = Math.round(profit * precision);
  const den = precision;
  const g = _gcd(num, den);
  return [num / g, den / g];
}
function _gcd(a: number, b: number): number { return b === 0 ? a : _gcd(b, a % b); }

/**
 * noVigProbabilities: throws if < 2 outcomes, returns fair probs summing to 1.
 * Alias for devig() with validation.
 */
export function noVigProbabilities(americanOdds: number[]): number[] {
  if (americanOdds.length < 2) throw new Error("Need at least two outcomes");
  return devig(americanOdds);
}

/**
 * noVigProbability: fair prob for a single outcome given all market odds.
 * e.g. noVigProbability(-150, 130) → fair prob for the -150 side
 */
export function noVigProbability(outcomeOdds: number, ...otherOdds: number[]): number {
  const allOdds = [outcomeOdds, ...otherOdds];
  return devig(allOdds)[0];
}

/**
 * bookmakerHold: returns hold as a DECIMAL fraction (e.g. 0.0476 for 4.76%).
 * Note: calculateHold() returns percentage; this returns the decimal form.
 */
export function bookmakerHold(americanOdds: number[]): number {
  const impliedProbs = americanOdds.map(americanToImplied);
  const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0);
  return totalImplied - 1;
}

/**
 * expectedValue: throws if trueProb is out of [0,1].
 * Returns EV as a percentage (positive = +EV).
 */
export function expectedValue(trueProb: number, americanOdds: number): number {
  if (trueProb < 0 || trueProb > 1) throw new Error("Probability must be between 0 and 1");
  const decimal = americanToDecimal(americanOdds);
  const payout = decimal - 1;
  return (trueProb * payout - (1 - trueProb)) * 100;
}

/**
 * edgeVsFairLine(sharpOdds, softOdds):
 * Positive when the soft book offers a better price than the sharp fair line.
 * e.g. edgeVsFairLine(-120, +110) > 0
 */
export function edgeVsFairLine(sharpOdds: number, softOdds: number): number {
  const [fairProb] = devig([sharpOdds, -sharpOdds]);
  return expectedValue(fairProb, softOdds);
}

/**
 * closingLineValue: positive when you beat the closing line (sharp).
 * Returns CLV in percentage points of implied probability.
 */
export function closingLineValue(bettedOdds: number, closingOdds: number): number {
  return calculateCLV(bettedOdds, closingOdds);
}
