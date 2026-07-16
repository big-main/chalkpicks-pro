/**
 * OddsHarvester Client
 * Fetches supplemental odds from OddsPortal via the OddsHarvester API
 * running on the Cloud Computer (35.237.81.82:8090).
 *
 * OddsPortal covers 100+ leagues, 10 sports, and dozens of bookmakers
 * not available through The Odds API — significantly expanding arbitrage coverage.
 */

import { ENV } from "../_core/env.js";
import { BookmakerOdds, Market, Outcome } from "./sportsbookOddsScraper.js";
import { getDb } from "../db.js";
import { oddsHarvesterCache } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

// OddsPortal sport key → The Odds API sport key mapping (for unified event matching)
const OH_SPORT_MAP: Record<string, string> = {
  "american-football": "americanfootball_nfl",
  basketball: "basketball_nba",
  baseball: "baseball_mlb",
  "ice-hockey": "icehockey_nhl",
  football: "soccer_epl",
  tennis: "tennis_atp",
};

// ChalkPicks sport key → OddsHarvester sport key
const CP_TO_OH_SPORT: Record<string, string> = {
  americanfootball_nfl: "american-football",
  americanfootball_ncaaf: "american-football",
  basketball_nba: "basketball",
  basketball_ncaab: "basketball",
  baseball_mlb: "baseball",
  icehockey_nhl: "ice-hockey",
  soccer_epl: "football",
  soccer_usa_mls: "football",
  tennis_atp: "tennis",
  tennis_wta: "tennis",
};

