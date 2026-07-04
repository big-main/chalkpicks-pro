import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ROICalculator() {
  const [initialBankroll, setInitialBankroll] = useState<string>("1000");
  const [totalWins, setTotalWins] = useState<string>("0");
  const [totalLosses, setTotalLosses] = useState<string>("0");
  const [unitSize, setUnitSize] = useState<string>("25");
  const [winRate, setWinRate] = useState<string>("55");

  const initial = parseFloat(initialBankroll) || 0;
  const wins = parseFloat(totalWins) || 0;
  const losses = parseFloat(totalLosses) || 0;
  const unit = parseFloat(unitSize) || 0;
  const rate = parseFloat(winRate) || 0;

  const totalBets = wins + losses;
  const currentBankroll = initial + wins - losses;
  const profit = currentBankroll - initial;
  const roi = initial > 0 ? (profit / initial) * 100 : 0;
  const avgWinSize = wins > 0 ? wins / (totalBets > 0 ? totalBets : 1) : 0;
  const avgLossSize = losses > 0 ? losses / (totalBets > 0 ? totalBets : 1) : 0;

  // Projected stats
  const projectedBets = 100;
  const projectedWins = Math.round(projectedBets * (rate / 100));
  const projectedLosses = projectedBets - projectedWins;
  const projectedProfit = projectedWins * avgWinSize - projectedLosses * avgLossSize;
  const projectedROI = initial > 0 ? (projectedProfit / initial) * 100 : 0;

  // Break-even analysis
  const breakEvenWinRate = avgLossSize > 0 ? (avgLossSize / (avgWinSize + avgLossSize)) * 100 : 50;

  // Unit sizing recommendation
  const recommendedUnit = Math.max(initial * 0.02, 10); // 2% of bankroll, minimum $10

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">Betting ROI Calculator</h1>
          <p className="mt-2 text-slate-400">Track your betting performance and project future returns</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-emerald-400">Your Stats</CardTitle>
              <CardDescription>Enter your betting history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bankroll" className="text-slate-300">
                  Starting Bankroll ($)
                </Label>
                <Input
                  id="bankroll"
                  type="number"
                  value={initialBankroll}
                  onChange={(e) => setInitialBankroll(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="wins" className="text-slate-300">
                  Total Winnings ($)
                </Label>
                <Input
                  id="wins"
                  type="number"
                  value={totalWins}
                  onChange={(e) => setTotalWins(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="losses" className="text-slate-300">
                  Total Losses ($)
                </Label>
                <Input
                  id="losses"
                  type="number"
                  value={totalLosses}
                  onChange={(e) => setTotalLosses(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="unit" className="text-slate-300">
                  Average Unit Size ($)
                </Label>
                <Input
                  id="unit"
                  type="number"
                  value={unitSize}
                  onChange={(e) => setUnitSize(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="winRate" className="text-slate-300">
                  Expected Win Rate (%)
                </Label>
                <Input
                  id="winRate"
                  type="number"
                  min="0"
                  max="100"
                  value={winRate}
                  onChange={(e) => setWinRate(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Current Performance */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-blue-400">Current Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Bankroll</span>
                  <span className={`text-2xl font-bold ${currentBankroll >= initial ? "text-emerald-400" : "text-red-400"}`}>
                    ${currentBankroll.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                  <span className="text-slate-400">Total Profit/Loss</span>
                  <div className="flex items-center gap-2">
                    {profit >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-2xl font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                  <span className="text-slate-400">ROI</span>
                  <span className={`text-2xl font-bold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {roi.toFixed(2)}%
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                  <span className="text-slate-400">Total Bets</span>
                  <span className="text-xl font-semibold text-slate-300">{totalBets}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Win Rate</span>
                  <span className="text-xl font-semibold text-slate-300">
                    {totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Projections */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-amber-400">100-Bet Projection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Expected Wins</span>
                  <span className="text-xl font-semibold text-emerald-400">{projectedWins}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Expected Losses</span>
                  <span className="text-xl font-semibold text-red-400">{projectedLosses}</span>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                  <span className="text-slate-400">Projected Profit</span>
                  <span className={`text-2xl font-bold ${projectedProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ${projectedProfit.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Projected ROI</span>
                  <span className={`text-2xl font-bold ${projectedROI >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {projectedROI.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-purple-400">Break-Even Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Your break-even win rate is:</p>
                <p className="mt-2 text-3xl font-bold text-purple-400">{breakEvenWinRate.toFixed(1)}%</p>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                You need to win at least this percentage of your bets to break even. Anything above this is profit.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-cyan-400">Unit Size Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Recommended unit size (2% of bankroll):</p>
                <p className="mt-2 text-3xl font-bold text-cyan-400">${recommendedUnit.toFixed(2)}</p>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                This conservative approach protects your bankroll and allows for variance in betting results.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-6 border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Betting ROI Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <div className="font-semibold text-emerald-400">ROI (Return on Investment)</div>
              <p>Measures your profit as a percentage of your starting bankroll. Example: $100 profit on $1000 bankroll = 10% ROI.</p>
            </div>
            <div>
              <div className="font-semibold text-blue-400">Break-Even Win Rate</div>
              <p>The minimum win percentage needed to break even. If your average win equals your average loss, break-even is 50%.</p>
            </div>
            <div>
              <div className="font-semibold text-amber-400">Unit Sizing</div>
              <p>Betting 2% of your bankroll per bet is the Kelly Criterion-recommended conservative approach. Protects against variance.</p>
            </div>
            <div>
              <div className="font-semibold text-purple-400">Sustainable Growth</div>
              <p>Aim for 1-5% ROI per month. This compounds to 12-60% annually. Higher ROI often indicates higher risk.</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">Ready to improve your betting ROI?</p>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Try ChalkPicks Pro Free
          </Button>
        </div>
      </div>
    </div>
  );
}
