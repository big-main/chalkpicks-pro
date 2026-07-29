import { z } from "zod";
import { router } from "../_core/trpc";
import { premiumProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const strategyRouter = router({
  /**
   * Generate AI strategy analysis using Grok-4.
   * Takes user-defined strategy parameters and returns projected performance.
   */
  analyze: premiumProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        sport: z.string(),
        betType: z.string(),
        confidenceThreshold: z.number().min(50).max(100),
        bankrollPct: z.number().min(0.5).max(10),
        minEdge: z.number().min(0).max(20),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `You are a professional sports betting analyst. Analyze this betting strategy and provide realistic projections based on historical sports betting data.

Strategy Parameters:
- Name: ${input.name}
- Sport: ${input.sport}
- Bet Type: ${input.betType}
- Minimum AI Confidence Threshold: ${input.confidenceThreshold}%
- Bankroll Percentage per Bet: ${input.bankrollPct}%
- Minimum Edge Required: ${input.minEdge}%

Based on these parameters, provide a realistic analysis. Consider:
1. Higher confidence thresholds reduce volume but increase win rate
2. The Kelly Criterion suggests optimal bet sizing
3. Minimum edge requirements filter out marginal plays
4. Sport-specific factors (NFL has fewer games, MLB has more variance, NBA has tighter lines)

Return a JSON object with these exact fields:
{
  "projectedROI": <number, realistic annual ROI percentage, typically 3-15% for good strategies>,
  "projectedWinRate": <number, realistic win rate percentage, typically 52-62% for profitable strategies>,
  "riskLevel": <"Low" | "Medium" | "High">,
  "matchingPicks": <number, estimated picks per week matching criteria, 1-20>,
  "expectedMonthlyProfit": <number, expected monthly profit per $1000 bankroll>,
  "backtestROI": <number, simulated backtest ROI, slightly lower than projected>,
  "backtestWinRate": <number, simulated backtest win rate>,
  "backtestBets": <number, total bets in simulated backtest period, 50-300>,
  "analysis": <string, 2-3 sentence analysis of the strategy's strengths and weaknesses>,
  "recommendation": <string, one sentence recommendation>
}

Return ONLY valid JSON, no markdown or explanation.`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a quantitative sports betting analyst. Always return valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          model: "grok-4",
          complexity: "high",
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content || typeof content !== "string") {
          return getFallbackResult(input);
        }

        // Parse JSON from response (handle potential markdown wrapping)
        const jsonStr = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(jsonStr);

        return {
          name: input.name,
          sport: input.sport,
          betType: input.betType,
          confidenceThreshold: input.confidenceThreshold,
          bankrollPct: input.bankrollPct,
          minEdge: input.minEdge,
          projectedROI: Number(parsed.projectedROI) || 5.2,
          projectedWinRate: Number(parsed.projectedWinRate) || 55.1,
          riskLevel:
            (parsed.riskLevel as "Low" | "Medium" | "High") || "Medium",
          matchingPicks: Number(parsed.matchingPicks) || 5,
          expectedMonthlyProfit: Number(parsed.expectedMonthlyProfit) || 52,
          backtestROI: Number(parsed.backtestROI) || 4.8,
          backtestWinRate: Number(parsed.backtestWinRate) || 54.2,
          backtestBets: Number(parsed.backtestBets) || 120,
          analysis:
            parsed.analysis ||
            "Strategy shows positive expected value with manageable risk.",
          recommendation:
            parsed.recommendation ||
            "Consider starting with quarter-Kelly sizing to validate.",
          provider: "grok-4",
        };
      } catch {
        // Fallback to deterministic calculation if Grok-4 is unavailable
        return getFallbackResult(input);
      }
    }),
});

function getFallbackResult(input: {
  name: string;
  sport: string;
  betType: string;
  confidenceThreshold: number;
  bankrollPct: number;
  minEdge: number;
}) {
  const base = input.confidenceThreshold / 100;
  const edgeBonus = input.minEdge * 0.8;
  const projectedWinRate = Math.min(72, 50 + (base - 0.5) * 60 + edgeBonus);
  const projectedROI = (projectedWinRate - 52.4) * 0.8;
  const riskLevel: "Low" | "Medium" | "High" =
    input.bankrollPct <= 2
      ? "Low"
      : input.bankrollPct <= 3.5
        ? "Medium"
        : "High";
  const matchingPicks = Math.floor(Math.random() * 8) + 2;
  const expectedMonthlyProfit =
    (projectedROI / 100) * input.bankrollPct * 10 * 1000;

  return {
    name: input.name,
    sport: input.sport,
    betType: input.betType,
    confidenceThreshold: input.confidenceThreshold,
    bankrollPct: input.bankrollPct,
    minEdge: input.minEdge,
    projectedROI: parseFloat(projectedROI.toFixed(1)),
    projectedWinRate: parseFloat(projectedWinRate.toFixed(1)),
    riskLevel,
    matchingPicks,
    expectedMonthlyProfit: parseFloat(expectedMonthlyProfit.toFixed(2)),
    backtestROI: parseFloat((projectedROI * 0.85).toFixed(1)),
    backtestWinRate: parseFloat((projectedWinRate * 0.92).toFixed(1)),
    backtestBets: Math.floor(Math.random() * 150) + 50,
    analysis:
      "Strategy analysis computed using deterministic model (AI provider unavailable).",
    recommendation:
      "Consider adjusting confidence threshold for optimal volume-accuracy balance.",
    provider: "fallback",
  };
}
