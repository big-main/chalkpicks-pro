/**
 * ChalkPicks Pro — Institutional Quantitative Engine
 * Module: quantEngine.ts
 *
 * Extends oddsMath.ts with advanced algorithms:
 *   - Shin Devigging (bisection root-finding for insider parameter z)
 *   - Power Devigging (exponent-based, handles heavy favorites/longshots)
 *   - Poisson Distribution Matrix (score probabilities for totals/goals/runs)
 *   - Elo + Margin-of-Victory Updater (FiveThirtyEight-style)
 *   - Monte Carlo Backtesting Engine (bootstrap resampling)
 *   - Fractional Kelly with risk controls
 *   - Multi-book arbitrage with hedge sizing
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AmericanOdds = number;
export type DecimalOdds = number;

export interface OutcomeOdds {
  id: string;
  decimalOdds: DecimalOdds;
}

export interface ShinDevigResult {
  outcomes: Array<{
    id: string;
    rawImpliedProbability: number;
    fairProbability: number;
    fairDecimalOdds: DecimalOdds;
    fairAmericanOdds: AmericanOdds;
  }>;
  overround: number;
  insiderParameterZ: number;
  iterations: number;
}

export interface PowerDevigResult {
  outcomes: Array<{
    id: string;
    fairProbability: number;
    fairDecimalOdds: number;
  }>;
  kExponent: number;
  iterations: number;
}

export interface KellyParams {
  fairProbability: number;
  offeredDecimalOdds: number;
  bankroll: number;
  fraction?: number;
  maxBankrollCapPct?: number;
}

export interface KellyResult {
  expectedValuePct: number;
  fullKellyFraction: number;
  scaledKellyFraction: number;
  recommendedStake: number;
  isPositiveEV: boolean;
}

export interface PoissonMatrixResult {
  scoreMatrix: number[][];
  teamAWinProb: number;
  drawProb: number;
  teamBWinProb: number;
  overUnderProbs: Record<number, { over: number; under: number }>;
}

export interface EloUpdateParams {
  ratingA: number;
  ratingB: number;
  homeFieldAdvantage?: number;
  kFactor?: number;
  scoreA: number;
  scoreB: number;
}

export interface EloUpdateResult {
  expectedProbA: number;
  expectedProbB: number;
  newRatingA: number;
  newRatingB: number;
  deltaElo: number;
}

export interface ArbOutcome {
  bookmaker: string;
  outcomeId: string;
  decimalOdds: number;
}

export interface ArbCalculationResult {
  isArbitrage: boolean;
  totalImpliedMargin: number;
  roiPct: number;
  stakes: Array<{
    bookmaker: string;
    outcomeId: string;
    decimalOdds: number;
    stake: number;
    guaranteedPayout: number;
  }>;
}

export interface MonteCarloResult {
  medianROI: number;
  meanROI: number;
  p5ROI: number;
  p95ROI: number;
  maxDrawdown: number;
  ruinProbability: number;
  sharpeRatio: number;
  winRate: number;
  clvBeatRate: number;
  sampleSize: number;
  simulations: number;
}

// ============================================================================
// ODDS CONVERSION UTILITIES
// ============================================================================

export function americanToDecimal(american: AmericanOdds): DecimalOdds {
  if (american === 0) throw new Error("American odds cannot be zero.");
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: DecimalOdds): AmericanOdds {
  if (decimal <= 1) throw new Error("Decimal odds must be greater than 1.");
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

// ============================================================================
// 1. SHIN DEVIGGING ALGORITHM
// ============================================================================

/**
 * Calculates Shin's devigged fair probabilities by solving for insider
 * trading factor z using bisection root-finding.
 *
 * Formula: Sum_i [ (sqrt(z^2 + 4*(1-z)*(d_i^2 / S)) - z) / (2*(1-z)) ] = 1
 *
 * This is the institutional standard (used by Pinnacle, CRIS) for removing
 * vig while accounting for favorite-longshot bias.
 */
