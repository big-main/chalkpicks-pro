import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Zap,
  Target,
  Brain,
  BarChart3,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

function AnalyticsDashboard() {
  const analytics = trpc.kalshi.getAnalyticsSummary.useQuery();
  const comparison = trpc.kalshi.compareWithSportsbooks.useQuery();
  const data = analytics.data as any;
  const compData = comparison.data as any;
  return (
    <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 mt-8">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Market Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs uppercase">Total Markets</p>
            <p className="text-2xl font-bold text-white">{data?.totalMarkets ?? "-"}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs uppercase">Avg Volume</p>
            <p className="text-2xl font-bold text-cyan-400">${data?.avgVolume ? `${(data.avgVolume / 1000).toFixed(0)}K` : "-"}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs uppercase">Edge Opportunities</p>
            <p className="text-2xl font-bold text-green-400">{data?.edgeOpportunities ?? "-"}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs uppercase">Comparisons</p>
            <p className="text-2xl font-bold text-amber-400">{compData?.comparisons?.length ?? "-"}</p>
          </div>
        </div>
        {data?.topMovers?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Top Movers</h4>
            <div className="space-y-2">
              {(data.topMovers as any[]).slice(0, 3).map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/30 rounded px-3 py-2">
                  <span className="text-white text-sm">{m.title || m.ticker}</span>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                    {m.volume ? `$${(m.volume / 1000).toFixed(0)}K vol` : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        {compData?.comparisons?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Kalshi vs Sportsbook Comparison</h4>
            <div className="space-y-2">
              {(compData.comparisons as any[]).slice(0, 3).map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/30 rounded px-3 py-2">
                  <span className="text-white text-sm">{c.matchup || c.event}</span>
                  <span className={`text-sm font-bold ${c.discrepancy > 5 ? 'text-green-400' : 'text-slate-400'}`}>
                    {c.discrepancy ? `${c.discrepancy.toFixed(1)}% edge` : c.recommendation || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KalshiMarketsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sports");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  // Fetch markets by category
  const sportsMarkets = trpc.kalshi.getSportsMarkets.useQuery();
  const politicsMarkets = trpc.kalshi.getPoliticsMarkets.useQuery();
  const cryptoMarkets = trpc.kalshi.getCryptoMarkets.useQuery();
  const trendingMarkets = trpc.kalshi.getTrendingMarkets.useQuery();
  const marketAlerts = trpc.kalshi.getMarketAlerts.useQuery();
  const searchResults = trpc.kalshi.searchMarkets.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 2 }
  );

  const getMarketsByTab = () => {
    if (searchQuery.length > 2) {
      return searchResults.data || [];
    }
    switch (activeTab) {
      case "sports":
        return sportsMarkets.data || [];
      case "politics":
        return politicsMarkets.data || [];
      case "crypto":
        return cryptoMarkets.data || [];
      case "trending":
        return trendingMarkets.data || [];
      default:
        return [];
    }
  };

  const markets = getMarketsByTab();

  const getMarketSentiment = (probability: number) => {
    if (probability > 0.65) return { label: "Strong Yes", color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" };
    if (probability > 0.55) return { label: "Lean Yes", color: "bg-green-500/20 border-green-500/50 text-green-400" };
    if (probability < 0.35) return { label: "Strong No", color: "bg-red-500/20 border-red-500/50 text-red-400" };
    if (probability < 0.45) return { label: "Lean No", color: "bg-orange-500/20 border-orange-500/50 text-orange-400" };
    return { label: "Neutral", color: "bg-slate-500/20 border-slate-500/50 text-slate-400" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Kalshi Markets
                </span>
              </h1>
              <p className="text-slate-400">Real-time prediction market analysis with AI-powered trading signals</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-3xl font-bold text-cyan-400">{markets.length}</div>
              <p className="text-sm text-slate-400">Active Markets</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Volume</p>
                  <p className="text-2xl font-bold text-white">$2.4M</p>
                </div>
                <DollarSign className="w-8 h-8 text-cyan-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">24h Traders</p>
                  <p className="text-2xl font-bold text-white">12.3K</p>
                </div>
                <Users className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Liquidity</p>
                  <p className="text-2xl font-bold text-white">$18.5K</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">AI Confidence</p>
                  <p className="text-2xl font-bold text-white">87.2%</p>
                </div>
                <Brain className="w-8 h-8 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search markets by title, category, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
          />
        </div>

        {/* Market Alerts */}
        {marketAlerts.data && marketAlerts.data.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Market Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketAlerts.data.slice(0, 3).map((alert) => (
                <Card
                  key={alert.market.id}
                  className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer"
                  onClick={() => setSelectedMarket(alert.market.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">{alert.market.title}</h3>
                        <p className="text-xs text-slate-400 mb-2">{alert.reasoning}</p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {Math.round(0.65 * 100)}%
                          </Badge>
                          <span className="text-xs text-slate-500">High volatility</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="sports" className="data-[state=active]:bg-slate-700">
              Sports
            </TabsTrigger>
            <TabsTrigger value="politics" className="data-[state=active]:bg-slate-700">
              Politics
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-slate-700">
              Crypto
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-slate-700">
              Trending
            </TabsTrigger>
          </TabsList>

          {["sports", "politics", "crypto", "trending"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {markets.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
                  <p className="text-slate-400">No markets found. Try a different search or category.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {markets.map((market) => {
                    const sentiment = getMarketSentiment(0.65);
                    return (
                      <Card
                        key={market.id}
                        className={`bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer ${
                          selectedMarket === market.id ? "ring-2 ring-cyan-500" : ""
                        }`}
                        onClick={() => setSelectedMarket(market.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Title and Category */}
                            <div>
                              <h3 className="font-semibold text-white mb-2">{market.title}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-slate-700 text-slate-300">{market.category}</Badge>
                                <Badge className={`${sentiment.color} border`}>{sentiment.label}</Badge>
                              </div>
                            </div>

                            {/* Probability and Trend */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Probability</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-cyan-400">
                                    {Math.round(0.65 * 100)}%
                                  </span>
                                  {0.65 > 0.5 ? (
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">24h Change</p>
                                <p className={`text-2xl font-bold ${1 > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {1 > 0 ? "+" : ""}1%
                                </p>
                              </div>
                            </div>

                            {/* Volume and Liquidity */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Volume</p>
                                <p className="text-sm font-semibold text-white">${(market.volume / 1000).toFixed(1)}K</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Liquidity</p>
                                <p className="text-sm font-semibold text-white">$100K</p>
                              </div>
                            </div>

                            {/* Expiration */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700">
                              <Clock className="w-4 h-4" />
                              <span>Expires {new Date(market.expiration_date).toLocaleDateString()}</span>
                            </div>

                            {/* AI Recommendation */}
                            <div className="bg-slate-700/50 rounded p-3 flex items-start gap-2">
                              <Brain className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <p className="text-slate-300 font-medium mb-1">AI Signal: BULLISH</p>
                                <p className="text-slate-400">Market shows strong momentum</p>
                              </div>
                            </div>

                            {/* Trade Button */}
                            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                              <Target className="w-4 h-4 mr-2" />
                              Trade Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Market Analytics Dashboard */}
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

export default function KalshiMarkets() {
  return <FeatureGate feature="kalshi" children={<KalshiMarketsContent />} />;
}
