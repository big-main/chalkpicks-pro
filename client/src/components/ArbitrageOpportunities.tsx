import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, DollarSign, Target } from "lucide-react";

export function ArbitrageOpportunities() {
  const [sport, setSport] = useState<string>("");
  const [minArb, setMinArb] = useState(1);

  const { data, isLoading, error } = trpc.arbitrageOpportunities.getOpportunities.useQuery({
    sport: sport || undefined,
    minArbitragePercent: minArb,
    limit: 10,
  });

  const stats = trpc.arbitrageOpportunities.getStats.useQuery();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Arbitrage Opportunities</h1>
        <p className="text-gray-600 mt-2">Real-time guaranteed profit opportunities across sportsbooks</p>
      </div>

      {/* Stats Grid */}
      {stats.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold">{stats.data.totalOpportunitiesDetected}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Arbitrage</p>
                  <p className="text-2xl font-bold">{stats.data.averageArbitragePercent.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Best Opportunity</p>
                  <p className="text-2xl font-bold">{stats.data.bestArbitragePercent.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">{stats.data.opportunitiesThisWeek}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Sports</option>
                <option value="nfl">NFL</option>
                <option value="nba">NBA</option>
                <option value="mlb">MLB</option>
                <option value="nhl">NHL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Arbitrage %</label>
              <input
                type="number"
                value={minArb}
                onChange={(e) => setMinArb(parseFloat(e.target.value))}
                min="0.1"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div className="space-y-4">
        {isLoading && <p className="text-gray-600">Loading opportunities...</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error loading opportunities</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        )}

        {data?.opportunities && data.opportunities.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">No arbitrage opportunities found matching your filters</p>
            </CardContent>
          </Card>
        )}

        {data?.opportunities?.map((opp: any) => (
          <Card key={opp.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{opp.eventName}</CardTitle>
                  <CardDescription>{opp.sport.toUpperCase()} • {opp.marketType}</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge className={getRiskColor(opp.riskLevel)}>{opp.riskLevel.toUpperCase()}</Badge>
                  {opp.source && (
                    <Badge variant="outline" className={opp.source?.includes('oddsportal') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                      {opp.source?.includes('oddsportal') ? '🌐 OddsPortal' : '🇺🇸 US Books'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Odds Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{opp.bookmaker1}</p>
                  <p className="text-2xl font-bold text-blue-600">{opp.odds1}</p>
                  <p className="text-xs text-gray-500 mt-1">Implied: {(opp.impliedProb1 * 100).toFixed(1)}%</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{opp.bookmaker2}</p>
                  <p className="text-2xl font-bold text-green-600">{opp.odds2}</p>
                  <p className="text-xs text-gray-500 mt-1">Implied: {(opp.impliedProb2 * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Arbitrage Details */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Arbitrage %</p>
                    <p className="text-xl font-bold text-purple-600">{opp.arbitragePercent.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Investment</p>
                    <p className="text-xl font-bold text-gray-900">${opp.totalInvestment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Guaranteed Profit</p>
                    <p className="text-xl font-bold text-green-600">${opp.guaranteedProfit}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Bets */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommended Bets:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Bet ${opp.recommendedBet1} on {opp.team1} @ {opp.bookmaker1}</span>
                    <Badge variant="outline">Bet 1</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Bet ${opp.recommendedBet2} on {opp.team2} @ {opp.bookmaker2}</span>
                    <Badge variant="outline">Bet 2</Badge>
                  </div>
                </div>
              </div>

              {/* Event Date */}
              <p className="text-xs text-gray-500">Event: {new Date(opp.eventDate).toLocaleString()}</p>

              {/* Action Button */}
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                View Details & Execute
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How Arbitrage Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            Arbitrage is a guaranteed profit opportunity where you place bets on all possible outcomes at different sportsbooks, locking in a profit regardless of the result.
          </p>
          <p>
            The arbitrage percentage shows the guaranteed profit margin. Higher percentages are safer and more profitable.
          </p>
          <p className="text-xs text-gray-600">
            ⚠️ Note: Some sportsbooks may limit or close accounts for arbitrage betting. Always check their terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
