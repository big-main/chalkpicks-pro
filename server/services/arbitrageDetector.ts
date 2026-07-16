/**
 * Arbitrage Detector Service
 * Detects real-time arbitrage opportunities across multiple sportsbooks
 * Calculates implied probabilities and identifies profitable betting scenarios
 */

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  eventName: string;
  eventDate: Date;
  team1: string;
  team2: string;
  marketType: "moneyline" | "spread" | "total";
  bookmaker1: string;
  bookmaker2: string;
  odds1: number;
  odds2: number;
  impliedProb1: number;
  impliedProb2: number;
  arbitragePercent: number;
  profitPotential: number;
  recommendedBet1: number;
  recommendedBet2: number;
  totalInvestment: number;
  guaranteedProfit: number;
  riskLevel: "low" | "medium" | "high";
  detectedAt: Date;
}

/**
 * Convert odds to implied probability
 * Handles American, decimal, and fractional odds
 */
export function oddsToImpliedProb(odds: number, format: "american" | "decimal" | "fractional" = "american"): number {
  if (format === "american") {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  } else if (format === "decimal") {
    return 1 / odds;
  } else {
    // Fractional: odds like 3/1 means 1/(3+1) = 0.25
    return 1 / (odds + 1);
  }
}

/**
 * Convert implied probability to odds
 */
export function probToOdds(prob: number, format: "american" | "decimal" = "american"): number {
  if (format === "american") {
    if (prob >= 0.5) {
      return -(prob / (1 - prob)) * 100;
    } else {
      return ((1 - prob) / prob) * 100;
    }
  } else {
    return 1 / prob;
  }
}

/**
 * Detect arbitrage opportunity between two odds
 * Returns null if no arbitrage exists
 */
export function detectArbitrage(
  odds1: number,
  odds2: number,
  format: "american" | "decimal" = "american"
): { arbitragePercent: number; impliedProb1: number; impliedProb2: number } | null {
  const prob1 = oddsToImpliedProb(odds1, format);
  const prob2 = oddsToImpliedProb(odds2, format);

  // Total implied probability > 100% means arbitrage exists
  const totalProb = prob1 + prob2;
  if (totalProb >= 1) {
    return null; // No arbitrage
  }

  const arbitragePercent = (1 - totalProb) * 100;
  return {
    arbitragePercent,
    impliedProb1: prob1,
    impliedProb2: prob2,
  };
}

/**
 * Calculate optimal bet sizing for arbitrage
 * Kelly Criterion approach for arbitrage
 */
export function calculateOptimalBets(
  totalBankroll: number,
  odds1: number,
  odds2: number,
  format: "american" | "decimal" = "american"
): { bet1: number; bet2: number; profit: number } | null {
  const arb = detectArbitrage(odds1, odds2, format);
  if (!arb) return null;

  const prob1 = arb.impliedProb1;
  const prob2 = arb.impliedProb2;

  // Calculate decimal odds
  const decimalOdds1 = format === "american" ? (odds1 > 0 ? odds1 / 100 + 1 : 100 / Math.abs(odds1) + 1) : odds1;
  const decimalOdds2 = format === "american" ? (odds2 > 0 ? odds2 / 100 + 1 : 100 / Math.abs(odds2) + 1) : odds2;

  // Bet sizing: stake on each side proportional to its implied probability
  // (equivalently, inversely proportional to its decimal odds) so that both
  // legs pay out the same amount regardless of which side wins.
  const bet1 = (totalBankroll * prob1) / (prob1 + prob2);
  const bet2 = (totalBankroll * prob2) / (prob1 + prob2);

  // Both legs pay out the same amount by construction — profit is that
  // shared payout minus the total staked across both legs, and is the same
  // no matter which side wins.
  const payout = bet1 * decimalOdds1;
  const totalInvested = bet1 + bet2;
  const guaranteedProfit = payout - totalInvested;

  return {
    bet1: Math.round(bet1),
    bet2: Math.round(bet2),
    profit: Math.round(guaranteedProfit),
  };
}

/**
 * Detect all arbitrage opportunities from odds array
 */
export function detectAllArbitrages(
  odds: Array<{ bookmaker: string; odds: number; format?: "american" | "decimal" }>,
  minArbitragePercent: number = 1
): Array<{
  bookmaker1: string;
  bookmaker2: string;
  odds1: number;
  odds2: number;
  arbitragePercent: number;
  impliedProb1: number;
  impliedProb2: number;
}> {
  const opportunities: Array<any> = [];

  for (let i = 0; i < odds.length; i++) {
    for (let j = i + 1; j < odds.length; j++) {
      const arb = detectArbitrage(odds[i].odds, odds[j].odds, odds[i].format || "american");
      if (arb && arb.arbitragePercent >= minArbitragePercent) {
        opportunities.push({
          bookmaker1: odds[i].bookmaker,
          bookmaker2: odds[j].bookmaker,
          odds1: odds[i].odds,
          odds2: odds[j].odds,
          arbitragePercent: arb.arbitragePercent,
          impliedProb1: arb.impliedProb1,
          impliedProb2: arb.impliedProb2,
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.arbitragePercent - a.arbitragePercent);
}

/**
 * Classify arbitrage risk level
 */
export function classifyRiskLevel(arbitragePercent: number): "low" | "medium" | "high" {
  if (arbitragePercent >= 5) return "low"; // 5%+ arbitrage is very safe
  if (arbitragePercent >= 2) return "medium"; // 2-5% is moderate risk
  return "high"; // <2% is risky (might not execute)
}

/**
 * Filter arbitrage opportunities by criteria
 */
export function filterArbitrages(
  opportunities: ArbitrageOpportunity[],
  filters: {
    minArbitragePercent?: number;
    maxRiskLevel?: "low" | "medium" | "high";
    minProfitPotential?: number;
    sport?: string;
    bookmakers?: string[];
  }
): ArbitrageOpportunity[] {
  return opportunities.filter((opp) => {
    if (filters.minArbitragePercent && opp.arbitragePercent < filters.minArbitragePercent) return false;
    if (filters.maxRiskLevel) {
      const riskLevels = ["low", "medium", "high"];
      if (riskLevels.indexOf(opp.riskLevel) > riskLevels.indexOf(filters.maxRiskLevel)) return false;
    }
    if (filters.minProfitPotential && opp.guaranteedProfit < filters.minProfitPotential) return false;
    if (filters.sport && opp.sport !== filters.sport) return false;
    if (filters.bookmakers) {
      if (!filters.bookmakers.includes(opp.bookmaker1) || !filters.bookmakers.includes(opp.bookmaker2)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Calculate steam move (odds movement indicating sharp money)
 */
export function detectSteamMove(
  currentOdds: number,
  previousOdds: number,
  format: "american" | "decimal" = "american"
): { isSteam: boolean; direction: "up" | "down"; magnitude: number } {
  const currentProb = oddsToImpliedProb(currentOdds, format);
  const previousProb = oddsToImpliedProb(previousOdds, format);

  const probChange = Math.abs(currentProb - previousProb);
  const isSteam = probChange > 0.05; // 5% probability change = steam
  const direction = currentProb > previousProb ? "up" : "down";
  const magnitude = probChange * 100;

  return { isSteam, direction, magnitude };
}
