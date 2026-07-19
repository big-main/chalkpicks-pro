/**
 * Sportsbook Affiliate Configuration
 * 
 * Contains affiliate links, logos, deep-link patterns, and signup bonuses
 * for all supported sportsbooks. Used across picks, arbitrage, and EV finder.
 */

export interface Sportsbook {
  id: string;
  name: string;
  shortName: string;
  /** Affiliate signup link (earns commission per depositor) */
  affiliateUrl: string;
  /** Logo URL */
  logo: string;
  /** Brand color for UI */
  color: string;
  /** Current signup bonus offer */
  signupBonus: string;
  /** Bonus details/terms */
  bonusDetails: string;
  /** Deep link pattern for specific games/markets. Use {sport}, {event}, {market} placeholders */
  deepLinkPattern: string;
  /** States where this book is available */
  availableStates: string[];
  /** Rating out of 5 */
  rating: number;
  /** Whether this book is featured/promoted */
  featured: boolean;
  /** Odds API key name (matches The Odds API bookmaker keys) */
  oddsApiKey: string;
  /** URL to apply for the affiliate/partner program (earns CPA commission per referred depositor) */
  affiliateProgramUrl: string;
  /** Estimated CPA commission per new depositor (USD) */
  estimatedCpa: number;
}

export const SPORTSBOOKS: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings Sportsbook",
    shortName: "DraftKings",
    affiliateUrl: "https://sportsbook.draftkings.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/DraftKings_logo.svg/200px-DraftKings_logo.svg.png",
    color: "#53d337",
    signupBonus: "Bet $5, Get $200 in Bonus Bets",
    bonusDetails: "New users only. Bet $5 on any market, get $200 in bonus bets instantly. No promo code needed.",
    deepLinkPattern: "https://sportsbook.draftkings.com/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "CT", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "NH", "NJ", "NY", "OH", "OR", "PA", "TN", "VA", "WV", "WY"],
    rating: 4.8,
    featured: true,
    oddsApiKey: "draftkings",
    affiliateProgramUrl: "https://www.sbkaffiliates.com/",
    estimatedCpa: 250,
  },
  {
    id: "fanduel",
    name: "FanDuel Sportsbook",
    shortName: "FanDuel",
    affiliateUrl: "https://sportsbook.fanduel.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/FanDuel_logo.svg/200px-FanDuel_logo.svg.png",
    color: "#1493ff",
    signupBonus: "Bet $5, Get $200 in Bonus Bets + 3 Weeks of NBA League Pass",
    bonusDetails: "New users only. Place your first $5 bet, win or lose you get $200 in bonus bets.",
    deepLinkPattern: "https://sportsbook.fanduel.com/navigation/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "CT", "DC", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "NH", "NJ", "NY", "OH", "PA", "TN", "VA", "WV", "WY"],
    rating: 4.9,
    featured: true,
    oddsApiKey: "fanduel",
    affiliateProgramUrl: "https://affiliates.fanduel.com/",
    estimatedCpa: 300,
  },
  {
    id: "betmgm",
    name: "BetMGM Sportsbook",
    shortName: "BetMGM",
    affiliateUrl: "https://sports.betmgm.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/BetMGM_logo.svg/200px-BetMGM_logo.svg.png",
    color: "#c4a44d",
    signupBonus: "Get Up to $1,500 in Bonus Bets",
    bonusDetails: "New users only. If your first bet loses, get up to $1,500 back in bonus bets.",
    deepLinkPattern: "https://sports.betmgm.com/en/sports/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "DC", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "MS", "NJ", "NY", "OH", "PA", "TN", "VA", "WV", "WY"],
    rating: 4.7,
    featured: true,
    oddsApiKey: "betmgm",
    affiliateProgramUrl: "https://www.entainaffiliates.com/",
    estimatedCpa: 200,
  },
  {
    id: "caesars",
    name: "Caesars Sportsbook",
    shortName: "Caesars",
    affiliateUrl: "https://www.caesars.com/sportsbook-and-casino?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Caesars_Entertainment_logo.svg/200px-Caesars_Entertainment_logo.svg.png",
    color: "#1b3c34",
    signupBonus: "Get Your First Bet Back Up to $1,000",
    bonusDetails: "New users only. Place your first bet, if it loses get it back as a bonus bet up to $1,000.",
    deepLinkPattern: "https://www.caesars.com/sportsbook-and-casino/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "DC", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "NJ", "NY", "OH", "PA", "TN", "VA", "WV", "WY"],
    rating: 4.5,
    featured: false,
    oddsApiKey: "williamhill_us",
    affiliateProgramUrl: "https://www.caesarsaffiliates.com/",
    estimatedCpa: 150,
  },
  {
    id: "bet365",
    name: "bet365",
    shortName: "bet365",
    affiliateUrl: "https://www.bet365.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Bet365_logo.svg/200px-Bet365_logo.svg.png",
    color: "#027b5b",
    signupBonus: "Bet $1, Get $200 in Bonus Bets",
    bonusDetails: "New users only. Bet $1 on any market and receive $200 in bonus bets.",
    deepLinkPattern: "https://www.bet365.com/#/AC/B1/C1/D13/E{eventId}/F2/?ref=chalkpicks",
    availableStates: ["CO", "IN", "IA", "KY", "LA", "NJ", "OH", "VA"],
    rating: 4.6,
    featured: false,
    oddsApiKey: "bet365",
    affiliateProgramUrl: "https://www.bet365affiliates.com/",
    estimatedCpa: 175,
  },
  {
    id: "espnbet",
    name: "ESPN BET",
    shortName: "ESPN BET",
    affiliateUrl: "https://espnbet.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png",
    color: "#d00",
    signupBonus: "Get $200 in Bonus Bets When You Bet $10",
    bonusDetails: "New users only. Bet $10 on any market and get $200 in bonus bets regardless of outcome.",
    deepLinkPattern: "https://espnbet.com/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "NJ", "NY", "OH", "PA", "TN", "VA", "WV"],
    rating: 4.4,
    featured: false,
    oddsApiKey: "espnbet",
    affiliateProgramUrl: "https://www.espnbetaffiliates.com/",
    estimatedCpa: 150,
  },
  {
    id: "pointsbet",
    name: "Fanatics Sportsbook",
    shortName: "Fanatics",
    affiliateUrl: "https://sportsbook.fanatics.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Fanatics_logo.svg/200px-Fanatics_logo.svg.png",
    color: "#000",
    signupBonus: "Get Up to $1,000 in Bonus Bets",
    bonusDetails: "New users only. Bet and get matched bonus bets up to $100/day for 10 days ($1,000 total).",
    deepLinkPattern: "https://sportsbook.fanatics.com/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "CT", "IL", "IN", "IA", "KS", "KY", "LA", "MA", "MD", "MI", "NJ", "NY", "OH", "PA", "TN", "VA", "WV"],
    rating: 4.3,
    featured: false,
    oddsApiKey: "fanatics",
    affiliateProgramUrl: "https://affiliates.fanatics.com/",
    estimatedCpa: 125,
  },
  {
    id: "betrivers",
    name: "BetRivers",
    shortName: "BetRivers",
    affiliateUrl: "https://www.betrivers.com/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/BetRivers_logo.svg/200px-BetRivers_logo.svg.png",
    color: "#1a3a6b",
    signupBonus: "2nd Chance Bet Up to $500",
    bonusDetails: "New users only. If your first bet loses, get a bonus bet back up to $500.",
    deepLinkPattern: "https://www.betrivers.com/event/{eventId}?ref=chalkpicks",
    availableStates: ["AZ", "CO", "CT", "IL", "IN", "IA", "LA", "MA", "MD", "MI", "NJ", "NY", "OH", "PA", "VA", "WV"],
    rating: 4.2,
    featured: false,
    oddsApiKey: "betrivers",
    affiliateProgramUrl: "https://www.betrivers.com/affiliates/",
    estimatedCpa: 100,
  },
  {
    id: "bovada",
    name: "Bovada",
    shortName: "Bovada",
    affiliateUrl: "https://www.bovada.lv/?ref=chalkpicks",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Bovada_logo.svg/200px-Bovada_logo.svg.png",
    color: "#cc0000",
    signupBonus: "75% Deposit Match up to $750",
    bonusDetails: "New users only. Get a 75% match on your first crypto deposit up to $750.",
    deepLinkPattern: "https://www.bovada.lv/sports/{sport}?ref=chalkpicks",
    availableStates: ["ALL"],
    rating: 4.1,
    featured: false,
    oddsApiKey: "bovada",
    affiliateProgramUrl: "https://www.bovadaaffiliates.com/",
    estimatedCpa: 100,
  },
  {
    id: "mybookie",
    name: "MyBookie",
    shortName: "MyBookie",
    affiliateUrl: "https://mybookie.ag/?ref=chalkpicks",
    logo: "https://mybookie.ag/wp-content/themes/flavor/images/logo.png",
    color: "#e91e63",
    signupBonus: "100% Deposit Match up to $1,000",
    bonusDetails: "New users only. 100% match on first deposit up to $1,000. Use code CHALKPICKS.",
    deepLinkPattern: "https://mybookie.ag/sportsbook/{sport}/?ref=chalkpicks",
    availableStates: ["ALL"],
    rating: 4.0,
    featured: false,
    oddsApiKey: "mybookieag",
    affiliateProgramUrl: "https://mybookie.ag/affiliates/",
    estimatedCpa: 75,
  },
  {
    id: "betonline",
    name: "BetOnline",
    shortName: "BetOnline",
    affiliateUrl: "https://www.betonline.ag/?ref=chalkpicks",
    logo: "https://www.betonline.ag/assets/images/logo.png",
    color: "#8b0000",
    signupBonus: "50% Welcome Bonus up to $1,000",
    bonusDetails: "New users only. 50% match on first deposit up to $1,000. Lifetime reload bonuses available.",
    deepLinkPattern: "https://www.betonline.ag/sportsbook/{sport}?ref=chalkpicks",
    availableStates: ["ALL"],
    rating: 4.0,
    featured: false,
    oddsApiKey: "betonlineag",
    affiliateProgramUrl: "https://www.betonline.ag/affiliates/",
    estimatedCpa: 75,
  },
];

