import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator, TrendingUp, ArrowRight, Info, Shield,
  BarChart3, Target, Zap, BookOpen
} from "lucide-react";

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function kellyFraction(trueProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  const q = 1 - trueProb;
  const kelly = (b * trueProb - q) / b;
  return Math.max(0, kelly);
}

export default function KellyCalculator() {
  const [odds, setOdds] = useState("-110");
  const [winProb, setWinProb] = useState("55");
  const [bankroll, setBankroll] = useState("1000");
  const [fraction, setFraction] = useState("0.25"); // quarter Kelly default

  const result = useMemo(() => {
    const oddsNum = parseFloat(odds);
    const probNum = parseFloat(winProb) / 100;
    const bankrollNum = parseFloat(bankroll);
    const fractionNum = parseFloat(fraction);

    if (isNaN(oddsNum) || isNaN(probNum) || isNaN(bankrollNum) || isNaN(fractionNum)) {
      return null;
    }
    if (probNum <= 0 || probNum >= 1) return null;

    const decimal = americanToDecimal(oddsNum);
    const fullKelly = kellyFraction(probNum, decimal);
    const adjustedKelly = fullKelly * fractionNum;
    const betAmount = bankrollNum * adjustedKelly;
    const impliedProb = oddsNum > 0 ? 100 / (oddsNum + 100) : Math.abs(oddsNum) / (Math.abs(oddsNum) + 100);
    const edge = probNum - impliedProb;
    const ev = (probNum * (decimal - 1) - (1 - probNum)) * betAmount;

    return {
      fullKelly: fullKelly * 100,
      adjustedKelly: adjustedKelly * 100,
      betAmount,
      decimalOdds: decimal,
      impliedProb: impliedProb * 100,
      edge: edge * 100,
      ev,
      isPositiveEV: edge > 0,
    };
  }, [odds, winProb, bankroll, fraction]);

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
              Kelly Criterion Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Calculate optimal bet sizing using the Kelly Criterion formula. Maximize long-term bankroll growth while managing risk.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculator */}
            <NeonCard className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Calculate Your Bet Size
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">American Odds</Label>
                  <Input
                    type="text"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="-110"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">e.g., -110, +150, +300</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Your Estimated Win Probability (%)</Label>
                  <Input
                    type="text"
                    value={winProb}
                    onChange={(e) => setWinProb(e.target.value)}
                    placeholder="55"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your true estimated probability of winning (1-99)</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Bankroll ($)</Label>
                  <Input
                    type="text"
                    value={bankroll}
                    onChange={(e) => setBankroll(e.target.value)}
                    placeholder="1000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Kelly Fraction</Label>
                  <Tabs value={fraction} onValueChange={setFraction} className="mt-1">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="1">Full</TabsTrigger>
                      <TabsTrigger value="0.5">Half</TabsTrigger>
                      <TabsTrigger value="0.25">Quarter</TabsTrigger>
                      <TabsTrigger value="0.1">Tenth</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground mt-1">Quarter Kelly is recommended for most bettors</p>
                </div>
              </div>
            </NeonCard>

            {/* Results */}
            <NeonCard className="p-6" variant={result?.isPositiveEV ? "premium" : "default"}>
              <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Results
              </h2>
              {result ? (
                <div className="space-y-4">
                  {/* Main result */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                    <div className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">
                      Recommended Bet Size
                    </div>
                    <div className="text-3xl font-black text-primary">
                      ${result.betAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.adjustedKelly.toFixed(2)}% of bankroll
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Full Kelly</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.fullKelly.toFixed(2)}%</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Decimal Odds</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.decimalOdds.toFixed(3)}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Implied Prob</div>
                      <div className="text-lg font-mono font-bold text-foreground">{result.impliedProb.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Your Edge</div>
                      <div className={`text-lg font-mono font-bold ${result.edge > 0 ? "text-primary" : "text-red-400"}`}>
                        {result.edge > 0 ? "+" : ""}{result.edge.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* EV */}
                  <div className={`p-3 rounded-xl text-center border ${result.isPositiveEV ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <div className="text-xs text-muted-foreground mb-1">Expected Value</div>
                    <div className={`text-xl font-bold ${result.isPositiveEV ? "text-green-400" : "text-red-400"}`}>
                      {result.ev >= 0 ? "+" : ""}${result.ev.toFixed(2)}
                    </div>
                  </div>

                  {/* Warning */}
                  {!result.isPositiveEV && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                      <Info className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-red-300">
                        Negative edge detected. Kelly recommends $0 bet. Your estimated win probability is below the implied probability.
                      </span>
                    </div>
                  )}
                  {result.fullKelly > 25 && result.isPositiveEV && (
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                      <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-yellow-300">
                        High Kelly percentage detected. Consider using Quarter Kelly to reduce variance and protect your bankroll.
                      </span>
                    </div>
                  )}
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
                What is the Kelly Criterion?
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The Kelly Criterion is a mathematical formula developed by John L. Kelly Jr. at Bell Labs in 1956.
                  It determines the optimal percentage of your bankroll to wager on a bet with a positive expected value,
                  maximizing long-term growth while minimizing the risk of ruin.
                </p>
                <p>
                  <strong className="text-foreground">The Formula:</strong> f* = (bp - q) / b
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-foreground">f*</strong> = fraction of bankroll to bet</li>
                  <li><strong className="text-foreground">b</strong> = decimal odds - 1 (net profit per $1 wagered)</li>
                  <li><strong className="text-foreground">p</strong> = probability of winning</li>
                  <li><strong className="text-foreground">q</strong> = probability of losing (1 - p)</li>
                </ul>
                <p>
                  Most professional bettors use <strong className="text-foreground">Quarter Kelly</strong> (25% of the full Kelly recommendation)
                  to reduce variance and account for estimation errors in win probability.
                </p>
              </div>
            </NeonCard>

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Want AI-powered Kelly sizing on every pick? Our premium tools auto-calculate optimal bet sizes.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/free-pick">
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    Today's Free Pick <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button className="btn-cta">
                    Get Premium Tools <Zap className="w-4 h-4 ml-1" />
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
