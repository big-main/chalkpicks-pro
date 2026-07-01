/**
 * Market Comparison Service
 * 
 * Compares Kalshi prediction market prices with traditional sportsbook odds.
 * Identifies discrepancies and potential arbitrage opportunities.
 */
import { kalshiService, type KalshiMarket } from "../_core/kalshi";
import { fetchOdds, type OddsEvent } from "./dataService";

export interface MarketComparison {
  kalshiMarket: {
    id: string;
    title: string;
    yesPrice: number;
    noPrice: number;
    impliedProb: number;
    volume: number;
  };
  sportsbookOdds: {
    bestOdds: number;
    bestBook: string;
    impliedProb: number;
    matchup: string;
  } | null;
  discrepancy: number; // Percentage point difference
  edge: "kalshi_overpriced" | "kalshi_underpriced" | "fair" | "no_comparison";
  confidence: number; // 0-100
  recommendation: string;
}

/**
 * Compare Kalshi sports markets with traditional sportsbook odds
 */
export async function compareMarkets(): Promise<MarketComparison[]> {
  const comparisons: MarketComparison[] = [];

  try {
    const kalshiMarkets = await kalshiService.getSportsMarkets();
    const sportsOdds = await Promise.all([
      fetchOdds("nfl").catch(() => []),
      fetchOdds("nba").catch(() => []),
      fetchOdds("mlb").catch(() => []),
      fetchOdds("nhl").catch(() => []),
    ]);
    const allOdds = sportsOdds.flat();

    for (const market of kalshiMarkets.slice(0, 30)) {
      const comparison = buildComparison(market, allOdds);
      comparisons.push(comparison);
    }
  } catch (err) {
    console.error("[MarketComparison] Error:", (err as Error).message);
  }

  // Sort by absolute discrepancy (biggest edges first)
  return comparisons.sort((a, b) => Math.abs(b.discrepancy) - Math.abs(a.discrepancy));
}

/**
 * Build a comparison between a Kalshi market and matching sportsbook odds
 */
function buildComparison(market: KalshiMarket, allOdds: OddsEvent[]): MarketComparison {
  const kalshiProb = market.yes_price / 100;
  const titleLower = market.title.toLowerCase();

  // Try to find matching sportsbook event
  let matchedOdds: { bestOdds: number; bestBook: string; impliedProb: number; matchup: string } | null = null;

  for (const event of allOdds) {
    const homeTeamLower = event.homeTeam.toLowerCase();
    const awayTeamLower = event.awayTeam.toLowerCase();
    const homeLastName = homeTeamLower.split(" ").pop() || "";
    const awayLastName = awayTeamLower.split(" ").pop() || "";

    if (titleLower.includes(homeLastName) || titleLower.includes(awayLastName)) {
      // Found a potential match — get best moneyline odds
      let bestOdds = 0;
      let bestBook = "";

      for (const bookmaker of event.bookmakers || []) {
        for (const market of bookmaker.markets || []) {
          if (market.key === "h2h") {
            for (const outcome of market.outcomes || []) {
              if (titleLower.includes(outcome.name.toLowerCase().split(" ").pop() || "___")) {
                if (!bestOdds || outcome.price > bestOdds) {
                  bestOdds = outcome.price;
                  bestBook = bookmaker.title || bookmaker.key;
                }
              }
            }
          }
        }
      }

      if (bestOdds) {
        const sportsbookProb = bestOdds > 0
          ? 100 / (bestOdds + 100)
          : Math.abs(bestOdds) / (Math.abs(bestOdds) + 100);

        matchedOdds = {
          bestOdds,
          bestBook,
          impliedProb: sportsbookProb,
          matchup: `${event.awayTeam} @ ${event.homeTeam}`,
        };
      }
      break;
    }
  }

  if (!matchedOdds) {
    return {
      kalshiMarket: {
        id: market.id,
        title: market.title,
        yesPrice: market.yes_price,
        noPrice: market.no_price,
        impliedProb: kalshiProb,
        volume: market.volume,
      },
      sportsbookOdds: null,
      discrepancy: 0,
      edge: "no_comparison",
      confidence: 0,
      recommendation: "No matching sportsbook odds found for comparison.",
    };
  }

  const discrepancy = (kalshiProb - matchedOdds.impliedProb) * 100; // In percentage points
  let edge: MarketComparison["edge"] = "fair";
  let recommendation = "";
  let confidence = 0;

  if (Math.abs(discrepancy) < 3) {
    edge = "fair";
    recommendation = "Markets are in agreement. No actionable edge.";
    confidence = 20;
  } else if (discrepancy > 3) {
    edge = "kalshi_overpriced";
    recommendation = `Kalshi YES is ${discrepancy.toFixed(1)}pp above sportsbook implied probability. Consider selling YES on Kalshi or betting the other side at ${matchedOdds.bestBook}.`;
    confidence = Math.min(90, 40 + Math.abs(discrepancy) * 5);
  } else {
    edge = "kalshi_underpriced";
    recommendation = `Kalshi YES is ${Math.abs(discrepancy).toFixed(1)}pp below sportsbook implied probability. Consider buying YES on Kalshi for value.`;
    confidence = Math.min(90, 40 + Math.abs(discrepancy) * 5);
  }

  return {
    kalshiMarket: {
      id: market.id,
      title: market.title,
      yesPrice: market.yes_price,
      noPrice: market.no_price,
      impliedProb: kalshiProb,
      volume: market.volume,
    },
    sportsbookOdds: matchedOdds,
    discrepancy,
    edge,
    confidence,
    recommendation,
  };
}

/**
 * Get market analytics summary
 */
export async function getMarketAnalyticsSummary(): Promise<{
  totalMarkets: number;
  sportsMarkets: number;
  avgVolume: number;
  topMovers: Array<{ title: string; change: number; direction: "up" | "down" }>;
  edgeOpportunities: number;
}> {
  try {
    const markets = await kalshiService.fetchMarkets({ limit: 100 });
    const sportsMarkets = markets.filter(m => m.category === "sports" || m.title.toLowerCase().match(/nfl|nba|mlb|nhl|soccer/));
    const avgVolume = markets.length > 0
      ? markets.reduce((sum, m) => sum + m.volume, 0) / markets.length
      : 0;

    // Get top movers (markets with highest recent activity)
    const topMovers = markets
      .filter(m => m.volume > avgVolume * 2)
      .slice(0, 5)
      .map(m => ({
        title: m.title,
        change: Math.abs(m.yes_price - 50), // Distance from 50/50
        direction: (m.yes_price > 50 ? "up" : "down") as "up" | "down",
      }));

    const comparisons = await compareMarkets();
    const edgeOpportunities = comparisons.filter(c => Math.abs(c.discrepancy) > 5).length;

    return {
      totalMarkets: markets.length,
      sportsMarkets: sportsMarkets.length,
      avgVolume: Math.round(avgVolume),
      topMovers,
      edgeOpportunities,
    };
  } catch (err) {
    return {
      totalMarkets: 0,
      sportsMarkets: 0,
      avgVolume: 0,
      topMovers: [],
      edgeOpportunities: 0,
    };
  }
}
