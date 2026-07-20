import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart3, Play, TrendingUp, TrendingDown, Target, DollarSign, Activity, AlertTriangle, Zap } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";

const SPORTS = [
  { key: "nfl", name: "NFL" },
  { key: "nba", name: "NBA" },
  { key: "mlb", name: "MLB" },
  { key: "nhl", name: "NHL" },
];

const PICK_TYPES = [
  { key: "all", name: "All Types" },
  { key: "moneyline", name: "Moneyline" },
  { key: "spread", name: "Spread" },
  { key: "over_under", name: "Over/Under" },
  { key: "player_prop", name: "Player Props" },
];

export default function Backtesting() {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [sport, setSport] = useState("nfl");
  const [pickType, setPickType] = useState("all");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [minConfidence, setMinConfidence] = useState([70]);
  const [bankroll, setBankroll] = useState([10000]);
  const [stakePerBet, setStakePerBet] = useState([100]);
  const [minEV, setMinEV] = useState([3]);
  const [strategy, setStrategy] = useState<"kelly" | "quarter_kelly" | "flat">("kelly");
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const hasProAccess = subscription?.isActive && (subscription?.tier === "monthly" || subscription?.tier === "yearly");

  if (!hasProAccess) {
    return <Paywall tier="monthly" title="Backtesting Engine" description="Test your strategies against historical data with real Kelly sizing from the Python quant sidecar" />;
  }

  const { mutateAsync: runBacktestMutation } = trpc.backtest.run.useMutation();

  const runBacktest = async () => {
    if (dateFrom >= dateTo) {
      toast.error("'Date From' must be before 'Date To'");
      return;
    }
    setIsRunning(true);
    setResults(null);
    try {
      const result = await runBacktestMutation({
        name: `${sport.toUpperCase()} ${strategy} Backtest`,
        sportKey: sport,
        pickType: pickType === "all" ? undefined : pickType,
        minConfidence: minConfidence[0],
        dateFrom,
        dateTo,
        initialBankroll: bankroll[0],
        stakePerBet: stakePerBet[0],
        strategy,
      });
      setResults(result);
      const isQuantSidecar = (result as any).source === "quant_sidecar";
      toast.success(isQuantSidecar ? "⚡ Quant sidecar backtest complete!" : "Backtest complete (simulation mode)");
    } catch (error: any) {
      toast.error(error?.message ?? "Backtest failed");
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const isQuantResult = results?.source === "quant_sidecar";
  const winRateDisplay = results ? (results.winRate < 1 ? (results.winRate * 100).toFixed(1) : results.winRate.toFixed(1)) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 pb-16">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Backtesting Engine</h1>
              {isQuantResult && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Zap className="w-3 h-3 mr-1" /> Quant Sidecar
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Test Kelly/Quarter-Kelly sizing strategies via the Python quant sidecar (Elo engine + Monte Carlo)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sport</Label>
                  <Select value={sport} onValueChange={setSport}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPORTS.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pick Type</Label>
                  <Select value={pickType} onValueChange={setPickType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PICK_TYPES.map(t => (
                        <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                <div>
                  <Label>To Date</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>

                <div>
                  <Label>Min Confidence: {minConfidence[0]}%</Label>
                  <Slider value={minConfidence} onValueChange={setMinConfidence} min={50} max={95} step={5} />
                </div>

                <div>
                  <Label>Min EV: {minEV[0]}%</Label>
                  <Slider value={minEV} onValueChange={setMinEV} min={1} max={10} step={0.5} />
                </div>

                <div>
                  <Label className="mb-2 block">Betting Strategy</Label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as typeof strategy)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kelly">Full Kelly ⚡</SelectItem>
                      <SelectItem value="quarter_kelly">Quarter Kelly ⚡</SelectItem>
                      <SelectItem value="flat">Flat Betting</SelectItem>
                    </SelectContent>
                  </Select>
                  {(strategy === "kelly" || strategy === "quarter_kelly") && (
                    <p className="text-xs text-emerald-400 mt-1">⚡ Real Kelly sizing via Python quant sidecar</p>
                  )}
                </div>

                <div>
                  <Label>Starting Bankroll: ${bankroll[0].toLocaleString()}</Label>
                  <Slider value={bankroll} onValueChange={setBankroll} min={1000} max={50000} step={1000} />
                </div>

                <div>
                  <Label>Flat Stake: ${stakePerBet[0]}</Label>
                  <Slider value={stakePerBet} onValueChange={setStakePerBet} min={10} max={1000} step={10} />
                </div>

                <Button onClick={runBacktest} className="w-full" size="lg" disabled={isRunning}>
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "Running..." : "Run Backtest"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {!results && !isRunning && (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-1">Configure and run a backtest</p>
                    <p className="text-sm">Kelly/Quarter-Kelly strategies use the live Python quant sidecar with Elo ratings</p>
                  </CardContent>
                </Card>
              )}

              {isRunning && (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Running quant backtest...</p>
                  </CardContent>
                </Card>
              )}

              {results && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Target className="w-4 h-4" /> Total Bets
                        </div>
                        <div className="text-3xl font-bold">{results.totalPicks}</div>
                        <div className="text-xs text-muted-foreground mt-1">{results.wins}W / {results.losses}L</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Activity className="w-4 h-4" /> Win Rate
                        </div>
                        <div className={`text-3xl font-bold ${Number(winRateDisplay) >= 52 ? "text-emerald-400" : "text-red-400"}`}>
                          {winRateDisplay}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <TrendingUp className="w-4 h-4" /> ROI
                        </div>
                        <div className={`text-3xl font-bold ${results.roi > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {results.roi?.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <DollarSign className="w-4 h-4" /> Net P&L
                        </div>
                        <div className={`text-3xl font-bold ${(results.totalProfit ?? results.profit ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          ${(results.totalProfit ?? results.profit ?? 0).toFixed(0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quant-specific metrics */}
                  {isQuantResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-emerald-500/20">
                        <CardContent className="pt-6">
                          <div className="text-sm text-muted-foreground mb-1">Starting Bankroll</div>
                          <div className="text-xl font-bold">${results.startingBankroll?.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-emerald-500/20">
                        <CardContent className="pt-6">
                          <div className="text-sm text-muted-foreground mb-1">Ending Bankroll</div>
                          <div className={`text-xl font-bold ${results.endingBankroll >= results.startingBankroll ? "text-emerald-400" : "text-red-400"}`}>
                            ${results.endingBankroll?.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-500/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <AlertTriangle className="w-3 h-3" /> Max Drawdown
                          </div>
                          <div className="text-xl font-bold text-orange-400">{results.maxDrawdownPct?.toFixed(1)}%</div>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-500/20">
                        <CardContent className="pt-6">
                          <div className="text-sm text-muted-foreground mb-1">Sharpe Ratio</div>
                          <div className={`text-xl font-bold ${results.sharpeRatio > 0 ? "text-blue-400" : "text-red-400"}`}>
                            {results.sharpeRatio?.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Bankroll Curve Chart */}
                  {results.results && results.results.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Bankroll Curve
                          {isQuantResult && <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">Live Quant Data</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={results.results}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(results.results.length / 8)} />
                            <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value: any, name: string) => [
                                name === "bankroll" ? `$${Number(value).toLocaleString()}` : `$${Number(value).toFixed(2)}`,
                                name === "bankroll" ? "Bankroll" : "Cumulative P&L"
                              ]}
                            />
                            <ReferenceLine y={results.startingBankroll ?? bankroll[0]} stroke="#666" strokeDasharray="4 4" />
                            <Area
                              type="monotone"
                              dataKey="bankroll"
                              stroke="#22c55e"
                              fill="#22c55e"
                              fillOpacity={0.1}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Bets Table (quant sidecar only) */}
                  {isQuantResult && results.recentBets && results.recentBets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Recent Bets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-muted-foreground">
                                <th className="text-left py-2 pr-4">Date</th>
                                <th className="text-right py-2 pr-4">Odds</th>
                                <th className="text-right py-2 pr-4">Edge</th>
                                <th className="text-right py-2 pr-4">Bet Size</th>
                                <th className="text-right py-2 pr-4">Bankroll After</th>
                                <th className="text-right py-2">Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.recentBets.slice(0, 15).map((bet: any, i: number) => (
                                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="py-2 pr-4 text-muted-foreground">{bet.date}</td>
                                  <td className="py-2 pr-4 text-right font-mono">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</td>
                                  <td className="py-2 pr-4 text-right text-blue-400">+{bet.edge?.toFixed(1)}%</td>
                                  <td className="py-2 pr-4 text-right">${bet.betSize?.toFixed(0)}</td>
                                  <td className="py-2 pr-4 text-right">${bet.bankrollAfter?.toLocaleString()}</td>
                                  <td className="py-2 text-right">
                                    {bet.won ? (
                                      <span className="text-emerald-400 flex items-center justify-end gap-1">
                                        <TrendingUp className="w-3 h-3" /> W
                                      </span>
                                    ) : (
                                      <span className="text-red-400 flex items-center justify-end gap-1">
                                        <TrendingDown className="w-3 h-3" /> L
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
