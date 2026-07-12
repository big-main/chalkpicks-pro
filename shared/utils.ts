/**
 * Shared Utilities
 * 
 * Consolidated helper functions used across the codebase.
 * Eliminates duplicate logic between routers, services, and frontend.
 */

// ─── Odds & Probability Calculations ─────────────────────────────────────────

/**
 * Convert American odds to implied probability
 */
export function americanToImpliedProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  }
  return (100 / Math.abs(odds)) + 1;
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

/**
 * Calculate expected value given probability and odds
 */
export function calculateEV(probability: number, odds: number): number {
  const decimalOdds = americanToDecimal(odds);
  return (probability * (decimalOdds - 1)) - ((1 - probability) * 1);
}

/**
 * Calculate potential payout from stake and American odds
 */
export function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake * (odds / 100) + stake;
  }
  return stake * (100 / Math.abs(odds)) + stake;
}

/**
 * Calculate profit from stake and American odds
 */
export function calculateProfit(stake: number, odds: number): number {
  return calculatePayout(stake, odds) - stake;
}

/**
 * Calculate Kelly Criterion bet size
 */
export function kellyCriterion(probability: number, odds: number, bankroll: number, fraction: number = 0.25): number {
  const decimalOdds = americanToDecimal(odds);
  const b = decimalOdds - 1;
  const q = 1 - probability;
  const kelly = (b * probability - q) / b;
  if (kelly <= 0) return 0;
  return Math.max(0, bankroll * kelly * fraction);
}

// ─── Date & Time Utilities ───────────────────────────────────────────────────

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get date N days ago in YYYY-MM-DD format
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * Format a timestamp to relative time (e.g., "2h ago", "3d ago")
 */
export function relativeTime(timestamp: Date | string | number): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// ─── Formatting Utilities ────────────────────────────────────────────────────

/**
 * Format American odds with + prefix for positive
 */
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

// ─── Validation Utilities ────────────────────────────────────────────────────

/**
 * Validate American odds range
 */
export function isValidOdds(odds: number): boolean {
  return odds !== 0 && odds >= -10000 && odds <= 10000 && (odds <= -100 || odds >= 100);
}

/**
 * Validate confidence score (0-100)
 */
export function isValidConfidence(score: number): boolean {
  return score >= 0 && score <= 100 && Number.isInteger(score);
}

/**
 * Sanitize user input string (remove dangerous characters)
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength);
}

// ─── Sport Key Utilities ─────────────────────────────────────────────────────

export const SPORT_DISPLAY_NAMES: Record<string, string> = {
  nfl: "NFL",
  nba: "NBA",
  mlb: "MLB",
  nhl: "NHL",
  ncaaf: "NCAAF",
  ncaab: "NCAAB",
  soccer: "Soccer",
  mma: "MMA",
  tennis: "Tennis",
};

export function getSportDisplayName(sportKey: string): string {
  return SPORT_DISPLAY_NAMES[sportKey.toLowerCase()] || sportKey.toUpperCase();
}

// ─── Array Utilities ─────────────────────────────────────────────────────────

/**
 * Chunk an array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── Auth / Navigation ───────────────────────────────────────────────────────

/**
 * Resolve a safe post-auth redirect target from a raw `?redirect=` value.
 * Only same-origin, absolute in-app paths (e.g. "/pricing") are allowed —
 * anything else (external URLs, protocol-relative "//evil.com", missing) falls
 * back to the given default. Prevents open-redirect abuse via the auth pages.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  // Must be a root-relative path and NOT protocol-relative ("//host").
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
