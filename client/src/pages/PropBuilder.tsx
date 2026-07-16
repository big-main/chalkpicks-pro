import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Zap, Search, DollarSign } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

function LowBalanceModal({ required, balance, onClose }: { required: number; balance: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-yellow-500/50 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-gold">
            <AlertTriangle className="h-5 w-5" />
            Insufficient Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This tool requires <span className="font-bold text-white">{required} credits</span> per use.
            Your current balance is <span className="font-bold text-brand-red">${balance.toFixed(2)}</span>.
          </p>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-sm text-gray-400">Top up your credits to continue using premium tools.</p>
            <p className="text-xs text-brand-green mt-1">💡 Spend $5 and get $100 in free credits!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => window.location.href = "/credits"} className="flex-1 bg-brand-green/80 hover:bg-brand-green">
              <DollarSign className="h-4 w-4 mr-1" /> Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PropBuilder() {
  const { user } = useAuth();
  const [sport, setSport] = useState<"nba" | "nfl" | "mlb" | "nhl">("nba");
  const [playerName, setPlayerName] = useState("");
  const [market, setMarket] = useState("");
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [lowBalanceInfo, setLowBalanceInfo] = useState({ required: 0, balance: 0 });

  const propMutation = trpc.tools.propBuilder.useMutation({
    onSuccess: (data) => {
      if (data.error === "insufficient_credits") {
        setLowBalanceInfo({ required: data.required!, balance: data.balance! });
        setShowLowBalance(true);
      }
    },
  });

  const handleAnalyze = () => {
    propMutation.mutate({
      sport,
      playerName: playerName || undefined,
      market: market || undefined,
    });
  };

  const data = propMutation.data?.data;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {showLowBalance && (
        <LowBalanceModal
          required={lowBalanceInfo.required}
          balance={lowBalanceInfo.balance}
          onClose={() => setShowLowBalance(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-purple-400" />
              Prop Builder
            </h1>
            <p className="text-gray-400 mt-1">AI-powered player prop analysis with over/under recommendations</p>
          </div>
          <Badge variant="outline" className="text-purple-400 border-purple-400/50 px-3 py-1">
            2 credits/use
          </Badge>
        </div>

        {/* Controls */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Sport</label>
                <Select value={sport} onValueChange={(v) => setSport(v as any)}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nba">NBA</SelectItem>
                    <SelectItem value="nfl">NFL</SelectItem>
                    <SelectItem value="mlb">MLB</SelectItem>
                    <SelectItem value="nhl">NHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-xs text-gray-400">Player Name (optional)</label>
                <Input
                  placeholder="e.g. LeBron James"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Market</label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger className="w-44 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="All markets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Markets</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="rebounds">Rebounds</SelectItem>
                    <SelectItem value="assists">Assists</SelectItem>
                    <SelectItem value="threes">3-Pointers</SelectItem>
                    <SelectItem value="strikeouts">Strikeouts</SelectItem>
                    <SelectItem value="passing_yards">Passing Yards</SelectItem>
                    <SelectItem value="rushing_yards">Rushing Yards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={propMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {propMutation.isPending ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" /> Analyze Props
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{data.totalAnalyzed}</p>
                  <p className="text-xs text-gray-400">Props Analyzed</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-brand-green">{data.topPicks.length}</p>
                  <p className="text-xs text-gray-400">+EV Props Found</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{data.sport.toUpperCase()}</p>
                  <p className="text-xs text-gray-400">Sport</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-brand-gold">${propMutation.data?.balance?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Credits Remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Picks */}
            {data.topPicks.length > 0 && (
              <Card className="bg-gray-900 border-brand-green/30">
                <CardHeader>
                  <CardTitle className="text-brand-green flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Top +EV Props
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topPicks.map((prop, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-brand-green/80/20 text-brand-green border-brand-green/30">
                            +{prop.ev.toFixed(1)}% EV
                          </Badge>
                          <div>
                            <p className="font-medium text-white">{prop.playerName}</p>
                            <p className="text-sm text-gray-400">{prop.market} {prop.line} ({prop.recommendation})</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-brand-green">{prop.overOdds > 0 ? "+" : ""}{prop.overOdds}</p>
                          <p className="text-xs text-gray-500">{prop.bookmaker}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Props Table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>All Analyzed Props ({data.props.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left p-2">Player</th>
                        <th className="text-left p-2">Market</th>
                        <th className="text-center p-2">Line</th>
                        <th className="text-center p-2">O/U</th>
                        <th className="text-center p-2">Best Odds</th>
                        <th className="text-center p-2">Book</th>
                        <th className="text-center p-2">EV%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.props.map((prop, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-2 font-medium">{prop.playerName}</td>
                          <td className="p-2 text-gray-400">{prop.market}</td>
                          <td className="p-2 text-center">{prop.line}</td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className={prop.recommendation === "over" ? "text-brand-green border-brand-green/30" : prop.recommendation === "under" ? "text-brand-red border-brand-red/30" : "text-gray-400 border-gray-500/30"}>
                              {prop.recommendation}
                            </Badge>
                          </td>
                          <td className="p-2 text-center font-mono">{prop.overOdds > 0 ? "+" : ""}{prop.overOdds}</td>
                          <td className="p-2 text-center text-gray-400">{prop.bookmaker}</td>
                          <td className="p-2 text-center">
                            <span className={prop.ev > 3 ? "text-brand-green font-bold" : prop.ev > 0 ? "text-brand-gold" : "text-brand-red"}>
                              {prop.ev > 0 ? "+" : ""}{prop.ev.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!data && !propMutation.isPending && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300">Ready to Analyze Props</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Select a sport and click "Analyze Props" to find +EV player prop bets across all major sportsbooks.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
