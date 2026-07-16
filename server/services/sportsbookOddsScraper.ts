/**
 * Sportsbook Odds Scraper Integration
 * Fetches real-time odds from multiple sportsbooks and standardizes formats
 * Supports: DraftKings, FanDuel, BetMGM, Caesars, PointsBet, and more
 */

export interface BookmakerOdds {
  bookmaker: string;
  sport: string;
  league: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  markets: Market[];
}

export interface Market {
  key: string; // e.g., "h2h", "spreads", "totals"
  name: string; // e.g., "Head to Head", "Point Spread", "Over/Under"
  outcomes: Outcome[];
}

export interface Outcome {
  name: string; // Team/player name
  price: number; // American odds (e.g., -110, +150)
  point?: number; // For spreads/totals
}

/**
 * Fetch odds from The Odds API (primary source for multiple sportsbooks)
 * This is a free API that aggregates odds from 10+ sportsbooks
 */
export async function fetchMultiBookmakerOdds(
  sport: string,
  region: string = "us"
): Promise<BookmakerOdds[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.error("[OddsScraper] ODDS_API_KEY not configured");
    return [];
  }

  try {
    // The Odds API endpoint: /sports/{sport}/odds
    // Supports: americanfootball_nfl, basketball_nba, baseball_mlb, icehockey_nhl, soccer_epl, etc.
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds?` +
      `regions=${region}&` +
      `markets=h2h,spreads,totals&` +
      `oddsFormat=american&` +
      `apiKey=${apiKey}`
    );

    if (!response.ok) {
      console.error(`[OddsScraper] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data.events || [];

    // Transform API response into standardized format
    const bookmakerOdds: BookmakerOdds[] = [];

    for (const event of events) {
      for (const bookmaker of event.bookmakers || []) {
        const odds: BookmakerOdds = {
          bookmaker: bookmaker.key, // e.g., "draftkings", "fanduel"
          sport,
          league: event.league_key,
          eventId: event.id,
          eventName: `${event.home_team} vs ${event.away_team}`,
          eventDate: event.commence_time,
          markets: [],
        };

        // Transform markets
        for (const market of bookmaker.markets || []) {
          const transformedMarket: Market = {
            key: market.key,
            name: marketKeyToName(market.key),
            outcomes: market.outcomes.map((outcome: any) => ({
              name: outcome.name,
              price: outcome.price,
              point: outcome.point,
            })),
          };
          odds.markets.push(transformedMarket);
        }

        bookmakerOdds.push(odds);
      }
    }

    return bookmakerOdds;
  } catch (error) {
    console.error("[OddsScraper] Fetch failed:", error);
    return [];
  }
}

/**
 * Find best line across all bookmakers for a given market
 */
export function findBestLine(
  bookmakerOdds: BookmakerOdds[],
  marketKey: string,
  teamName: string
): { bookmaker: string; odds: number; point?: number } | null {
  let bestOdds: { bookmaker: string; odds: number; point?: number } | null = null;

  for (const odds of bookmakerOdds) {
    for (const market of odds.markets) {
      if (market.key !== marketKey) continue;

      for (const outcome of market.outcomes) {
        if (outcome.name !== teamName) continue;

        // For moneyline: higher is better (closer to 0 or positive)
        // For spreads/totals: depends on side (over/under)
        if (!bestOdds || outcome.price > bestOdds.odds) {
          bestOdds = {
            bookmaker: odds.bookmaker,
            odds: outcome.price,
            point: outcome.point,
          };
        }
      }
    }
  }

  return bestOdds;
}

/**
 * Detect steam moves (sharp line movement)
 * Compares current odds against a baseline
 */
export function detectSteamMoves(
  current: BookmakerOdds[],
  baseline: BookmakerOdds[]
): Array<{ event: string; market: string; team: string; movement: number }> {
  const steamMoves: Array<{ event: string; market: string; team: string; movement: number }> = [];

  for (const curr of current) {
    const base = baseline.find(
      (b) => b.eventId === curr.eventId && b.bookmaker === curr.bookmaker
    );
    if (!base) continue;

    for (const currMarket of curr.markets) {
      const baseMarket = base.markets.find((m) => m.key === currMarket.key);
      if (!baseMarket) continue;

      for (const currOutcome of currMarket.outcomes) {
        const baseOutcome = baseMarket.outcomes.find(
          (o) => o.name === currOutcome.name
        );
        if (!baseOutcome) continue;

        const movement = currOutcome.price - baseOutcome.price;
        if (Math.abs(movement) >= 10) {
          // Threshold: 10+ point movement = steam move
          steamMoves.push({
            event: curr.eventName,
            market: currMarket.name,
            team: currOutcome.name,
            movement,
          });
        }
      }
    }
  }

  return steamMoves;
}

/**
 * Convert market key to human-readable name
 */
function marketKeyToName(key: string): string {
  const names: Record<string, string> = {
    h2h: "Moneyline",
    spreads: "Point Spread",
    totals: "Over/Under",
  };
  return names[key] || key;
}

/**
 * Calculate implied probability from American odds
 */
export function americanOddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Convert American odds to decimal
 */
export function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return odds / 100 + 1;
  } else {
    return 100 / Math.abs(odds) + 1;
  }
}

/**
 * Convert American odds to fractional
 */
export function americanToFractional(odds: number): string {
  if (odds > 0) {
    return `${odds}/100`;
  } else {
    return `100/${Math.abs(odds)}`;
  }
}