export function shinDevig(
  markets: OutcomeOdds[],
  tolerance: number = 1e-12,
  maxIterations: number = 100
): ShinDevigResult {
  if (markets.length < 2) {
    throw new Error("Devigging requires at least two market outcomes.");
  }

  const rawImplied = markets.map(m => {
    if (m.decimalOdds <= 1) {
      throw new Error(
        `Invalid decimal odds ${m.decimalOdds} for outcome ${m.id}`
      );
    }
    return 1 / m.decimalOdds;
  });

  const S = rawImplied.reduce((sum, p) => sum + p, 0);
  const overround = S - 1;

  // Handle zero-vig or negative-vig (arbitrage) markets gracefully
  if (overround <= 0) {
    return {
      outcomes: markets.map((m, i) => {
        const fairP = rawImplied[i] / S;
        return {
          id: m.id,
          rawImpliedProbability: rawImplied[i],
          fairProbability: fairP,
          fairDecimalOdds: 1 / fairP,
          fairAmericanOdds: decimalToAmerican(1 / fairP),
        };
      }),
      overround,
      insiderParameterZ: 0,
      iterations: 0,
    };
  }

  // Objective function F(z): returns sum of fair probabilities - 1
  const calculateProbabilitySum = (
    z: number
  ): { sum: number; probs: number[] } => {
    let sum = 0;
    const probs: number[] = [];

    for (let i = 0; i < markets.length; i++) {
      const d_i = rawImplied[i];
      const numerator = Math.sqrt(z * z + 4 * (1 - z) * ((d_i * d_i) / S)) - z;
      const denominator = 2 * (1 - z);
      const p_i = numerator / denominator;

      probs.push(p_i);
      sum += p_i;
    }

    return { sum, probs };
  };

  // Bisection Root-Finding for parameter z in [0, 1)
  let low = 0;
  let high = 1 - 1e-7;
  let zMid = 0;
  let iterations = 0;
  let finalProbs: number[] = [];

  while (iterations < maxIterations && high - low > tolerance) {
    zMid = (low + high) / 2;
    const { sum, probs } = calculateProbabilitySum(zMid);
    finalProbs = probs;

    if (sum > 1) {
      low = zMid; // Increasing z decreases the probability sum
    } else {
      high = zMid;
    }

    iterations++;
  }

  // Normalize final probabilities to strictly sum to 1.0
  const finalSum = finalProbs.reduce((acc, val) => acc + val, 0);
  const normalizedProbs = finalProbs.map(p => p / finalSum);

  return {
    outcomes: markets.map((m, i) => {
      const fairP = normalizedProbs[i];
      const fairDec = 1 / fairP;
      return {
        id: m.id,
        rawImpliedProbability: rawImplied[i],
        fairProbability: fairP,
        fairDecimalOdds: fairDec,
        fairAmericanOdds: decimalToAmerican(fairDec),
      };
    }),
    overround,
    insiderParameterZ: zMid,
    iterations,
  };
}

// ============================================================================
// 2. POWER DEVIGGING ALGORITHM
// ============================================================================

/**
 * Solves for exponent k such that Sum( (1 / DecimalOdds_i)^k ) = 1.0
 *
 * Essential for heavy favorites/underdogs (e.g. -500 / +350) where the
 * standard multiplicative method over-shifts draw/longshot probabilities.
 * Accounts for Favorite-Longshot Bias without distorting draw probabilities.
 */
export function powerDevig(
  markets: OutcomeOdds[],
  tolerance: number = 1e-10,
  maxIterations: number = 100
): PowerDevigResult {
  const impliedProbs = markets.map(m => 1 / m.decimalOdds);

  // Bisection search for exponent k
  let low = 0.001;
  let high = 5.0;
  let kMid = 1.0;
  let iterations = 0;

  while (iterations < maxIterations && high - low > tolerance) {
    kMid = (low + high) / 2;
    const sum = impliedProbs.reduce((acc, p) => acc + Math.pow(p, kMid), 0);

    if (sum > 1.0) {
      low = kMid; // Increase k to decrease sum
    } else {
      high = kMid; // Decrease k to increase sum
    }
    iterations++;
  }

  const outcomes = markets.map(m => {
    const fairP = Math.pow(1 / m.decimalOdds, kMid);
    return {
      id: m.id,
      fairProbability: fairP,
      fairDecimalOdds: 1 / fairP,
    };
  });

  return { outcomes, kExponent: kMid, iterations };
}

// ============================================================================
// 3. FRACTIONAL KELLY CALCULATOR (with risk controls)
// ============================================================================

/**
 * Calculates optimal bet stake using the Fractional Kelly Criterion.
 * Full Kelly Formula: f* = (p * O - 1) / (O - 1)
 *
 * Includes:
 *   - Fractional scaling (default Quarter-Kelly for risk mitigation)
 *   - Max bankroll cap (default 3% single-bet limit)
 *   - Positive EV gate (returns 0 stake for negative EV)
 */
