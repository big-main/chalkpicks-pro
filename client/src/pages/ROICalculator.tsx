import { useState } from "react";
import {
  HowToJsonLd,
  BreadcrumbJsonLd,
  FaqJsonLd,
} from "@/components/seo/schema-jsonld";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";

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
  const projectedProfit =
    projectedWins * avgWinSize - projectedLosses * avgLossSize;
  const projectedROI = initial > 0 ? (projectedProfit / initial) * 100 : 0;

  // Break-even analysis
  const breakEvenWinRate =
    avgLossSize > 0 ? (avgLossSize / (avgWinSize + avgLossSize)) * 100 : 50;

  // Unit sizing recommendation
  const recommendedUnit = Math.max(initial * 0.02, 10); // 2% of bankroll, minimum $10

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/tools/roi-calculator" />
      <HowToJsonLd
        name="How to Calculate Betting ROI"
        description="Track your betting performance and calculate return on investment using the ChalkPicks free ROI calculator."
        totalTime="PT2M"
        steps={[
          {
            name: "Enter your starting bankroll",
            text: "Input the amount you started with before placing bets.",
          },
          {
            name: "Enter total winnings and losses",
            text: "Add your cumulative winnings and losses in dollars.",
          },
          {
            name: "Set your expected win rate",
            text: "Enter your historical or expected win percentage to project future performance.",
          },
          {
            name: "Review your ROI and projections",
            text: "See your current ROI, break-even win rate, recommended unit size, and 100-bet profit projection.",
          },
        ]}
      />
      <FaqJsonLd
        faqs={[
          {
            question: "What is betting ROI?",
            answer:
              "Betting ROI (Return on Investment) measures your profit as a percentage of your starting bankroll. A 10% ROI means you earned $100 profit on a $1,000 starting bankroll.",
          },
          {
            question: "What is a good ROI for sports betting?",
            answer:
              "A sustained ROI of 3–10% is considered strong in sports betting. Most recreational bettors have negative ROI due to the sportsbook's built-in margin (vig). Professional bettors typically target 5–8% ROI long-term.",
          },
          {
            question: "How do I calculate break-even win rate?",
            answer:
              "Break-even win rate depends on the average odds you bet. At -110 (standard vig), you need to win 52.4% of bets to break even. The formula is: Break-Even % = Risk / (Risk + Reward).",
          },
          {
            question: "What is unit sizing in sports betting?",
            answer:
              "A unit is a fixed percentage of your bankroll used per bet, typically 1–2%. Betting 2% per unit ($20 on a $1,000 bankroll) protects against variance and allows for long-term tracking.",
          },
          {
            question: "How does the 100-bet projection work?",
            answer:
              "The projection applies your current average win/loss amounts and expected win rate to 100 future bets. It is a statistical estimate, not a guarantee. Past performance does not predict future results.",
          },
        ]}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Tools", url: "https://chalkpicks.live/tools" },
          {
            name: "ROI Calculator",
            url: "https://chalkpicks.live/tools/roi-calculator",
          },
        ]}
      />
      <Navbar />
      <div className="pt-20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/tools">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> All Tools
            </Button>
          </Link>
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground">
              Free Sports Betting ROI Calculator
            </h1>
            <p className="mt-2 text-muted-foreground">
              Calculate return on investment, profit/loss, and long-term
              performance across your betting history. No signup required.
            </p>
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
                    onChange={e => setInitialBankroll(e.target.value)}
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
                    onChange={e => setTotalWins(e.target.value)}
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
                    onChange={e => setTotalLosses(e.target.value)}
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
                    onChange={e => setUnitSize(e.target.value)}
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
                    onChange={e => setWinRate(e.target.value)}
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
                  <CardTitle className="text-blue-400">
                    Current Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Bankroll</span>
                    <span
                      className={`text-2xl font-bold ${currentBankroll >= initial ? "text-emerald-400" : "text-red-400"}`}
                    >
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
                      <span
                        className={`text-2xl font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        ${profit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-slate-400">ROI</span>
                    <span
                      className={`text-2xl font-bold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {roi.toFixed(2)}%
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-slate-400">Total Bets</span>
                    <span className="text-xl font-semibold text-slate-300">
                      {totalBets}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Win Rate</span>
                    <span className="text-xl font-semibold text-slate-300">
                      {totalBets > 0
                        ? ((wins / totalBets) * 100).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Projections */}
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-amber-400">
                    100-Bet Projection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expected Wins</span>
                    <span className="text-xl font-semibold text-emerald-400">
                      {projectedWins}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expected Losses</span>
                    <span className="text-xl font-semibold text-red-400">
                      {projectedLosses}
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-slate-400">Projected Profit</span>
                    <span
                      className={`text-2xl font-bold ${projectedProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      ${projectedProfit.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Projected ROI</span>
                    <span
                      className={`text-2xl font-bold ${projectedROI >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
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
                <CardTitle className="text-purple-400">
                  Break-Even Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">
                    Your break-even win rate is:
                  </p>
                  <p className="mt-2 text-3xl font-bold text-purple-400">
                    {breakEvenWinRate.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  You need to win at least this percentage of your bets to break
                  even. Anything above this is profit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-cyan-400">
                  Unit Size Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">
                    Recommended unit size (2% of bankroll):
                  </p>
                  <p className="mt-2 text-3xl font-bold text-cyan-400">
                    ${recommendedUnit.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  This conservative approach protects your bankroll and allows
                  for variance in betting results.
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
                <div className="font-semibold text-emerald-400">
                  ROI (Return on Investment)
                </div>
                <p>
                  Measures your profit as a percentage of your starting
                  bankroll. Example: $100 profit on $1000 bankroll = 10% ROI.
                </p>
              </div>
              <div>
                <div className="font-semibold text-blue-400">
                  Break-Even Win Rate
                </div>
                <p>
                  The minimum win percentage needed to break even. If your
                  average win equals your average loss, break-even is 50%.
                </p>
              </div>
              <div>
                <div className="font-semibold text-amber-400">Unit Sizing</div>
                <p>
                  Betting 2% of your bankroll per bet is the Kelly
                  Criterion-recommended conservative approach. Protects against
                  variance.
                </p>
              </div>
              <div>
                <div className="font-semibold text-purple-400">
                  Sustainable Growth
                </div>
                <p>
                  Aim for 1-5% ROI per month. This compounds to 12-60% annually.
                  Higher ROI often indicates higher risk.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-8 rounded-lg bg-slate-800/50 border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-5 text-sm text-slate-300">
              <div>
                <div className="font-semibold text-emerald-400 mb-1">
                  What is betting ROI?
                </div>
                <p>
                  Betting ROI (Return on Investment) measures your profit as a
                  percentage of your starting bankroll. A 10% ROI means you
                  earned $100 profit on a $1,000 starting bankroll.
                </p>
              </div>
              <div>
                <div className="font-semibold text-blue-400 mb-1">
                  What is a good ROI for sports betting?
                </div>
                <p>
                  A sustained ROI of 3–10% is considered strong in sports
                  betting. Most recreational bettors have negative ROI due to
                  the sportsbook's built-in margin (vig). Professional bettors
                  typically target 5–8% ROI long-term.
                </p>
              </div>
              <div>
                <div className="font-semibold text-amber-400 mb-1">
                  How do I calculate break-even win rate?
                </div>
                <p>
                  Break-even win rate depends on the average odds you bet. At
                  -110 (standard vig), you need to win 52.4% of bets to break
                  even. The formula is: Break-Even % = Risk / (Risk + Reward).
                </p>
              </div>
              <div>
                <div className="font-semibold text-purple-400 mb-1">
                  What is unit sizing in sports betting?
                </div>
                <p>
                  A unit is a fixed percentage of your bankroll used per bet,
                  typically 1–2%. Betting 2% per unit ($20 on a $1,000 bankroll)
                  protects against variance and allows for long-term tracking.
                </p>
              </div>
              <div>
                <div className="font-semibold text-cyan-400 mb-1">
                  How does the 100-bet projection work?
                </div>
                <p>
                  The projection applies your current average win/loss amounts
                  and expected win rate to 100 future bets. It is a statistical
                  estimate only. Past performance does not predict future
                  results.
                </p>
              </div>
            </div>
          </div>

          {/* Internal links */}
          <div className="mt-6 rounded-lg bg-slate-800/30 border border-slate-700/50 p-5">
            <p className="text-sm text-slate-400 mb-3 font-semibold">
              Related Tools
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tools/odds-calculator">
                <span className="text-sm text-emerald-400 hover:underline cursor-pointer">
                  Odds Calculator →
                </span>
              </Link>
              <Link href="/tools/kelly-calculator">
                <span className="text-sm text-emerald-400 hover:underline cursor-pointer">
                  Kelly Criterion Calculator →
                </span>
              </Link>
              <Link href="/tools/ev-calculator">
                <span className="text-sm text-emerald-400 hover:underline cursor-pointer">
                  EV Calculator →
                </span>
              </Link>
              <Link href="/tools/parlay-calculator">
                <span className="text-sm text-emerald-400 hover:underline cursor-pointer">
                  Parlay Calculator →
                </span>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div
            className="mt-8 p-6 rounded-xl text-center"
            style={{
              background: "rgba(57,255,20,0.05)",
              border: "1px solid rgba(57,255,20,0.15)",
            }}
          >
            <p className="text-foreground font-semibold mb-1">
              Measure your edge with CLV tracking
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Closing Line Value · +EV finder · Pick Ledger · Pro from $9.99/mo
            </p>
            <Link href="/pricing">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
                View Plans →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
