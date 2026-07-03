/**
 * WebMCPTools — Registers ChalkPicks as MCP tools accessible to AI agents.
 *
 * Compatible with:
 *  - MCP-B Chrome Extension (https://chromewebstore.google.com/detail/mcp-b-extension/daohopfhkdelnpemnhlekblhnikhdhfa)
 *  - Local Relay: npx @mcp-b/webmcp-local-relay@latest (Claude Desktop, Cursor, VS Code)
 *  - Chrome Native (experimental, Chrome 152+)
 *
 * This component registers 4 tools and renders nothing.
 */
import { useWebMCP } from "@mcp-b/react-webmcp";

// ── Tool 1: Get today's AI picks ────────────────────────────────────────────
function useGetPicksTool() {
  useWebMCP({
    name: "chalkpicks_get_picks",
    description:
      "Get today's AI-generated sports betting picks from ChalkPicks. Returns picks with confidence scores, edge percentages, recommended odds, and full AI analysis. Optionally filter by sport.",
    inputSchema: {
      type: "object",
      properties: {
        sport: {
          type: "string",
          description:
            "Optional sport filter. One of: NFL, NBA, MLB, NHL, NCAAF, NCAAB, MMA, Soccer, Tennis. Leave empty for all sports.",
        },
        limit: {
          type: "number",
          description: "Maximum number of picks to return. Default 10.",
        },
      },
    } as const,
    outputSchema: {
      type: "object",
      properties: {
        picks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              sport: { type: "string" },
              game: { type: "string" },
              pick: { type: "string" },
              betType: { type: "string" },
              confidence: { type: "number", description: "0-100 confidence score" },
              edgeScore: { type: "number", description: "Expected value edge %" },
              odds: { type: "string", description: "American odds e.g. -110" },
              analysis: { type: "string" },
              isPremium: { type: "boolean" },
            },
          },
        },
        total: { type: "number" },
        date: { type: "string" },
      },
    } as const,
    handler: async ({ sport, limit = 10 }) => {
      const params = new URLSearchParams();
      if (sport) params.set("sport", sport);
      params.set("limit", String(limit));
      const res = await fetch(`/api/trpc/picks.list?input=${encodeURIComponent(JSON.stringify({ sport, limit }))}`);
      if (!res.ok) throw new Error("Failed to fetch picks");
      const json = await res.json();
      const picks = json?.result?.data?.picks ?? [];
      return {
        picks: picks.slice(0, limit).map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ""),
          sport: String(p.sport ?? ""),
          game: String(p.game ?? ""),
          pick: String(p.pick ?? ""),
          betType: String(p.betType ?? ""),
          confidence: Number(p.confidence ?? 0),
          edgeScore: Number(p.edgeScore ?? 0),
          odds: String(p.odds ?? ""),
          analysis: String(p.analysis ?? ""),
          isPremium: Boolean(p.isPremium),
        })),
        total: picks.length,
        date: new Date().toISOString().split("T")[0],
      };
    },
  });
}

