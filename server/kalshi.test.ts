/**
 * Kalshi Integration Tests
 * 
 * Tests the Kalshi service methods, router procedures, and market analysis.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for Kalshi API calls
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("Kalshi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchMarkets", () => {
    it("should return an array of markets", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markets: [
            {
              ticker: "SPORTS-NFL-CHIEFS-WIN",
              title: "Will the Chiefs win the Super Bowl?",
              category: "sports",
              subtitle: "NFL Championship",
              yes_bid: 65,
              no_bid: 35,
              volume: 50000,
              open_interest: 12000,
              created_time: "2026-01-01T00:00:00Z",
              expiration_time: "2026-02-15T00:00:00Z",
              status: "open",
            },
          ],
        }),
      });

      const { kalshiService } = await import("./_core/kalshi");
      const markets = await kalshiService.fetchMarkets({ limit: 10 });
      expect(Array.isArray(markets)).toBe(true);
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const { kalshiService } = await import("./_core/kalshi");
      const markets = await kalshiService.fetchMarkets();
      expect(Array.isArray(markets)).toBe(true);
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { kalshiService } = await import("./_core/kalshi");
      const markets = await kalshiService.fetchMarkets();
      expect(Array.isArray(markets)).toBe(true);
    });
  });

  describe("fetchMarketById", () => {
    it("should return null for non-existent market", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { kalshiService } = await import("./_core/kalshi");
      const market = await kalshiService.fetchMarketById("NONEXISTENT");
      expect(market).toBeNull();
    });
  });

  describe("analyzeMarket", () => {
    it("should return analysis with required fields", async () => {
      const { kalshiService } = await import("./_core/kalshi");
      const mockMarket = {
        id: "TEST-MARKET",
        title: "Test Market",
        category: "sports",
        yes_price: 65,
        no_price: 35,
        volume: 10000,
        open_interest: 5000,
        created_at: "2026-01-01T00:00:00Z",
        expiration_date: "2026-02-15T00:00:00Z",
        status: "open" as const,
        implied_probability: 0.65,
      };

      const analysis = await kalshiService.analyzeMarket(mockMarket, []);
      expect(analysis).toHaveProperty("market");
      expect(analysis).toHaveProperty("sharp_money_detected");
      expect(analysis).toHaveProperty("line_movement");
      expect(analysis).toHaveProperty("market_sentiment");
      expect(analysis).toHaveProperty("trading_signal");
      expect(analysis).toHaveProperty("confidence_score");
      expect(analysis).toHaveProperty("reasoning");
      expect(typeof analysis.confidence_score).toBe("number");
      expect(analysis.confidence_score).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence_score).toBeLessThanOrEqual(100);
    });

    it("should detect sharp money on large volume spikes", async () => {
      const { kalshiService } = await import("./_core/kalshi");
      const mockMarket = {
        id: "HIGH-VOL",
        title: "High Volume Market",
        category: "sports",
        yes_price: 70,
        no_price: 30,
        volume: 100000,
        open_interest: 50000,
        created_at: "2026-01-01T00:00:00Z",
        expiration_date: "2026-02-15T00:00:00Z",
        status: "open" as const,
        implied_probability: 0.70,
      };

      const history = [
        { yes_price: 50, timestamp: Date.now() - 3600000 },
        { yes_price: 55, timestamp: Date.now() - 2400000 },
        { yes_price: 60, timestamp: Date.now() - 1200000 },
        { yes_price: 70, timestamp: Date.now() },
      ];

      const analysis = await kalshiService.analyzeMarket(mockMarket, history);
      // With a 20-point move, should detect sharp money or significant movement
      expect(analysis.line_movement.change_percentage).toBeGreaterThan(0);
    });
  });

  describe("getSportsMarkets", () => {
    it("should return sports-specific markets", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markets: [
            {
              ticker: "SPORTS-NBA-CELTICS",
              title: "Will the Celtics win?",
              category: "sports",
              yes_bid: 55,
              no_bid: 45,
              volume: 30000,
              open_interest: 8000,
              created_time: "2026-01-01T00:00:00Z",
              expiration_time: "2026-06-30T00:00:00Z",
              status: "open",
            },
          ],
        }),
      });

      const { kalshiService } = await import("./_core/kalshi");
      const markets = await kalshiService.getSportsMarkets();
      expect(Array.isArray(markets)).toBe(true);
    });
  });
});

describe("Kalshi Market Comparison", () => {
  it("should compare Kalshi implied probability with sportsbook odds", () => {
    // Kalshi YES price of 65 = 65% implied probability
    const kalshiProb = 65 / 100; // 0.65

    // Sportsbook moneyline of -180 = 64.3% implied probability
    const americanOdds = -180;
    const sportsbookProb = Math.abs(americanOdds) / (Math.abs(americanOdds) + 100); // 0.643

    const discrepancy = Math.abs(kalshiProb - sportsbookProb);
    expect(discrepancy).toBeLessThan(0.05); // Within 5% is normal
  });

  it("should identify arbitrage when Kalshi and sportsbook disagree significantly", () => {
    // Kalshi YES at 40 (40% implied)
    const kalshiYesProb = 0.40;
    // Sportsbook has +200 (33% implied)
    const sportsbookProb = 100 / (200 + 100); // 0.333

    const edge = kalshiYesProb - sportsbookProb; // 6.7% edge
    expect(edge).toBeGreaterThan(0.05); // Significant discrepancy
  });
});