export function calculateKelly({
  fairProbability,
  offeredDecimalOdds,
  bankroll,
  fraction = 0.25,
  maxBankrollCapPct = 0.03,
}: KellyParams): KellyResult {
  if (fairProbability <= 0 || fairProbability >= 1) {
    throw new Error("Fair probability must be between 0 and 1.");
  }
  if (offeredDecimalOdds <= 1) {
    throw new Error("Offered decimal odds must be greater than 1.0.");
  }
  if (bankroll <= 0) {
    throw new Error("Bankroll must be greater than zero.");
  }

  const p = fairProbability;
  const O = offeredDecimalOdds;
  const b = O - 1;

  // Expected Value %
  const evFraction = p * O - 1;
  const expectedValuePct = evFraction * 100;
  const isPositiveEV = evFraction > 0;

  if (!isPositiveEV) {
    return {
      expectedValuePct,
      fullKellyFraction: 0,
      scaledKellyFraction: 0,
      recommendedStake: 0,
      isPositiveEV: false,
    };
  }

  // Unscaled Full Kelly Fraction f*
  const fullKellyFraction = (p * b - (1 - p)) / b;

  // Apply Kelly Fractional Multiplier (e.g. 0.25)
  const scaledKellyFraction = fullKellyFraction * fraction;

  // Enforce Max Single-Bet Cap
  const cappedFraction = Math.min(scaledKellyFraction, maxBankrollCapPct);

  // Recommended Stake in $
  const recommendedStake = Math.round(bankroll * cappedFraction * 100) / 100;

  return {
    expectedValuePct: Math.round(expectedValuePct * 100) / 100,
    fullKellyFraction,
    scaledKellyFraction,
    recommendedStake,
    isPositiveEV: true,
  };
}

// ============================================================================
// 4. POISSON DISTRIBUTION ENGINE
// ============================================================================

/**
 * Calculates Poisson probability P(k; lambda) = (lambda^k * e^-lambda) / k!
 */
export function poissonProbability(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  let logFactorial = 0;
  for (let i = 2; i <= k; i++) logFactorial += Math.log(i);
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial);
}

/**
 * Builds a score grid up to maxScore and derives outcome probabilities.
 * Used for MLB runs, soccer goals, CS2 rounds, NBA team totals.
 *
 * Returns win/draw/loss probabilities and over/under for key totals.
 */
export function buildPoissonMatrix(
  lambdaA: number,
  lambdaB: number,
  maxScore: number = 10,
  keyTotals: number[] = [2.5, 8.5, 10.5]
): PoissonMatrixResult {
  const matrix: number[][] = Array.from({ length: maxScore + 1 }, () =>
    Array(maxScore + 1).fill(0)
  );

  let teamAWinProb = 0;
  let drawProb = 0;
  let teamBWinProb = 0;

  for (let a = 0; a <= maxScore; a++) {
    const probA = poissonProbability(a, lambdaA);
    for (let b = 0; b <= maxScore; b++) {
      const probB = poissonProbability(b, lambdaB);
      const jointProb = probA * probB;
      matrix[a][b] = jointProb;

      if (a > b) teamAWinProb += jointProb;
      else if (a === b) drawProb += jointProb;
      else teamBWinProb += jointProb;
    }
  }

  // Calculate Over/Under totals
  const overUnderProbs: Record<number, { over: number; under: number }> = {};
  for (const line of keyTotals) {
    let underProb = 0;
    for (let a = 0; a <= maxScore; a++) {
      for (let b = 0; b <= maxScore; b++) {
        if (a + b < line) {
          underProb += matrix[a][b];
        }
      }
    }
    overUnderProbs[line] = {
      under: underProb,
      over: 1 - underProb,
    };
  }

  return {
    scoreMatrix: matrix,
    teamAWinProb,
    drawProb,
    teamBWinProb,
    overUnderProbs,
  };
}

// ============================================================================
// 5. ELO RATING & MARGIN-OF-VICTORY ENGINE
// ============================================================================

/**
 * Calculates updated Elo ratings using a Margin-of-Victory (MoV) scaling
 * multiplier (FiveThirtyEight NFL/MLB model style).
 *
 * MoV multiplier: log(pointDiff + 1) * (2.2 / (ratingDiff * 0.001 + 2.2))
 * This prevents blowouts from over-inflating ratings for already-dominant teams.
 */
