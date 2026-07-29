import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
} from "lucide-react";

interface MonteCarloData {
  medianROI: number;
  meanROI: number;
  p5ROI: number;
  p95ROI: number;
  maxDrawdown: number;
  ruinProbability: number;
  sharpeRatio: number;
  winRate: number;
  clvBeatRate: number;
  sampleSize: number;
  simulations: number;
  // Optional: distribution data for histogram
  distribution?: number[];
}

interface MonteCarloVizProps {
  data: MonteCarloData;
  title?: string;
}

/**
 * Monte Carlo Backtesting Results Visualization
 * Shows histogram of ROI distribution with percentile bands and key metrics
 */
export function MonteCarloViz({
  data,
  title = "Monte Carlo Simulation",
}: MonteCarloVizProps) {
  // Generate histogram bins from distribution or from summary stats
  const histogramData = useMemo(() => {
    if (data.distribution && data.distribution.length > 0) {
      // Bin the raw distribution data
      const min = Math.min(...data.distribution);
      const max = Math.max(...data.distribution);
      const binCount = 30;
      const binWidth = (max - min) / binCount;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        binStart: min + i * binWidth,
        binEnd: min + (i + 1) * binWidth,
        label: `${(min + i * binWidth).toFixed(1)}%`,
        count: 0,
        isP5: false,
        isP95: false,
        isMedian: false,
      }));
      for (const val of data.distribution) {
        const idx = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
        bins[idx].count++;
      }
      // Mark percentile bins
      for (const bin of bins) {
        const mid = (bin.binStart + bin.binEnd) / 2;
        if (Math.abs(mid - data.p5ROI) < binWidth) bin.isP5 = true;
        if (Math.abs(mid - data.p95ROI) < binWidth) bin.isP95 = true;
        if (Math.abs(mid - data.medianROI) < binWidth) bin.isMedian = true;
      }
      return bins;
    }

    // Synthesize a normal-ish distribution from summary stats
    const mean = data.meanROI;
    const spread = (data.p95ROI - data.p5ROI) / 3.29; // ~std dev from 5th-95th
    const binCount = 25;
    const min = data.p5ROI - spread;
    const max = data.p95ROI + spread;
    const binWidth = (max - min) / binCount;

    return Array.from({ length: binCount }, (_, i) => {
      const x = min + (i + 0.5) * binWidth;
      const z = (x - mean) / spread;
      const count = Math.round(
        (data.simulations / binCount) * Math.exp(-0.5 * z * z) * 1.5
      );
      return {
        binStart: min + i * binWidth,
        binEnd: min + (i + 1) * binWidth,
        label: `${(min + i * binWidth).toFixed(0)}%`,
        count: Math.max(0, count),
        isP5: Math.abs(x - data.p5ROI) < binWidth,
        isP95: Math.abs(x - data.p95ROI) < binWidth,
        isMedian: Math.abs(x - data.medianROI) < binWidth,
      };
    });
  }, [data]);

  // Color function for bars
  const getBarColor = (entry: (typeof histogramData)[0]) => {
    if (entry.isMedian) return "#f0b800";
    const mid = (entry.binStart + entry.binEnd) / 2;
    if (mid < 0) return "rgba(239, 68, 68, 0.6)";
    if (mid > data.p95ROI * 0.8) return "rgba(34, 197, 94, 0.8)";
    return "rgba(34, 197, 94, 0.4)";
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-gold" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {data.simulations.toLocaleString()} sims
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MetricCard
            label="Median ROI"
            value={`${data.medianROI >= 0 ? "+" : ""}${data.medianROI.toFixed(1)}%`}
            color={data.medianROI >= 0 ? "text-green-400" : "text-red-400"}
            icon={data.medianROI >= 0 ? TrendingUp : TrendingDown}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={data.sharpeRatio.toFixed(2)}
            color={
              data.sharpeRatio >= 1
                ? "text-green-400"
                : data.sharpeRatio >= 0.5
                  ? "text-yellow-400"
                  : "text-red-400"
            }
            icon={Target}
          />
          <MetricCard
            label="Max Drawdown"
            value={`-${data.maxDrawdown.toFixed(1)}%`}
            color="text-red-400"
            icon={TrendingDown}
          />
          <MetricCard
            label="Ruin Prob"
            value={`${(data.ruinProbability * 100).toFixed(1)}%`}
            color={
              data.ruinProbability < 0.05 ? "text-green-400" : "text-red-400"
            }
            icon={AlertTriangle}
          />
        </div>

        {/* Histogram */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histogramData}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "rgba(180,180,210,0.6)" }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "rgba(180,180,210,0.6)" }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.95)",
                  border: "1px solid rgba(240,184,0,0.3)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`${value} simulations`, "Count"]}
                labelFormatter={label => `ROI: ${label}`}
              />
              <ReferenceLine
                x={histogramData.find(b => b.isMedian)?.label}
                stroke="#f0b800"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: "Median",
                  position: "top",
                  fontSize: 9,
                  fill: "#f0b800",
                }}
              />
              <Bar
                dataKey="count"
                radius={[2, 2, 0, 0]}
                fill="rgba(34, 197, 94, 0.5)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Percentile Band Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-400 rounded" />
            <span>5th: {data.p5ROI.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-brand-gold rounded" />
            <span>Median: {data.medianROI.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-green-400 rounded" />
            <span>95th: {data.p95ROI.toFixed(1)}%</span>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/30">
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {(data.winRate * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {(data.clvBeatRate * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground">CLV Beat</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {data.sampleSize}
            </div>
            <div className="text-[10px] text-muted-foreground">Sample</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-2 bg-background/30 rounded-lg border border-border/20 text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${color}`} />
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