/** Get a sportsbook by its Odds API key */
export function getBookByOddsKey(key: string): Sportsbook | undefined {
  return SPORTSBOOKS.find(b => b.oddsApiKey === key);
}

/** Get featured sportsbooks */
export function getFeaturedBooks(): Sportsbook[] {
  return SPORTSBOOKS.filter(b => b.featured);
}

/** Get all sportsbooks sorted by rating */
export function getAllBooksSorted(): Sportsbook[] {
  return [...SPORTSBOOKS].sort((a, b) => b.rating - a.rating);
}

/** Build a deep link URL for a specific sportsbook and event */
export function buildDeepLink(book: Sportsbook, params: {
  sport?: string;
  eventId?: string;
  market?: string;
}): string {
  let url = book.deepLinkPattern;
  if (params.eventId) url = url.replace("{eventId}", params.eventId);
  if (params.sport) url = url.replace("{sport}", params.sport);
  if (params.market) url = url.replace("{market}", params.market);
  // If no event ID available, fall back to affiliate homepage
  if (url.includes("{eventId}") || url.includes("{sport}")) {
    return book.affiliateUrl;
  }
  return url;
}

/** Sport key to sportsbook sport path mapping */
export const SPORT_PATH_MAP: Record<string, string> = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl",
  ncaaf: "football/college-football",
  ncaab: "basketball/college-basketball",
  mma: "mma",
  soccer: "soccer",
};
