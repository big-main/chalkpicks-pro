import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { BarChart3, Play, Lock, TrendingUp, Target, DollarSign, Trophy } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { toast } from "sonner";

const SPORTS = [
  { key: "all", name: "All Sports" },
  { key: "nfl", name: "NFL 🏈" },
  { key: "nba", name: "NBA 🏀" },
  { key: "mlb", name: "MLB ⚾" },
  { key: "nhl", name: "NHL 🏒" },
];

const PICK_TYPES = [
  { key: "all", name: "All Types" },
  { key: "moneyline", name: "Moneyline" },
  { key: "spread", name: "Spread" },
  { key: "over_under", name: "Over/Under" },
  { key: "player_prop", name: "Player Props" },
];

export default function Backtesting() {
  const { isAuthenticated, user } = useAuth();
  const isPremium = isAuthenticated && user?.subscriptionTier !== "free";

  const [sport, setSport] = useState("all");
  const [pickType, setPickType] = useState("all");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [minConfidence, setMinConfidence] = useState([70]);
  const [bankroll, setBankroll] = useState([1000]);
  const [stakePerBet, setStakePerBet] = useState([100]);
  const [results, setResults] = useState<any>(null);

  // Demo data for non-premium users
  const { data: demoData } = trpc.backtest.demo.useQuery({
    sportKey: "nfl",
    minConfidence: 70,
  });

  const runBacktest = trpc.backtest.run.useMutation({
    onSuccess: (data) => {
      setResults(data);
      toast.success("Backtest complete!");
    },
    onError: () => toast.error("Backtest failed. Please try again."),
  });

  const handleRun = () => {
    runBacktest.mutate({
      name: `${sport.toUpperCase()} Strategy — ${new Date().toLocaleDateString()}`,
      sportKey: sport === "all" ? undefined : sport,
      pickType: pickType === "all" ? undefined : pickType,
      dateFrom,
      dateTo,
      minConfidence: minConfidence[0],
      initialBankroll: bankroll[0],
      stakePerBet: stakePerBet[0],
    });
  };

  const displayResults = results ?? demoData;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Badge className="mb-2 bg-blue-400/15 text-blue-400 border-blue-400/30 text-xs">Strategy Engine</Badge>
                <h1 className="font-display text-4xl tracking-wider">
                  BACK<span className="text-gold-gradient">TESTING</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Test any strategy against historical data. Find your edge.</p>
              </div>
              {!isPremium && (
                <Link href="/pricing">
                  <Badge className="badge-premium border-0 cursor-pointer">⭐ Upgrade for Full Access</Badge>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="container py-6">
          {!isPremium ? (
            <>
              {/* Demo Preview */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">Demo Preview — NFL Strategy (70%+ Confidence)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Upgrade to run custom backtests with any parameters</p>
                    </div>
                    <Link href="/pricing">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold flex-shrink-0">
                        Unlock Full Backtesting
                      </Button>
                    </Link>
                  </div>

                  {demoData && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {[
                          { label: "Win Rate", value: `${demoData.winRate}%`, color: "text-accent" },
                          { label: "ROI", value: `+${demoData.roi.toFixed(1)}%`, color: "text-accent" },
                          { label: "Total Picks", value: demoData.totalPicks, color: "text-primary" },
                          { label: "Record", value: `${demoData.wins}-${demoData.losses}`, color: "text-foreground" },
                        ].map(s => (
                          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                            <div className={`font-display text-xl ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={demoData.bankrollHistory}>
                          <defs>
                            <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                          <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Bankroll"]} />
                          <Area type="monotone" dataKey="bankroll" stroke="oklch(0.78 0.18 85)" strokeWidth={2} fill="url(#demoGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Filters Panel */}
              <div className="lg:col-span-1">
                <Card className="bg-card border-border sticky top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> Strategy Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Sport</Label>
                      <Select value={sport} onValueChange={setSport}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{SPORTS.map(s => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Pick Type</Label>
                      <Select value={pickType} onValueChange={setPickType}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{PICK_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Date From</Label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Date To</Label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Min Confidence: <span className="text-primary font-bold">{minConfidence[0]}%</span>
                      </Label>
                      <Slider value={minConfidence} onValueChange={setMinConfidence} min={50} max={95} step={5} className="w-full" />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Starting Bankroll: <span className="text-primary font-bold">${bankroll[0].toLocaleString()}</span>
                      </Label>
                      <Slider value={bankroll} onValueChange={setBankroll} min={100} max={10000} step={100} className="w-full" />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Stake Per Bet: <span className="text-primary font-bold">${stakePerBet[0]}</span>
                      </Label>
                      <Slider value={stakePerBet} onValueChange={setStakePerBet} min={10} max={500} step={10} className="w-full" />
                    </div>

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                      onClick={handleRun}
                      disabled={runBacktest.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {runBacktest.isPending ? "Running..." : "Run Backtest"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2 space-y-5">
                {!results && !runBacktest.isPending ? (
                  <Card className="bg-card border-border">
                    <CardContent className="p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">Configure & Run Your Backtest</h3>
                      <p className="text-sm text-muted-foreground">Set your strategy parameters on the left and click Run Backtest to see historical performance.</p>
                    </CardContent>
                  </Card>
                ) : runBacktest.isPending ? (
                  <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
                ) : displayResults ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Win Rate", value: `${displayResults.winRate}%`, icon: Target, color: "text-accent" },
                        { label: "ROI", value: `${displayResults.roi > 0 ? "+" : ""}${displayResults.roi.toFixed(1)}%`, icon: TrendingUp, color: displayResults.roi > 0 ? "text-accent" : "text-red-400" },
                        { label: "Total Profit", value: `$${Math.round(displayResults.totalProfit).toLocaleString()}`, icon: DollarSign, color: displayResults.totalProfit > 0 ? "text-accent" : "text-red-400" },
                        { label: "Total Picks", value: displayResults.totalPicks, icon: Trophy, color: "text-primary" },
                      ].map(s => (
                        <Card key={s.label} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                              <span className="text-xs text-muted-foreground">{s.label}</span>
                            </div>
                            <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2"><CardTitle className="text-base">Bankroll Growth</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={displayResults.bankrollHistory}>
                            <defs>
                              <linearGradient id="bankrollGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                            <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                            <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                            <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Bankroll"]} />
                            <Area type="monotone" dataKey="bankroll" stroke="oklch(0.78 0.18 85)" strokeWidth={2} fill="url(#bankrollGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
