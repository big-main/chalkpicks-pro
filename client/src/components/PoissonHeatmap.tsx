import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Target } from "lucide-react";

interface PoissonMatrixData {
  matrix: number[][];
  winProb: number;
  drawProb: number;
  lossProb: number;
  overProb: Record<string, number>;
  underProb: Record<string, number>;
  mostLikelyScore: { scoreA: number; scoreB: number; probability: number };
  lambdaA: number;
  lambdaB: number;
}

interface PoissonHeatmapProps {
  data: PoissonMatrixData;
  teamA?: string;
  teamB?: string;
  title?: string;
}

/**
 * Poisson Matrix Heatmap Visualization
 * Displays score probability distributions as an interactive heatmap grid
 */
export function PoissonHeatmap({
  data,
  teamA = "Home",
  teamB = "Away",
  title = "Score Probability Matrix",
}: PoissonHeatmapProps) {
  const maxScore = data.matrix.length;

  // Find max probability for color scaling
  const maxProb = useMemo(() => {
    let max = 0;
    for (const row of data.matrix) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  }, [data.matrix]);

  // Color interpolation from dark to bright
  const getCellColor = (prob: number) => {
    const intensity = prob / maxProb;
    if (intensity < 0.1) return "rgba(15, 23, 42, 0.8)";
    if (intensity < 0.3) return `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`;
    if (intensity < 0.6) return `rgba(34, 197, 94, ${0.2 + intensity * 0.4})`;
    if (intensity < 0.8) return `rgba(240, 184, 0, ${0.3 + intensity * 0.4})`;
    return `rgba(240, 184, 0, ${0.5 + intensity * 0.5})`;
  };

  const getTextColor = (prob: number) => {
    const intensity = prob / maxProb;
    if (intensity < 0.1) return "rgba(180, 180, 210, 0.3)";
    if (intensity < 0.5) return "rgba(255, 255, 255, 0.7)";
    return "rgba(255, 255, 255, 0.95)";
  };

  // Display only first 8 scores for readability
  const displaySize = Math.min(maxScore, 8);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-brand-gold" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {teamA} {data.lambdaA.toFixed(1)} | {teamB}{" "}
            {data.lambdaB.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Win/Draw/Loss Probabilities */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
            <div className="text-sm font-bold text-green-400">
              {(data.winProb * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">{teamA} Win</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
            <div className="text-sm font-bold text-yellow-400">
              {(data.drawProb * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Draw</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
            <div className="text-sm font-bold text-red-400">
              {(data.lossProb * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">{teamB} Win</div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Column Headers (Team B scores) */}
            <div className="flex items-center mb-1">
              <div className="w-10 h-6 flex items-center justify-center text-[9px] text-muted-foreground font-semibold">
                {teamA}\{teamB}
              </div>
              {Array.from({ length: displaySize }, (_, i) => (
                <div
                  key={`col-${i}`}
                  className="w-10 h-6 flex items-center justify-center text-[10px] text-muted-foreground font-mono"
                >
                  {i}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {data.matrix.slice(0, displaySize).map((row, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex items-center">
                {/* Row Header (Team A score) */}
                <div className="w-10 h-10 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                  {rowIdx}
                </div>
                {/* Cells */}
                {row.slice(0, displaySize).map((prob, colIdx) => {
                  const isMostLikely =
                    rowIdx === data.mostLikelyScore.scoreA &&
                    colIdx === data.mostLikelyScore.scoreB;
                  return (
                    <div
                      key={`cell-${rowIdx}-${colIdx}`}
                      className={`w-10 h-10 flex items-center justify-center text-[9px] font-mono rounded-sm m-[1px] transition-all hover:scale-110 hover:z-10 cursor-default ${
                        isMostLikely ? "ring-1 ring-brand-gold" : ""
                      }`}
                      style={{
                        backgroundColor: getCellColor(prob),
                        color: getTextColor(prob),
                      }}
                      title={`${teamA} ${rowIdx} - ${teamB} ${colIdx}: ${(prob * 100).toFixed(2)}%`}
                    >
                      {prob >= 0.01
                        ? (prob * 100).toFixed(1)
                        : prob >= 0.001
                          ? (prob * 100).toFixed(2)
                          : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Most Likely Score */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border/30">
          <Target className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-xs text-muted-foreground">Most likely:</span>
          <span className="text-sm font-bold text-white">
            {teamA} {data.mostLikelyScore.scoreA} - {teamB}{" "}
            {data.mostLikelyScore.scoreB}
          </span>
          <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[9px]">
            {(data.mostLikelyScore.probability * 100).toFixed(1)}%
          </Badge>
        </div>

        {/* Over/Under Probabilities */}
        {Object.keys(data.overProb).length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Over/Under Probabilities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(data.overProb)
                .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                .slice(0, 4)
                .map(([total, prob]) => (
                  <div
                    key={total}
                    className="text-center p-1.5 bg-background/30 rounded border border-border/20"
                  >
                    <div className="text-[10px] text-muted-foreground">
                      O/U {total}
                    </div>
                    <div className="flex justify-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-green-400">
                        O {(prob * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] font-mono text-red-400">
                        U {((1 - prob) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
