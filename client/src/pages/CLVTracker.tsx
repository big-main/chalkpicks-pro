import { useEffect, useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

export default function CLVTracker() {
  const { data: stats, isLoading: statsLoading } = trpc.clv.getClvStats.useQuery();
  const { data: byBetType, isLoading: byTypeLoading } = trpc.clv.getClvByBetType.useQuery();
  const { data: bestBets } = trpc.clv.getBestClvBets.useQuery();
  const { data: worstBets } = trpc.clv.getWorstClvBets.useQuery();
  const { data: insights } = trpc.clv.getClvInsights.useQuery();

  if (statsLoading) {
    return <div className="text-center py-12">Loading CLV data...</div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No bet data available. Start tracking your bets to see CLV analysis.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CLV Tracker</h1>
          <p className="text-cyan-400">Analyze your closing line value performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalBets}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.betsWithCLV} with CLV data ({((stats.betsWithCLV / stats.totalBets) * 100).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Average CLV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.averageCLV > 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.averageCLV.toFixed(2)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.positiveCLVBets} positive, {stats.negativeCLVBets} negative
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.winRateOverall.toFixed(1)}%</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.winningBets}W / {stats.losingBets}L / {stats.pushBets}P
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                ${stats.totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                +${stats.profitWithPositiveCLV.toFixed(0)} / -${Math.abs(stats.profitWithNegativeCLV).toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {insights.map((insight, idx) => (
              <Card
                key={idx}
                className={`border-l-4 ${
                  insight.severity === "success"
                    ? "border-l-green-500 bg-slate-800"
                    : insight.severity === "warning"
                      ? "border-l-yellow-500 bg-slate-800"
                      : "border-l-blue-500 bg-slate-800"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400">{insight.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="clv" className="mb-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="clv">CLV Distribution</TabsTrigger>
            <TabsTrigger value="winrate">Win Rates</TabsTrigger>
            <TabsTrigger value="bettype">By Bet Type</TabsTrigger>
          </TabsList>

          <TabsContent value="clv">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>CLV Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clvChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winrate">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Win Rate Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={winRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                    <Bar dataKey="rate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bettype">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Performance by Bet Type</CardTitle>
              </CardHeader>
              <CardContent>
                {byTypeLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : byBetType && byBetType.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-2 text-slate-400">Bet Type</th>
                          <th className="text-right py-2 px-2 text-slate-400">Count</th>
                          <th className="text-right py-2 px-2 text-slate-400">Win Rate</th>
                          <th className="text-right py-2 px-2 text-slate-400">Avg CLV</th>
                          <th className="text-right py-2 px-2 text-slate-400">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byBetType.map((bt: any) => (
                          <tr key={bt.betType} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-2 px-2 text-slate-300">{bt.betType}</td>
                            <td className="text-right py-2 px-2 text-slate-300">{bt.count}</td>
                            <td className="text-right py-2 px-2 text-slate-300">{bt.winRate.toFixed(1)}%</td>
                            <td className={`text-right py-2 px-2 ${bt.averageCLV > 0 ? "text-green-400" : "text-red-400"}`}>
                              {bt.averageCLV.toFixed(2)}%
                            </td>
                            <td className={`text-right py-2 px-2 ${bt.totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                              ${bt.totalProfit.toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Best & Worst Bets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Best CLV Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bestBets && bestBets.length > 0 ? (
                <div className="space-y-3">
                  {bestBets.slice(0, 5).map((bet: any) => (
                    <div key={bet.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                      <div>
                        <p className="text-sm text-slate-300">{bet.description}</p>
                        <p className="text-xs text-slate-500">{bet.betType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">+{bet.clvValue?.toFixed(2)}%</p>
                        <p className="text-xs text-slate-500">{bet.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No bets with CLV data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Worst CLV Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worstBets && worstBets.length > 0 ? (
                <div className="space-y-3">
                  {worstBets.slice(0, 5).map((bet: any) => (
                    <div key={bet.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
                      <div>
                        <p className="text-sm text-slate-300">{bet.description}</p>
                        <p className="text-xs text-slate-500">{bet.betType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">{bet.clvValue?.toFixed(2)}%</p>
                        <p className="text-xs text-slate-500">{bet.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No bets with CLV data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
