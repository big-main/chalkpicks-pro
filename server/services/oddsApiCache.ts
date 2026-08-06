/**
 * Odds API Cache Service
 *
 * Centralized caching gateway for ALL calls to The Odds API (the-odds-api.com).
 * Prevents quota exhaustion (500 req/month free tier) through:
 *
 * 1. In-memory L1 cache with configurable TTL
 * 2. Database-backed L2 cache (survives restarts, shared across instances)
 * 3. Stale-while-revalidate: returns stale data immediately while refreshing in background
 * 4. Request deduplication: coalesces concurrent identical requests into one API call
 * 5. Quota tracking: monitors remaining requests and circuit-breaks when near limit
 * 6. Adaptive TTL: extends cache duration when quota is low
 *
 * Usage: Replace all direct `fetch("https://api.the-odds-api.com/...")` calls with
 *        `oddsApiCache.fetch(sport, markets, options)`.
 */

import { getDb } from "../db";
import { oddsApiCacheEntries, oddsApiQuotaLog } from "../../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CacheConfig {
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTtlMs: number;
  /** Extended TTL when quota is low (default: 30 minutes) */
  lowQuotaTtlMs: number;
  /** Stale data max age — serve stale if within this window (default: 60 minutes) */
  staleMaxAgeMs: number;
  /** Monthly quota limit (default: 500 for free tier) */
  monthlyQuotaLimit: number;
  /** Quota threshold percentage to trigger conservation mode (default: 0.2 = 20% remaining) */
  conservationThreshold: number;
  /** Maximum in-memory cache entries */
  maxMemoryEntries: number;
}

interface CacheEntry {
  data: any;
  fetchedAt: number;
  ttlMs: number;
  headers?: { remaining?: number; used?: number };
}

interface InFlightRequest {
  promise: Promise<any>;
  startedAt: number;
}

export interface OddsCacheStats {
  memoryEntries: number;
  maxMemoryEntries: number;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
  conservationMode: boolean;
  hitRate: { l1Hits: number; l2Hits: number; misses: number; total: number };
  deduplicatedRequests: number;
  lastApiCall: number | null;
  currentTtlMs: number;
}

// ─── Cache Implementation ───────────────────────────────────────────────────

class OddsApiCacheService {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, InFlightRequest>();
  private quotaUsed = 0;
  private quotaRemaining = 500;
  private lastApiCall: number | null = null;

  // Stats tracking
  private stats = {
    l1Hits: 0,
    l2Hits: 0,
    misses: 0,
    deduplicatedRequests: 0,
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtlMs: 5 * 60 * 1000, // 5 minutes
      lowQuotaTtlMs: 30 * 60 * 1000, // 30 minutes
      staleMaxAgeMs: 60 * 60 * 1000, // 1 hour
      monthlyQuotaLimit: 500,
      conservationThreshold: 0.2,
      maxMemoryEntries: 200,
      ...config,
    };

    // Load quota from DB on startup
    this.loadQuotaFromDb();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Fetch odds from The Odds API with full caching pipeline.
   * This is the ONLY function that should make outbound requests to the-odds-api.com.
   */
  async fetch(
    sport: string,
    options: {
      markets?: string;
      regions?: string;
      bookmakers?: string;
      oddsFormat?: string;
      eventId?: string;
    } = {}
  ): Promise<any[]> {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) return [];

    const {
      markets = "h2h,spreads,totals",
      regions = "us",
      bookmakers,
      oddsFormat = "american",
      eventId,
    } = options;

    // Build cache key from normalized parameters
    const cacheKey = this.buildCacheKey(sport, {
      markets,
      regions,
      bookmakers,
      eventId,
    });