interface OHEvent {
  home_team?: string;
  away_team?: string;
  match?: string;
  commence_time?: string;
  date?: string;
  bookmakers?: Array<{
    name: string;
    markets?: Array<{
      key: string;
      outcomes?: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
  odds?: Record<string, number>; // Flat format: { "DraftKings_home": -110, ... }
}

/**
 * Check if OddsHarvester API is reachable
 */
let _ohHealthy: boolean | null = null;
let _ohLastCheck = 0;
const OH_HEALTH_TTL_MS = 60_000; // re-check every 60s

export async function isOddsHarvesterHealthy(): Promise<boolean> {
  const now = Date.now();
  if (_ohHealthy !== null && now - _ohLastCheck < OH_HEALTH_TTL_MS) {
    return _ohHealthy;
  }
  try {
    const res = await fetch(`${ENV.oddsHarvesterApiUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    _ohHealthy = res.ok;
  } catch {
    _ohHealthy = false;
  }
  _ohLastCheck = now;
  if (!_ohHealthy) {
    console.warn("[OddsHarvester] API unreachable — skipping supplemental odds");
  }
  return _ohHealthy;
}

/**
 * Fetch supplemental odds from OddsPortal via OddsHarvester API.
 * Returns standardized BookmakerOdds[] compatible with the existing arbitrage detector.
 *
 * Caching strategy: If a scrape is in progress (60–120s), return the last cached result
 * instead of waiting or hitting the API again. Cache TTL matches the 5-min cron interval.
 */
export async function fetchOddsHarvesterOdds(
  sport: string,
  date?: string
): Promise<BookmakerOdds[]> {
  const ohSport = CP_TO_OH_SPORT[sport];
  if (!ohSport) {
    return []; // Sport not supported by OddsPortal
  }

  // Check cache first
  try {
    const db = await getDb();
    if (db) {
      const cached = await db
        .select()
        .from(oddsHarvesterCache)
        .where(eq(oddsHarvesterCache.sport, sport))
        .limit(1);

      if (cached.length > 0) {
        const row = cached[0];
        if (row && row.expiresAt > new Date()) {
          console.log(`[OddsHarvester] Cache hit for ${sport}`);
          return (row.data as BookmakerOdds[]) || [];
        }
      }
    }
  } catch (cacheErr) {
    console.warn("[OddsHarvester] Cache lookup failed:", cacheErr);
  }

  const healthy = await isOddsHarvesterHealthy();
  if (!healthy) return [];

  try {
    const params = new URLSearchParams({ sport: ohSport });
    if (date) params.set("date", date);

    const res = await fetch(`${ENV.oddsHarvesterApiUrl}/odds?${params}`, {
      signal: AbortSignal.timeout(130_000), // OddsHarvester scraping takes up to 2 min
    });

    if (!res.ok) {
      console.error(`[OddsHarvester] API error ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events: OHEvent[] = data.events || [];
    const result = normalizeOHEvents(events, sport, ohSport);

    // Store in cache (5-min TTL to match cron interval)
    try {
      const db = await getDb();
      if (db && result.length > 0) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
        await db
          .insert(oddsHarvesterCache)
          .values({
            sport,
            data: result,
            scrapedAt: now,
            expiresAt,
          })
          .onDuplicateKeyUpdate({ set: { data: result, scrapedAt: now, expiresAt } });
        console.log(`[OddsHarvester] Cached ${result.length} odds for ${sport}`);
      }
    } catch (cacheErr) {
      console.warn("[OddsHarvester] Cache store failed:", cacheErr);
    }

    return result;
  } catch (error) {
    console.error("[OddsHarvester] Fetch failed:", error);
    return [];
  }
}

/**
 * Normalize OddsHarvester events into BookmakerOdds[] format
 */
function normalizeOHEvents(
  events: OHEvent[],
  sport: string,
  ohSport: string
): BookmakerOdds[] {
  const result: BookmakerOdds[] = [];

  for (const event of events) {
    const homeTeam = event.home_team || event.match?.split(" - ")[0] || "Home";
    const awayTeam = event.away_team || event.match?.split(" - ")[1] || "Away";
    const eventName = `${homeTeam} vs ${awayTeam}`;
    const eventDate = event.commence_time || event.date || new Date().toISOString();
    const eventId = `oh_${ohSport}_${homeTeam}_${awayTeam}_${eventDate}`.replace(/\s+/g, "_");

    // Handle structured bookmakers format
    if (event.bookmakers && Array.isArray(event.bookmakers)) {
      for (const bm of event.bookmakers) {
        const markets: Market[] = [];

        for (const market of bm.markets || []) {
          markets.push({
            key: market.key,
            name: marketKeyToName(market.key),
            outcomes: (market.outcomes || []).map((o) => ({
              name: o.name,
              price: o.price,
              point: o.point,
            })),
          });
        }

        if (markets.length > 0) {
          result.push({
            bookmaker: `oh_${bm.name.toLowerCase().replace(/\s+/g, "_")}`,
            sport,
            league: OH_SPORT_MAP[ohSport] || ohSport,
            eventId,
            eventName,
            eventDate,
            markets,
          });
        }
      }
    }

    // Handle flat odds format: { "DraftKings_home": -110, "DraftKings_away": +130 }
    if (event.odds && typeof event.odds === "object") {
      const bookmakerMap = new Map<string, Outcome[]>();

      for (const [key, price] of Object.entries(event.odds)) {
        const parts = key.split("_");
        if (parts.length < 2) continue;
        const bookmaker = parts.slice(0, -1).join("_").toLowerCase();
        const side = parts[parts.length - 1]; // home/away/over/under

        if (!bookmakerMap.has(bookmaker)) bookmakerMap.set(bookmaker, []);
        bookmakerMap.get(bookmaker)!.push({
          name: side === "home" ? homeTeam : side === "away" ? awayTeam : side,
          price: typeof price === "number" ? price : parseFloat(String(price)),
        });
      }

      for (const [bookmaker, outcomes] of Array.from(bookmakerMap.entries())) {
        result.push({
          bookmaker: `oh_${bookmaker}`,
          sport,
          league: OH_SPORT_MAP[ohSport] || ohSport,
          eventId,
          eventName,
          eventDate,
          markets: [{ key: "h2h", name: "Moneyline", outcomes }],
        });
      }
    }
  }

  return result;
}

function marketKeyToName(key: string): string {
  const names: Record<string, string> = {
    h2h: "Moneyline",
    moneyline: "Moneyline",
    spreads: "Point Spread",
    totals: "Over/Under",
    over_under: "Over/Under",
    "1x2": "1X2",
  };
  return names[key] || key;
}