export function updateEloAdvanced({
  ratingA,
  ratingB,
  homeFieldAdvantage = 0,
  kFactor = 20,
  scoreA,
  scoreB,
}: EloUpdateParams): EloUpdateResult {
  const adjustedRatingA = ratingA + homeFieldAdvantage;
  const ratingDiff = adjustedRatingA - ratingB;

  // Expected win probability using logistic curve
  const expectedProbA = 1 / (1 + Math.pow(10, -ratingDiff / 400));
  const expectedProbB = 1 - expectedProbA;

  // Actual result S_A: 1.0 for win, 0.5 for draw, 0.0 for loss
  const actualScoreA = scoreA > scoreB ? 1.0 : scoreA === scoreB ? 0.5 : 0.0;

  // Margin of Victory Multiplier (FiveThirtyEight style)
  const pointDiff = Math.abs(scoreA - scoreB);
  const movMultiplier =
    Math.log(pointDiff + 1) * (2.2 / (ratingDiff * 0.001 + 2.2));

  // Elo Delta
  const deltaElo = Math.round(
    kFactor * movMultiplier * (actualScoreA - expectedProbA)
  );

  return {
    expectedProbA,
    expectedProbB,
    newRatingA: ratingA + deltaElo,
    newRatingB: ratingB - deltaElo,
    deltaElo,
  };
}

// ============================================================================
// 6. MULTI-BOOK ARBITRAGE WITH HEDGE SIZING
// ============================================================================

/**
 * Detects cross-bookmaker arbitrage opportunities and computes optimal
 * hedge sizing for guaranteed profit.
 *
 * Arbitrage exists when: Sum(1/BestOdds_i) < 1.0
 * Individual stake: S_i = TotalInvestment / (Odds_i * TotalImpliedMargin)
 */
export function calculateArbitrage(
  outcomes: ArbOutcome[],
  totalInvestment: number
): ArbCalculationResult {
  const totalImpliedMargin = outcomes.reduce(
    (sum, o) => sum + 1 / o.decimalOdds,
    0
  );

  const isArbitrage = totalImpliedMargin < 1.0;
  const roiPct = isArbitrage ? (1 / totalImpliedMargin - 1) * 100 : 0;

  const stakes = outcomes.map(o => {
    const stake = totalInvestment / (o.decimalOdds * totalImpliedMargin);
    const roundedStake = Math.round(stake * 100) / 100;
    return {
      bookmaker: o.bookmaker,
      outcomeId: o.outcomeId,
      decimalOdds: o.decimalOdds,
      stake: roundedStake,
      guaranteedPayout: Math.round(roundedStake * o.decimalOdds * 100) / 100,
    };
  });

  return {
    isArbitrage,
    totalImpliedMargin,
    roiPct: Math.round(roiPct * 100) / 100,
    stakes,
  };
}

// ============================================================================
// 7. MONTE CARLO BACKTESTING ENGINE
// ============================================================================

interface BetRecord {
  stake: number;
  decimalOdds: number;
  won: boolean;
  closingDecimalOdds?: number;
}

/**
 * Runs Monte Carlo bootstrap resampling on a historical bet set to test
 * drawdown probability, sequence variance, and expected performance.
 *
 * @param bets Historical bet records
 * @param simulations Number of bootstrap resamples (default 10,000)
 * @param bankroll Starting bankroll for drawdown calculations
 */