    // L1: Check in-memory cache
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry && !this.isExpired(memEntry)) {
      this.stats.l1Hits++;
      return memEntry.data;
    }

    // Check if we have stale data to serve while revalidating
    const staleData = memEntry && this.isStale(memEntry) ? memEntry.data : null;

    // L2: Check database cache
    const dbEntry = await this.getFromDb(cacheKey);
    if (dbEntry && !this.isExpiredTimestamp(dbEntry.fetchedAt, dbEntry.ttlMs)) {
      // Fresh DB entry — promote to L1
      this.setMemory(cacheKey, dbEntry.data, dbEntry.fetchedAt, dbEntry.ttlMs);
      this.stats.l2Hits++;
      return dbEntry.data;
    }

    // Check DB stale data
    const dbStaleData =
      dbEntry && this.isStaleTimestamp(dbEntry.fetchedAt)
        ? dbEntry.data
        : staleData;

    // Request deduplication: if same request is already in-flight, wait for it
    const existing = this.inFlight.get(cacheKey);
    if (existing && Date.now() - existing.startedAt < 30_000) {
      this.stats.deduplicatedRequests++;
      try {
        return await existing.promise;
      } catch {
        // If the in-flight request failed, fall through to make a new one
      }
    }

    // Circuit breaker: if quota is exhausted, return stale data or empty
    if (this.isQuotaExhausted()) {
      console.warn(
        `[OddsApiCache] Quota exhausted (${this.quotaUsed}/${this.config.monthlyQuotaLimit}). Serving stale data.`
      );
      if (dbStaleData) return dbStaleData;
      return [];
    }

    // Make the actual API call (with deduplication)
    const fetchPromise = this.makeApiCall(
      sport,
      apiKey,
      markets,
      regions,
      bookmakers,
      oddsFormat,
      eventId
    );
    this.inFlight.set(cacheKey, {
      promise: fetchPromise,
      startedAt: Date.now(),
    });

    // Stale-while-revalidate: return stale data immediately, refresh in background
    if (dbStaleData) {
      fetchPromise
        .then(freshData => {
          if (freshData && freshData.length > 0) {
            const ttl = this.getCurrentTtl();
            this.setMemory(cacheKey, freshData, Date.now(), ttl);
            this.saveToDb(cacheKey, freshData, ttl);
          }
        })
        .catch(() => {})
        .finally(() => this.inFlight.delete(cacheKey));

      this.stats.l2Hits++;
      return dbStaleData;
    }

    // No stale data — must wait for fresh data
    try {
      const data = await fetchPromise;
      this.stats.misses++;

      if (data && data.length > 0) {
        const ttl = this.getCurrentTtl();
        this.setMemory(cacheKey, data, Date.now(), ttl);
        this.saveToDb(cacheKey, data, ttl);
      }

      return data || [];
    } catch (err) {
      console.warn(`[OddsApiCache] API call failed:`, (err as Error).message);
      // Last resort: return any stale data we have
      if (memEntry) return memEntry.data;
      return [];
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  /**
   * Get current cache statistics for the admin panel.
   */
  getStats(): OddsCacheStats {
    const total =
      this.stats.l1Hits + this.stats.l2Hits + this.stats.misses || 1;
    return {
      memoryEntries: this.memoryCache.size,
      maxMemoryEntries: this.config.maxMemoryEntries,
      quotaUsed: this.quotaUsed,
      quotaRemaining: this.quotaRemaining,
      quotaLimit: this.config.monthlyQuotaLimit,
      conservationMode: this.isConservationMode(),
      hitRate: {
        l1Hits: this.stats.l1Hits,
        l2Hits: this.stats.l2Hits,
        misses: this.stats.misses,
        total,
      },
      deduplicatedRequests: this.stats.deduplicatedRequests,
      lastApiCall: this.lastApiCall,
      currentTtlMs: this.getCurrentTtl(),
    };
  }

  /**
   * Manually purge all cached data (L1 + L2).
   */
  async purgeAll(): Promise<void> {
    this.memoryCache.clear();
    const db = await getDb();
    if (db) {
      await db.delete(oddsApiCacheEntries).execute();
    }
  }

  /**
   * Purge cache for a specific sport.
   */
  async purgeSport(sport: string): Promise<void> {
    // Clear matching memory entries
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key.startsWith(`odds:${sport}:`)) {
        this.memoryCache.delete(key);
      }
    }
    // Clear matching DB entries
    const db = await getDb();
    if (db) {
      await db
        .delete(oddsApiCacheEntries)
        .where(sql`${oddsApiCacheEntries.cacheKey} LIKE ${`odds:${sport}:%`}`)
        .execute();
    }
  }

  /**
   * Reset quota counter (call at start of new billing month).
   */
  resetQuota(): void {
    this.quotaUsed = 0;
    this.quotaRemaining = this.config.monthlyQuotaLimit;
  }

  // ─── Private Methods ────────────────────────────────────────────────────

  private buildCacheKey(
    sport: string,
    params: {
      markets?: string;
      regions?: string;
      bookmakers?: string;
      eventId?: string;
    }
  ): string {
    const parts = [`odds:${sport}`];
    if (params.markets) parts.push(`m:${params.markets}`);
    if (params.regions) parts.push(`r:${params.regions}`);
    if (params.bookmakers) parts.push(`b:${params.bookmakers}`);
    if (params.eventId) parts.push(`e:${params.eventId}`);
    return parts.join(":");
  }

  private async makeApiCall(
    sport: string,
    apiKey: string,
    markets: string,
    regions: string,
    bookmakers: string | undefined,
    oddsFormat: string,
    eventId?: string
  ): Promise<any[]> {
    let url: string;
    if (eventId) {
      url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    } else {
      url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    }
    if (bookmakers) url += `&bookmakers=${bookmakers}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    // Track quota from response headers
    const remaining = res.headers.get("x-requests-remaining");
    const used = res.headers.get("x-requests-used");
    if (remaining) this.quotaRemaining = parseInt(remaining, 10);
    if (used) this.quotaUsed = parseInt(used, 10);
    this.lastApiCall = Date.now();

    // Log quota to DB for historical tracking
    this.logQuota(this.quotaUsed, this.quotaRemaining);

    if (!res.ok) {
      if (res.status === 401) {
        console.error("[OddsApiCache] Invalid API key");
      } else if (res.status === 429) {
        console.error("[OddsApiCache] Rate limited — quota exhausted");
        this.quotaRemaining = 0;
      }
      throw new Error(`Odds API returned ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  }

  private setMemory(
    key: string,
    data: any,
    fetchedAt: number,
    ttlMs: number
  ): void {
    // Evict oldest entries if at capacity
    if (this.memoryCache.size >= this.config.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries());
      entries
        .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
        .slice(0, 20)
        .forEach(([k]) => this.memoryCache.delete(k));
    }
    this.memoryCache.set(key, { data, fetchedAt, ttlMs });
  }

  private async getFromDb(
    cacheKey: string
  ): Promise<{ data: any; fetchedAt: number; ttlMs: number } | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const rows = await db
        .select()
        .from(oddsApiCacheEntries)
        .where(eq(oddsApiCacheEntries.cacheKey, cacheKey))
        .limit(1);

      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        data: row.data,
        fetchedAt: new Date(row.fetchedAt).getTime(),
        ttlMs: row.ttlMs,
      };
    } catch {
      return null;
    }
  }

  private async saveToDb(
    cacheKey: string,
    data: any,
    ttlMs: number
  ): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // Upsert: insert or update on duplicate key
      await db
        .insert(oddsApiCacheEntries)
        .values({
          cacheKey,
          data: JSON.stringify(data),
          fetchedAt: new Date(),
          ttlMs,
        })
        .onDuplicateKeyUpdate({
          set: {
            data: JSON.stringify(data),
            fetchedAt: new Date(),
            ttlMs,
          },
        });
    } catch (err) {
      console.warn("[OddsApiCache] DB save failed:", (err as Error).message);
    }
  }

  private async logQuota(used: number, remaining: number): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(oddsApiQuotaLog).values({
        usedCount: used,
        remainingCount: remaining,
        recordedAt: new Date(),
      });
    } catch {
      // Non-critical, ignore
    }
  }

  private async loadQuotaFromDb(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      const rows = await db
        .select()
        .from(oddsApiQuotaLog)
        .orderBy(desc(oddsApiQuotaLog.recordedAt))
        .limit(1);

      if (rows.length > 0) {
        this.quotaUsed = rows[0].usedCount;
        this.quotaRemaining = rows[0].remainingCount;
      }
    } catch {
      // Use defaults
    }
  }

  private getCurrentTtl(): number {
    if (this.isConservationMode()) {
      return this.config.lowQuotaTtlMs;
    }
    return this.config.defaultTtlMs;
  }

  private isConservationMode(): boolean {
    const remainingRatio = this.quotaRemaining / this.config.monthlyQuotaLimit;
    return remainingRatio <= this.config.conservationThreshold;
  }

  private isQuotaExhausted(): boolean {
    return this.quotaRemaining <= 0;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.fetchedAt > entry.ttlMs;
  }

  private isStale(entry: CacheEntry): boolean {
    const age = Date.now() - entry.fetchedAt;
    return age > entry.ttlMs && age <= this.config.staleMaxAgeMs;
  }

  private isExpiredTimestamp(fetchedAt: number, ttlMs: number): boolean {
    return Date.now() - fetchedAt > ttlMs;
  }

  private isStaleTimestamp(fetchedAt: number): boolean {
    const age = Date.now() - fetchedAt;
    return age <= this.config.staleMaxAgeMs;
  }
}

// ─── Singleton Export ───────────────────────────────────────────────────────
// SharpAPI Sharp plan is now the primary odds source (1,000 req/min, 17,280/day).
// The Odds API is the secondary fallback — reduce conservation threshold so it
// doesn't circuit-break prematurely on the 500/month free quota.
export const oddsApiCache = new OddsApiCacheService({
  monthlyQuotaLimit: 500,
  conservationThreshold: 0.02, // only conserve when <2% remaining (was 20%)
  defaultTtlMs: 3 * 60 * 1000, // 3 min TTL
  lowQuotaTtlMs: 15 * 60 * 1000, // 15 min when low
});
