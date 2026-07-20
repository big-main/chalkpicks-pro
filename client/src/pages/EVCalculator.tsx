import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calculator, TrendingUp, ArrowRight, Info, Zap,
  BarChart3, Target, BookOpen, DollarSign
} from "lucide-react";

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function americanToImplied(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

export default function EVCalculator() {
  const [odds, setOdds] = useState("-110");
  const [fairOdds, setFairOdds] = useState("-105");
  const [betAmount, setBetAmount] = useState("100");
  const [mode, setMode] = useState<"fair-odds" | "probability">("fair-odds");
  const [manualProb, setManualProb] = useState("52");

  const result = useMemo(() => {
    const oddsNum = parseFloat(odds);
    const betNum = parseFloat(betAmount);

    if (isNaN(oddsNum) || isNaN(betNum) || betNum <= 0) return null;

    const decimal = americanToDecimal(oddsNum);
    const impliedProb = americanToImplied(oddsNum);

    let trueProb: number;
    if (mode === "fair-odds") {
      const fairOddsNum = parseFloat(fairOdds);
      if (isNaN(fairOddsNum)) return null;
      trueProb = americanToImplied(fairOddsNum);
    } else {
      trueProb = parseFloat(manualProb) / 100;
      if (isNaN(trueProb) || trueProb <= 0 || trueProb >= 1) return null;
    }

    const payout = betNum * (decimal - 1);
    const ev = (trueProb * payout) - ((1 - trueProb) * betNum);
    const evPercent = (ev / betNum) * 100;
    const edge = (trueProb - impliedProb) * 100;
    const roi = evPercent;

    // Breakeven probability
    const breakeven = impliedProb * 100;

    return {
      ev,
      evPercent,
      edge,
      roi,
      trueProb: trueProb * 100,
      impliedProb: impliedProb * 100,
      breakeven,
      payout,
      decimal,
      isPositiveEV: ev > 0,
    };
  }, [odds, fairOdds, betAmount, mode, manualProb]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(57, 255, 20, 0.04) 0%, transparent 60%)",
        }} />
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="badge-free text-xs mb-4 px-3 py-1">FREE TOOL</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Expected Value Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Calculate the expected value (+EV) of any sports bet. Find profitable bets by comparing market odds to true probabilities.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculator */}
            <NeonCard className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Calculate Expected Value
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Your Bet Odds (American)</Label>
                  <Input
                    type="text"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="-110"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">The odds you're getting from your sportsbook</p>
                </div>

                {/* Mode selector */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">True Probability Method</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={mode === "fair-odds" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("fair-odds")}
                      className="flex-1 text-xs"
                    >
                      Fair/No-Vig Odds
                    </Button>
                    <Button
                      variant={mode === "probability" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("probability")}
                      className="flex-1 text-xs"
                    >
                      Manual Probability
                    </Button>
                  </div>
                </div>

                {mode === "fair-odds" ? (
                  <div>
                    <Label className="text-sm text-muted-foreground">Fair/No-Vig Odds (American)</Label>
                    <Input
                      type="text"
                      value={fairOdds}
                      onChange={(e) => setFairOdds(e.target.value)}
                      placeholder="-105"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">The "true" odds without vig (from Pinnacle, devigged lines, or your model)</p>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm text-muted-foreground">Your Estimated Win Probability (%)</Label>
                    <Input
                      type="text"
                      value={manualProb}
                      onChange={(e) => setManualProb(e.target.value)}
                      placeholder="52"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Your true estimated probability (1-99)</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Bet Amount ($)</Label>
                  <Input
                    type="text"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
              </div>
            </NeonCard>

            {/* Results */}
            <NeonCard className="p-6" variant={result?.isPositiveEV ? "premium" : "default"}>
              <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Results
              </h2>
              {result ? (
                <div className="space-y-4">
                  {/* Main EV result */}
                  <div className={`p-4 rounded-xl text-center border ${result.isPositiveEV ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <div className="text-xs uppercase tracking-wider font-medium mb-1 text-muted-foreground">
                      Expected Value Per Bet
                    </div>
                    <div className={`text-3xl font-black ${result.isPositiveEV ? "text-green-400" : "text-red-400"}`}>
                      {result.ev >= 0 ? "+" : ""}${result.ev.toFixed(2)}
                    </div>
                    <div className={`text-sm mt-1 ${result.isPositiveEV ? "text-green-300/70" : "text-red-300/70"}`}>
                      {result.evPercent >= 0 ? "+" : ""}{result.evPercent.toFixed(2)}% EV
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Your Edge</div>
                      <div className={`text-lg font-mono font-bold ${result.edge > 0 ? "text-primary" : "text-red-400"}`}>
                        {result.edge > 0 ? "+" : ""}{result.edge.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">True Prob</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.trueProb.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Implied Prob</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.impliedProb.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Breakeven</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.breakeven.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Profit on win */}
                  <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Profit If Win</div>
                    <div className="text-xl font-mono font-bold text-foreground">+${result.payout.toFixed(2)}</div>
                  </div>

                  {/* Verdict */}
                  <div className={`p-3 rounded-xl flex items-start gap-2 ${result.isPositiveEV ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${result.isPositiveEV ? "text-green-400" : "text-red-400"}`} />
                    <span className={`text-xs ${result.isPositiveEV ? "text-green-300" : "text-red-300"}`}>
                      {result.isPositiveEV
                        ? `This is a +EV bet. Over time, you'd expect to profit $${result.ev.toFixed(2)} per bet at this stake. The market is offering better odds than the true probability suggests.`
                        : `This is a -EV bet. The implied probability from the odds is higher than your estimated true probability. Consider passing on this bet.`
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Enter valid inputs to see results</p>
                </div>
              )}
            </NeonCard>
          </div>

          {/* Educational Section */}
          <div className="mt-12 space-y-8">
            <NeonCard className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                What is Expected Value (EV)?
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Expected Value (EV) is the average amount you expect to win or lose per bet over the long run.
                  A positive EV (+EV) bet means the odds offered are better than the true probability of the outcome,
                  giving you a mathematical edge over the sportsbook.
                </p>
                <p>
                  <strong className="text-foreground">The Formula:</strong> EV = (Win Probability × Profit) - (Loss Probability × Stake)
                </p>
                <p>
                  Professional bettors focus exclusively on +EV bets because, over thousands of wagers,
                  positive expected value guarantees long-term profit regardless of short-term variance.
                </p>
                <p>
                  <strong className="text-foreground">Finding True Probability:</strong> Use devigged lines from sharp books (Pinnacle, Circa),
                  consensus models, or your own statistical models to estimate the true probability of an outcome.
                </p>
              </div>
            </NeonCard>

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Want automatic +EV detection across 15+ sportsbooks? Our premium EV Finder scans every line in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/free-pick">
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    Today's Free Pick <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/tools/kelly-calculator">
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    Kelly Calculator <Calculator className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button className="btn-cta">
                    Get EV Finder <Zap className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer disclaimer */}
      <div className="py-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
          ChalkPicks is for informational and entertainment purposes only. We do not guarantee betting outcomes.
          Bet responsibly. Must be 21+ where applicable.
        </p>
      </div>
    </div>
  );
}