export function monteCarloBacktest(
  bets: BetRecord[],
  simulations: number = 10000,
  bankroll: number = 10000
): MonteCarloResult {
  if (bets.length === 0) {
    return {
      medianROI: 0,
      meanROI: 0,
      p5ROI: 0,
      p95ROI: 0,
      maxDrawdown: 0,
      ruinProbability: 0,
      sharpeRatio: 0,
      winRate: 0,
      clvBeatRate: 0,
      sampleSize: 0,
      simulations: 0,
    };
  }

  const rois: number[] = [];
  const maxDrawdowns: number[] = [];
  let ruinCount = 0;

  for (let sim = 0; sim < simulations; sim++) {
    let balance = bankroll;
    let peak = bankroll;
    let maxDD = 0;

    // Bootstrap resample: draw N bets with replacement
    for (let i = 0; i < bets.length; i++) {
      const bet = bets[Math.floor(Math.random() * bets.length)];
      if (bet.won) {
        balance += bet.stake * (bet.decimalOdds - 1);
      } else {
        balance -= bet.stake;
      }

      if (balance > peak) peak = balance;
      const dd = (peak - balance) / peak;
      if (dd > maxDD) maxDD = dd;

      if (balance <= 0) {
        ruinCount++;
        break;
      }
    }

    const roi = ((balance - bankroll) / bankroll) * 100;
    rois.push(roi);
    maxDrawdowns.push(maxDD * 100);
  }

  // Sort ROIs for percentile calculations
  rois.sort((a, b) => a - b);

  const meanROI = rois.reduce((s, r) => s + r, 0) / rois.length;
  const medianROI = rois[Math.floor(rois.length / 2)];
  const p5ROI = rois[Math.floor(rois.length * 0.05)];
  const p95ROI = rois[Math.floor(rois.length * 0.95)];
  const maxDrawdown = Math.max(...maxDrawdowns);

  // Sharpe ratio approximation (ROI / std dev)
  const variance =
    rois.reduce((s, r) => s + (r - meanROI) ** 2, 0) / rois.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? meanROI / stdDev : 0;

  // Win rate and CLV beat rate from original data
  const winRate = bets.filter(b => b.won).length / bets.length;
  const clvBets = bets.filter(b => b.closingDecimalOdds !== undefined);
  const clvBeatRate =
    clvBets.length > 0
      ? clvBets.filter(b => b.decimalOdds > (b.closingDecimalOdds ?? 0))
          .length / clvBets.length
      : 0;

  return {
    medianROI: Math.round(medianROI * 100) / 100,
    meanROI: Math.round(meanROI * 100) / 100,
    p5ROI: Math.round(p5ROI * 100) / 100,
    p95ROI: Math.round(p95ROI * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    ruinProbability: Math.round((ruinCount / simulations) * 10000) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    winRate: Math.round(winRate * 10000) / 100,
    clvBeatRate: Math.round(clvBeatRate * 10000) / 100,
    sampleSize: bets.length,
    simulations,
  };
}

// ============================================================================
// 8. STEAM MOVE DETECTION (Enhanced)
// ============================================================================

export interface SteamMoveParams {
  sharpBookMoves: Array<{
    bookmaker: string;
    previousOdds: number;
    currentOdds: number;
    timestampMs: number;
  }>;
  publicBettingPct?: number;
  minSharpBooks?: number;
  maxTimeWindowMs?: number;
  minMagnitudeCents?: number;
}

export interface SteamMoveResult {
  isSteamMove: boolean;
  isReverseLineMovement: boolean;
  sharpBooksMoving: number;
  avgMagnitudeCents: number;
  velocityMs: number;
  confidence: "high" | "medium" | "low";
}

/**
 * Enhanced steam move detection with configurable thresholds.
 *
 * Steam Trigger = (SharpCount >= 3) AND (ΔOdds >= δ_min) AND (Δt <= 120s)
 * RLM = line moves AGAINST >= 65% public cash
 */
export function detectSteamMoveAdvanced({
  sharpBookMoves,
  publicBettingPct = 50,
  minSharpBooks = 3,
  maxTimeWindowMs = 120000,
  minMagnitudeCents = 10,
}: SteamMoveParams): SteamMoveResult {
  if (sharpBookMoves.length === 0) {
    return {
      isSteamMove: false,
      isReverseLineMovement: false,
      sharpBooksMoving: 0,
      avgMagnitudeCents: 0,
      velocityMs: 0,
      confidence: "low",
    };
  }

  // Calculate magnitude of each move in cents
  const magnitudes = sharpBookMoves.map(m => {
    return Math.abs(m.currentOdds - m.previousOdds);
  });

  const avgMagnitudeCents =
    magnitudes.reduce((s, m) => s + m, 0) / magnitudes.length;

  // Calculate time window
  const timestamps = sharpBookMoves.map(m => m.timestampMs);
  const velocityMs = Math.max(...timestamps) - Math.min(...timestamps);

  // Count qualifying sharp books
  const qualifyingMoves = sharpBookMoves.filter(
    (m, i) => magnitudes[i] >= minMagnitudeCents
  );
  const sharpBooksMoving = qualifyingMoves.length;

  // Steam move criteria
  const isSteamMove =
    sharpBooksMoving >= minSharpBooks &&
    avgMagnitudeCents >= minMagnitudeCents &&
    velocityMs <= maxTimeWindowMs;

  // Reverse Line Movement: line moves against public money
  const lineDirection =
    sharpBookMoves[0].currentOdds - sharpBookMoves[0].previousOdds;
  const isReverseLineMovement = publicBettingPct >= 65 && lineDirection < 0; // Line shortened despite public on this side

  // Confidence scoring
  let confidence: "high" | "medium" | "low" = "low";
  if (isSteamMove && sharpBooksMoving >= 4 && avgMagnitudeCents >= 15) {
    confidence = "high";
  } else if (isSteamMove) {
    confidence = "medium";
  }

  return {
    isSteamMove,
    isReverseLineMovement,
    sharpBooksMoving,
    avgMagnitudeCents: Math.round(avgMagnitudeCents * 100) / 100,
    velocityMs,
    confidence,
  };
}
