import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dices, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function MonteCarloSimulator() {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const hasProAccess = subscription?.isActive && (subscription?.tier === "monthly" || subscription?.tier === "yearly");

  const [bankroll, setBankroll] = useState(1000);
  const [winRate, setWinRate] = useState([55]);
  const [betsPerWeek, setBetsPerWeek] = useState([5]);
  const [weeks, setWeeks] = useState([26]);
  const [simulations, setSimulations] = useState([1000]);
  const [kellyFraction, setKellyFraction] = useState([25]);
  const [results, setResults] = useState<any>(null);

  const { mutateAsync: runSim, isPending } = trpc.quant.monteCarlo.useMutation();

  if (!hasProAccess) {
    return (
      <Paywall
        tier="monthly"
        title="Monte Carlo Simulator"
        description="Run thousands of bankroll simulations to understand your risk of ruin and expected growth"
      />
    );
  }

  const handleRun = async () => {
    try {
      const result = await runSim({
        initial_bankroll: bankroll,
        win_rate: winRate[0] / 100,
        avg_odds: -110,
        bets_per_week: betsPerWeek[0],
        weeks: weeks[0],
        simulations: simulations[0],
        kelly_fraction: kellyFraction[0] / 100,
      });
      setResults(result);
    } catch (err: any) {
      toast.error(err.message ?? "Simulation failed");
    }
  };

  // Build chart data from percentile paths
  const chartData = results
    ? Array.from({ length: results.weeks + 1 }, (_, i) => ({
        week: i,
        p10: Math.round(results.percentile_paths.p10[i] ?? 0),
        median: Math.round(results.percentile_paths.p50[i] ?? 0),
        p90: Math.round(results.percentile_paths.p90[i] ?? 0),
      }))
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Dices className="w-8 h-8 text-primary" />
            Monte Carlo Simulator
          </h1>
          <p className="text-muted-foreground mt-1">
            Run {simulations[0].toLocaleString()} simulations to project your bankroll growth and risk of ruin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Simulation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground">Starting Bankroll ($)</Label>
                <Input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(Number(e.target.value))}
                  min={100}
                  max={1000000}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Win Rate: {winRate[0]}%</Label>
                <Slider
                  value={winRate}
                  onValueChange={setWinRate}
                  min={40}
                  max={70}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Bets Per Week: {betsPerWeek[0]}</Label>
                <Slider
                  value={betsPerWeek}
                  onValueChange={setBetsPerWeek}
                  min={1}
                  max={30}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Simulation Length: {weeks[0]} weeks</Label>
                <Slider
                  value={weeks}
                  onValueChange={setWeeks}
                  min={4}
                  max={104}
                  step={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Kelly Fraction: {kellyFraction[0]}%</Label>
                <Slider
                  value={kellyFraction}
                  onValueChange={setKellyFraction}
                  min={5}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  25% Kelly = conservative, 100% = full Kelly (high variance)
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Simulations: {simulations[0].toLocaleString()}</Label>
                <Slider
                  value={simulations}
                  onValueChange={setSimulations}
                  min={100}
                  max={5000}
                  step={100}
                  className="mt-2"
                />
              </div>

              <Button className="w-full" onClick={handleRun} disabled={isPending}>
                {isPending ? "Running..." : "Run Simulation"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!results ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Dices className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Configure parameters and run the simulation</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Median Outcome</p>
                      <p className={`text-xl font-bold mt-1 ${results.median_final_bankroll >= bankroll ? "text-green-400" : "text-red-400"}`}>
                        ${results.median_final_bankroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Median ROI</p>
                      <p className={`text-xl font-bold mt-1 ${results.median_roi_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {results.median_roi_pct >= 0 ? "+" : ""}{results.median_roi_pct.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Risk of Ruin</p>
                      <p className={`text-xl font-bold mt-1 ${results.ruin_probability > 0.1 ? "text-red-400" : "text-green-400"}`}>
                        {(results.ruin_probability * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Best 10%</p>
                      <p className="text-xl font-bold mt-1 text-green-400">
                        ${results.p90_final_bankroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Bankroll chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bankroll Projection (Percentile Paths)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="p90grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="p10grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="week" tick={{ fill: "#9ca3af", fontSize: 11 }} label={{ value: "Week", position: "insideBottom", offset: -5, fill: "#9ca3af" }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="p90" name="Best 10%" stroke="#22c55e" fill="url(#p90grad)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="median" name="Median" stroke="#eab308" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Area type="monotone" dataKey="p10" name="Worst 10%" stroke="#ef4444" fill="url(#p10grad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {results.ruin_probability > 0.15 && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">High Risk of Ruin Detected</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        With a {(results.ruin_probability * 100).toFixed(1)}% ruin probability, consider reducing your Kelly fraction or increasing your win rate threshold. A 25% Kelly fraction is generally recommended for long-term survival.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