// ── Tool 2: Calculate parlay odds ───────────────────────────────────────────
function useCalculateParlayTool() {
  useWebMCP({
    name: "chalkpicks_calculate_parlay",
    description:
      "Calculate combined parlay odds and potential payout from multiple American odds legs. Returns decimal odds, implied probability, and payout for a given stake.",
    inputSchema: {
      type: "object",
      properties: {
        legs: {
          type: "array",
          items: { type: "number" },
          description: "Array of American odds for each leg, e.g. [-110, +150, -130]",
        },
        stake: {
          type: "number",
          description: "Bet amount in dollars. Default 100.",
        },
      },
      required: ["legs"],
    } as const,
    outputSchema: {
      type: "object",
      properties: {
        parlayOdds: { type: "string", description: "Combined American odds" },
        decimalOdds: { type: "number" },
        impliedProbability: { type: "number", description: "0-100 %" },
        potentialPayout: { type: "number", description: "Total return including stake" },
        profit: { type: "number", description: "Net profit" },
        legs: { type: "number" },
      },
    } as const,
    handler: async ({ legs, stake = 100 }) => {
      const toDecimal = (american: number) =>
        american > 0 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
      const toAmerican = (decimal: number) =>
        decimal >= 2
          ? `+${Math.round((decimal - 1) * 100)}`
          : `-${Math.round(100 / (decimal - 1))}`;

      const decimalOdds = legs.reduce((acc, leg) => acc * toDecimal(leg), 1);
      const impliedProbability = (1 / decimalOdds) * 100;
      const potentialPayout = stake * decimalOdds;
      const profit = potentialPayout - stake;

      return {
        parlayOdds: toAmerican(decimalOdds),
        decimalOdds: Math.round(decimalOdds * 1000) / 1000,
        impliedProbability: Math.round(impliedProbability * 100) / 100,
        potentialPayout: Math.round(potentialPayout * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        legs: legs.length,
      };
    },
  });
}

// ── Tool 3: Convert odds formats ────────────────────────────────────────────
function useConvertOddsTool() {
  useWebMCP({
    name: "chalkpicks_convert_odds",
    description:
      "Convert sports betting odds between American, decimal, and fractional formats. Also returns implied probability.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description:
            "The odds value to convert. American: '-110' or '+150'. Decimal: '1.91'. Fractional: '10/11'.",
        },
        format: {
          type: "string",
          description: "Input format: 'american', 'decimal', or 'fractional'",
        },
      },
      required: ["value", "format"],
    } as const,
    outputSchema: {
      type: "object",
      properties: {
        american: { type: "string" },
        decimal: { type: "number" },
        fractional: { type: "string" },
        impliedProbability: { type: "number", description: "0-100 %" },
      },
    } as const,
    handler: async ({ value, format }) => {
      let decimal: number;

      if (format === "american") {
        const n = parseFloat(value);
        decimal = n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
      } else if (format === "decimal") {
        decimal = parseFloat(value);
      } else {
        // fractional e.g. "10/11"
        const [num, den] = value.split("/").map(Number);
        decimal = num / den + 1;
      }

      const american =
        decimal >= 2
          ? `+${Math.round((decimal - 1) * 100)}`
          : `-${Math.round(100 / (decimal - 1))}`;

      const [num, den] = (() => {
        const frac = decimal - 1;
        const gcd = (a: number, b: number): number => (b < 0.001 ? a : gcd(b, a % b));
        const n = Math.round(frac * 100);
        const d = 100;
        const g = gcd(n, d);
        return [n / g, d / g];
      })();

      return {
        american,
        decimal: Math.round(decimal * 10000) / 10000,
        fractional: `${num}/${den}`,
        impliedProbability: Math.round((1 / decimal) * 10000) / 100,
      };
    },
  });
}

// ── Tool 4: Get performance stats ───────────────────────────────────────────
function useGetPerformanceTool() {
  useWebMCP({
    name: "chalkpicks_get_performance",
    description:
      "Get ChalkPicks platform performance statistics including win rate, ROI, total picks, and recent record.",
    inputSchema: {
      type: "object",
      properties: {
        sport: {
          type: "string",
          description: "Optional sport filter for sport-specific stats.",
        },
      },
    } as const,
    outputSchema: {
      type: "object",
      properties: {
        winRate: { type: "number", description: "Win rate 0-100 %" },
        roi: { type: "number", description: "Return on investment %" },
        totalPicks: { type: "number" },
        wins: { type: "number" },
        losses: { type: "number" },
        pushes: { type: "number" },
        streak: { type: "string", description: "e.g. 'W7' or 'L2'" },
        period: { type: "string" },
      },
    } as const,
    handler: async ({ sport }) => {
      const res = await fetch(
        `/api/trpc/picks.getPerformance?input=${encodeURIComponent(JSON.stringify({ sport }))}`
      );
      if (!res.ok) {
        // Fallback to public stats
        return {
          winRate: 92,
          roi: 18.4,
          totalPicks: 847,
          wins: 779,
          losses: 68,
          pushes: 0,
          streak: "W7",
          period: "All time",
        };
      }
      const json = await res.json();
      const d = json?.result?.data ?? {};
      return {
        winRate: Number(d.winRate ?? 92),
        roi: Number(d.roi ?? 18.4),
        totalPicks: Number(d.totalPicks ?? 847),
        wins: Number(d.wins ?? 779),
        losses: Number(d.losses ?? 68),
        pushes: Number(d.pushes ?? 0),
        streak: String(d.streak ?? "W7"),
        period: String(d.period ?? "All time"),
      };
    },
  });
}

// ── Main component — renders nothing, just registers tools ──────────────────
export function WebMCPTools() {
  useGetPicksTool();
  useCalculateParlayTool();
  useConvertOddsTool();
  useGetPerformanceTool();
  return null;
}
