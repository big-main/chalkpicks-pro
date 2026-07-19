import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureGate } from "@/components/FeatureGate";
import { ArbitrageFilters, type ArbitrageFilterOptions } from "@/components/ArbitrageFilters";
import { PlaceBetButton } from "@/components/PlaceBetButton";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";

function ArbitrageFinderContent() {
  const [selectedArbitrage, setSelectedArbitrage] = useState<number | null>(null);
  const [customOddsA, setCustomOddsA] = useState<string>("-110");
  const [customOddsB, setCustomOddsB] = useState<string>("-110");
  const [customStake, setCustomStake] = useState<string>("100");
  
  // Filter state
  const [filters, setFilters] = useState<ArbitrageFilterOptions>({
    sports: [],
    minProfitMargin: 0.5,
    maxProfitMargin: 5,
    sportsbooks: [],
    minGuaranteedProfit: 10,
    eventTimeRange: "all",
    sortBy: "profit_desc",
    onlyActive: true,
  });
  
  // Legacy minArbitrage state (for backward compatibility)
  const [minArbitrage, setMinArbitrage] = useState<string>("0.5");

  // Fetch opportunities with filters
  const opportunities = trpc.arbitrage.getOpportunities.useQuery({
    sports: filters.sports,
    sportsbooks: filters.sportsbooks,
    minProfitMargin: filters.minProfitMargin,
    maxProfitMargin: filters.maxProfitMargin,
    minGuaranteedProfit: filters.minGuaranteedProfit,
    eventTimeRange: filters.eventTimeRange,
    sortBy: filters.sortBy,
    onlyActive: filters.onlyActive,
    limit: 50,
  });

  // Calculate custom stakes
  const calculateCustom = trpc.arbitrage.calculateStakes.useQuery(
    {
      oddsA: parseFloat(customOddsA) || -110,
      oddsB: parseFloat(customOddsB) || -110,
      totalStake: parseFloat(customStake) || 100,
    },
    { enabled: false }
  );

  // Get stats
  const stats = trpc.arbitrage.getStats.useQuery();

  // Record trade
  const recordTrade = trpc.arbitrage.recordTrade.useMutation();

  const handleCalculate = () => {
    calculateCustom.refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Arbitrage Finder
                </span>
              </h1>
              <p className="text-slate-400">Find guaranteed profit opportunities across sportsbooks</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-3xl font-bold text-brand-gold">{opportunities.data?.length || 0}</div>
              <p className="text-sm text-slate-400">Active Opportunities</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ArbitrageFilters
            filters={filters}
            onFiltersChange={setFilters}
            isLoading={opportunities.isLoading}
          />
        </div>

        {/* Stats Grid */}
        {stats.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{stats.data.totalTrades}</p>
                  </div>
                  <Target className="w-8 h-8 text-brand-gold opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white">{stats.data.completedTrades}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-brand-green opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-white">${stats.data.totalProfit.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-brand-green opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Avg Profit</p>
                    <p className="text-2xl font-bold text-white">${stats.data.averageProfit.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-brand-blue opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="opportunities" className="mb-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-slate-700">
              Live Opportunities
            </TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=active]:bg-slate-700">
              Calculator
            </TabsTrigger>
          </TabsList>

          {/* Live Opportunities */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Input
                type="number"
                placeholder="Min arbitrage %"
                value={minArbitrage}
                onChange={(e) => setMinArbitrage(e.target.value)}
                className="w-40 bg-slate-800 border-slate-700 text-white"
                step="0.01"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>

            {opportunities.isLoading ? (
              <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                <p className="text-slate-400">Loading opportunities...</p>
              </Card>
            ) : opportunities.data && opportunities.data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {opportunities.data.map((arb: any) => (
                  <Card
                    key={arb.id}
                    className={`bg-slate-800 border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer ${
                      selectedArbitrage === arb.id ? "ring-2 ring-amber-500" : ""
                    }`}
                    onClick={() => setSelectedArbitrage(arb.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Matchup */}
                        <div>
                          <p className="text-sm text-slate-400 mb-1">{arb.sport.toUpperCase()}</p>
                          <h3 className="font-semibold text-white">{arb.matchup}</h3>
                        </div>

                        {/* Outcomes */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 rounded p-3">
                            <p className="text-xs text-slate-400 mb-1">{arb.bookA}</p>
                            <p className="text-sm font-semibold text-white mb-1">{arb.outcomeA}</p>
                            <p className="text-lg font-bold text-brand-gold">{arb.oddsA > 0 ? "+" : ""}{arb.oddsA}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded p-3">
                            <p className="text-xs text-slate-400 mb-1">{arb.bookB}</p>
                            <p className="text-sm font-semibold text-white mb-1">{arb.outcomeB}</p>
                            <p className="text-lg font-bold text-brand-gold">{arb.oddsB > 0 ? "+" : ""}{arb.oddsB}</p>
                          </div>
                        </div>

                        {/* Arbitrage Metrics */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
                          <div>
                            <p className="text-xs text-slate-400">Arb %</p>
                            <p className="text-sm font-bold text-brand-green">{(arb.arbitragePercentage * 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Profit</p>
                            <p className="text-sm font-bold text-brand-green">${arb.guaranteedProfit.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Expires</p>
                            <p className="text-xs font-semibold text-slate-300">
                              {new Date(arb.expiresAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* Stakes */}
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-2">Stakes ($100 total)</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-400">{arb.bookA}</p>
                              <p className="text-sm font-bold text-white">${arb.stakeA.toFixed(2)}</p>
                            </div>
                            <div className="text-slate-500">+</div>
                            <div>
                              <p className="text-xs text-slate-400">{arb.bookB}</p>
                              <p className="text-sm font-bold text-white">${arb.stakeB.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Place Bet Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <PlaceBetButton
                            sportKey={arb.sport}
                            bestBookmaker={arb.bookA}
                            compact
                          />
                          <PlaceBetButton
                            sportKey={arb.sport}
                            bestBookmaker={arb.bookB}
                            compact
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No arbitrage opportunities found. Try lowering the minimum percentage.</p>
              </Card>
            )}
          </TabsContent>

          {/* Calculator */}
          <TabsContent value="calculator" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-gold" />
                  Custom Arbitrage Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Book A Odds (American)</label>
                    <Input
                      type="number"
                      value={customOddsA}
                      onChange={(e) => setCustomOddsA(e.target.value)}
                      placeholder="-110"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Book B Odds (American)</label>
                    <Input
                      type="number"
                      value={customOddsB}
                      onChange={(e) => setCustomOddsB(e.target.value)}
                      placeholder="-110"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Total Stake ($)</label>
                    <Input
                      type="number"
                      value={customStake}
                      onChange={(e) => setCustomStake(e.target.value)}
                      placeholder="100"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Calculate Arbitrage
                </Button>

                {calculateCustom.data && (
                  <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Stake A</p>
                        <p className="text-2xl font-bold text-white">${calculateCustom.data.stakeA.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Stake B</p>
                        <p className="text-2xl font-bold text-white">${calculateCustom.data.stakeB.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-600 pt-4">
                      <p className="text-sm text-slate-400 mb-2">Guaranteed Profit</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-brand-green">${calculateCustom.data.guaranteedProfit.toFixed(2)}</p>
                        <p className="text-lg font-semibold text-brand-green">({(calculateCustom.data.profitPercentage * 100).toFixed(2)}%)</p>
                      </div>
                    </div>
                  </div>
                )}

                {calculateCustom.error && (
                  <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{calculateCustom.error.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ArbitrageFinder() {
  return <FeatureGate feature="arbitrage" children={<ArbitrageFinderContent />} />;
}
