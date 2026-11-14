import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { trpc } from "../lib/trpc";
import { FeatureGate } from "@/components/FeatureGate";

function CLVTrackerContent() {
  const { data: stats, isLoading: statsLoading } = trpc.clv.getClvStats.useQuery(undefined, { staleTime: 30_000, refetchInterval: 120_000 });
  const { data: byBetType, isLoading: byTypeLoading } = trpc.clv.getClvByBetType.useQuery(undefined, { staleTime: 30_000, refetchInterval: 120_000 });
  const { data: bestBets } = trpc.clv.getBestClvBets.useQuery(undefined, { staleTime: 30_000, refetchInterval: 120_000 });
  const { data: worstBets } = trpc.clv.getWorstClvBets.useQuery(undefined, { staleTime: 30_000, refetchInterval: 120_000 });
  const { data: insights } = trpc.clv.getClvInsights.useQuery(undefined, { staleTime: 30_000, refetchInterval: 120_000 });

  if (statsLoading) {
    return <div className="container py-12 text-center text-muted-foreground">Loading CLV data…</div>;
  }

  if (!stats) {
    return (
      <div className="container py-12">
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">No bet data available yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Start tracking entries and closing prices to build a meaningful CLV sample.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clvChartData = [
    { name: "Positive CLV", value: stats.positiveCLVBets, fill: "#10b981" },
    { name: "Negative CLV", value: stats.negativeCLVBets, fill: "#ef4444" },
    { name: "No CLV Data", value: stats.totalBets - stats.betsWithCLV, fill: "#6b7280" },
  ];

  const winRateData = [
    { name: "Overall", rate: stats.winRateOverall },
    { name: "Positive CLV", rate: stats.winRateWithPositiveCLV },
    { name: "Negative CLV", rate: stats.winRateWithNegativeCLV },
    { name: "Sharp Money", rate: stats.winRateWithSharpMoney },
  ];

  return (
    <div className="container py-10 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">CLV Tracker</h1>
          <p className="text-brand-blue">Analyze your closing line value performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalBets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.betsWithCLV} with CLV data ({(stats.totalBets > 0 ? (stats.betsWithCLV / stats.totalBets) * 100 : 0).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Positive CLV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-green">{stats.positiveCLVBets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.positiveCLVBets > 0 ? ((stats.positiveCLVBets / stats.totalBets) * 100).toFixed(0) : 0}% of bets
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate (Pos CLV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-blue">{stats.winRateWithPositiveCLV.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">When you had positive edge</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROI (Pos CLV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.profitWithPositiveCLV.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Return on positive edge bets</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="distribution" className="mb-8">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="winrate">Win Rate</TabsTrigger>
            <TabsTrigger value="bytype">By Bet Type</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            <Card className="bg-card border-border p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clvChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="winrate">
            <Card className="bg-card border-border p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="bytype">
            <Card className="bg-card border-border p-6">
              <div className="space-y-4">
                {byBetType && byBetType.map((type) => (
                  <div key={type.betType} className="p-4 bg-secondary rounded border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground capitalize">{type.betType}</h3>
                      <span className="text-sm text-muted-foreground">{type.count} bets</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg CLV</p>
                        <p className={type.averageCLV >= 0 ? "text-brand-green font-semibold" : "text-brand-red font-semibold"}>
                          {type.averageCLV.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="text-brand-blue font-semibold">{type.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className={type.totalProfit >= 0 ? "text-purple-400 font-semibold" : "text-brand-red font-semibold"}>
                          {(type.totalProfit / (type.count * 100)).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Best & Worst Bets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-green">
                <TrendingUp className="w-5 h-5" />
                Best CLV Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bestBets && bestBets.map((bet, idx) => (
                  <div key={idx} className="p-3 bg-secondary rounded border border-brand-green/20">
                    <p className="text-sm text-foreground font-semibold">{bet.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Stake: ${Number(bet.stake).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-red">
                <TrendingDown className="w-5 h-5" />
                Worst CLV Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {worstBets && worstBets.map((bet, idx) => (
                  <div key={idx} className="p-3 bg-secondary rounded border border-brand-red/20">
                    <p className="text-sm text-foreground font-semibold">{bet.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Stake: ${Number(bet.stake).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {insights && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-blue">
                <Target className="w-5 h-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(insights) ? (
                <ul className="space-y-2">
                  {insights.map((insight: any, idx: number) => (
                    <li key={idx} className="text-muted-foreground text-sm">
                      <strong>{insight.title}:</strong> {insight.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground leading-relaxed">{insights}</p>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default function CLVTracker() {
  return (
    <FeatureGate feature="clvTracker">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="page-top">
          <CLVTrackerContent />
        </main>
      </div>
    </FeatureGate>
  );
}
