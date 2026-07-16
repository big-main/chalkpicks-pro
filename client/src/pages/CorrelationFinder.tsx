import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Link2, DollarSign, Sparkles } from "lucide-react";

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
            <p className="text-xs text-brand-green">💡 Spend $5 and get $100 in free credits!</p>
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

export default function CorrelationFinder() {
  const [sport, setSport] = useState<"nba" | "nfl" | "mlb" | "nhl">("nba");
  const [minCorrelation, setMinCorrelation] = useState(0.3);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [lowBalanceInfo, setLowBalanceInfo] = useState({ required: 0, balance: 0 });

  const corrMutation = trpc.tools.correlationFinder.useMutation({
    onSuccess: (data) => {
      if (data.error === "insufficient_credits") {
        setLowBalanceInfo({ required: data.required!, balance: data.balance! });
        setShowLowBalance(true);
      }
    },
  });

  const handleFind = () => {
    corrMutation.mutate({ sport, minCorrelation });
  };

  const data = corrMutation.data?.data;

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
              <Link2 className="h-8 w-8 text-orange-400" />
              Correlation Finder
            </h1>
            <p className="text-gray-400 mt-1">Find correlated bets for same-game parlays with higher hit rates</p>
          </div>
          <Badge variant="outline" className="text-orange-400 border-orange-400/50 px-3 py-1">
            3 credits/use
          </Badge>
        </div>

        {/* Controls */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 items-end">
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
                <label className="text-xs text-gray-400">
                  Min Correlation: {(minCorrelation * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[minCorrelation]}
                  onValueChange={([v]) => setMinCorrelation(v)}
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  className="py-2"
                />
              </div>
              <Button
                onClick={handleFind}
                disabled={corrMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {corrMutation.isPending ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" /> Find Correlations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{data.totalAnalyzed}</p>
                  <p className="text-xs text-gray-400">Pairs Analyzed</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-orange-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{data.strongPairs}</p>
                  <p className="text-xs text-gray-400">Strong Correlations</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-brand-gold">${corrMutation.data?.balance?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Credits Remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Correlation Pairs */}
            <div className="space-y-4">
              {data.correlations.map((pair, i) => (
                <Card key={i} className={`bg-gray-900 ${pair.recommendation === "strong_corr" ? "border-orange-500/40" : "border-gray-800"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          pair.recommendation === "strong_corr" ? "bg-orange-600/20 text-orange-400 border-orange-500/30" :
                          pair.recommendation === "moderate_corr" ? "bg-yellow-600/20 text-brand-gold border-yellow-500/30" :
                          "bg-gray-600/20 text-gray-400 border-gray-500/30"
                        }>
                          {pair.recommendation === "strong_corr" ? "Strong" : pair.recommendation === "moderate_corr" ? "Moderate" : "Weak"}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {Math.round(pair.historicalHitRate * 100)}% historical hit rate
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          pair.correlation > 0.6 ? "text-brand-green" :
                          pair.correlation > 0.3 ? "text-brand-gold" :
                          "text-gray-400"
                        }`}>
                          {(pair.correlation * 100).toFixed(0)}% correlated
                        </span>
                      </div>
                    </div>

                    {/* Leg 1 and Leg 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">LEG 1</p>
                        <p className="font-medium text-white">{pair.leg1.team}</p>
                        <p className="text-sm text-gray-400">{pair.leg1.market} {pair.leg1.line}</p>
                        <p className="text-sm font-mono text-brand-blue">
                          {pair.leg1.odds > 0 ? "+" : ""}{pair.leg1.odds}
                        </p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">LEG 2</p>
                        <p className="font-medium text-white">{pair.leg2.team}</p>
                        <p className="text-sm text-gray-400">{pair.leg2.market} {pair.leg2.line}</p>
                        <p className="text-sm font-mono text-brand-blue">
                          {pair.leg2.odds > 0 ? "+" : ""}{pair.leg2.odds}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !corrMutation.isPending && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Link2 className="h-12 w-12 text-orange-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300">Same-Game Parlay Correlations</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Find statistically correlated bets that move together. Build smarter parlays with higher expected hit rates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
