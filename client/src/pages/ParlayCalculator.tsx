import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calculator, TrendingUp, DollarSign, Percent, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";

interface ParlayLeg {
  id: number;
  odds: string;
}

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function decimalToImpliedProb(decimal: number): number {
  return (1 / decimal) * 100;
}

export default function ParlayCalculator() {
  const [legs, setLegs] = useState<ParlayLeg[]>([
    { id: 1, odds: "-110" },
    { id: 2, odds: "+150" },
  ]);
  const [stake, setStake] = useState("100");
  const [nextId, setNextId] = useState(3);

  const addLeg = () => {
    setLegs([...legs, { id: nextId, odds: "" }]);
    setNextId(nextId + 1);
  };

  const removeLeg = (id: number) => {
    if (legs.length <= 2) return;
    setLegs(legs.filter((l) => l.id !== id));
  };

  const updateLeg = (id: number, odds: string) => {
    setLegs(legs.map((l) => (l.id === id ? { ...l, odds } : l)));
  };

  const results = useMemo(() => {
    const validLegs = legs.filter((l) => l.odds && !isNaN(parseFloat(l.odds)) && parseFloat(l.odds) !== 0);
    if (validLegs.length < 2) return null;

    let combinedDecimal = 1;
    const legDetails = validLegs.map((l) => {
      const american = parseFloat(l.odds);
      const decimal = americanToDecimal(american);
      const impliedProb = decimalToImpliedProb(decimal);
      combinedDecimal *= decimal;
      return { american, decimal, impliedProb };
    });

    const stakeNum = parseFloat(stake) || 100;
    const totalPayout = stakeNum * combinedDecimal;
    const profit = totalPayout - stakeNum;
    const combinedImpliedProb = (1 / combinedDecimal) * 100;
    const combinedAmerican = combinedDecimal >= 2
      ? Math.round((combinedDecimal - 1) * 100)
      : Math.round(-100 / (combinedDecimal - 1));

    return {
      legDetails,
      combinedDecimal,
      combinedAmerican,
      combinedImpliedProb,
      totalPayout,
      profit,
      roi: (profit / stakeNum) * 100,
    };
  }, [legs, stake]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <Calculator className="w-3.5 h-3.5" /> FREE TOOL
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Parlay <span className="text-emerald-400">Calculator</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Calculate multi-leg parlay payouts instantly. Enter American odds for each leg and see your total payout, profit, and combined implied probability.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Parlay Legs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {legs.map((leg, idx) => (
                  <div key={leg.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                      {idx + 1}
                    </div>
                    <Input
                      type="text"
                      placeholder="e.g. -110 or +150"
                      value={leg.odds}
                      onChange={(e) => updateLeg(leg.id, e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                    <button
                      onClick={() => removeLeg(leg.id)}
                      disabled={legs.length <= 2}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={addLeg}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-dashed border-slate-600 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Leg
                </Button>

                <div className="pt-4 border-t border-slate-700/50">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Stake ($)
                  </label>
                  <Input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white max-w-[200px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/60 border-slate-700/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Payout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-center">
                      <div className="text-xs text-emerald-400/70 uppercase font-bold mb-1">Total Payout</div>
                      <div className="text-3xl font-bold text-emerald-400">
                        ${results.totalPayout.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Profit</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          ${results.profit.toFixed(2)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">ROI</div>
                        <div className="text-lg font-bold text-amber-400 mt-0.5">
                          {results.roi.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Combined Odds</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {results.combinedAmerican > 0 ? "+" : ""}{results.combinedAmerican}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Win Prob</div>
                        <div className="text-lg font-bold text-blue-400 mt-0.5">
                          {results.combinedImpliedProb.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Leg breakdown */}
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="text-xs text-slate-400 uppercase font-bold mb-2">Leg Breakdown</div>
                      {results.legDetails.map((ld, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800 last:border-0">
                          <span className="text-slate-300">Leg {i + 1}</span>
                          <span className="text-white font-mono">
                            {ld.american > 0 ? "+" : ""}{ld.american} ({ld.impliedProb.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Calculator className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    Enter at least 2 legs to calculate
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="mt-16 space-y-8">
          <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-8">
            <h2 className="text-xl font-bold text-white mb-4">How to Use the Parlay Calculator</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                A parlay (or accumulator) combines multiple individual bets into one wager. All legs must win for the parlay to pay out, but the combined odds create significantly higher potential returns than individual bets.
              </p>
              <p>
                Enter American odds for each leg (e.g., -110 for favorites, +150 for underdogs). The calculator multiplies the decimal equivalents together to determine your combined odds, total payout, and implied win probability.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-8">
            <h2 className="text-xl font-bold text-white mb-4">Parlay Payout Formula</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Total Payout = Stake x (Decimal Odds Leg 1 x Decimal Odds Leg 2 x ... x Decimal Odds Leg N)</strong>
              </p>
              <p>
                For example, a 3-leg parlay with -110, +120, and -105 odds on a $100 stake: Convert each to decimal (1.909, 2.200, 1.952), multiply together (8.20), then multiply by stake = $820 total payout ($720 profit).
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-8">
            <h2 className="text-xl font-bold text-white mb-4">Parlay Betting Tips</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Correlated parlays (legs that influence each other) offer better expected value than random combinations.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Keep parlays to 2-4 legs for realistic win probability. Each added leg exponentially reduces your chance of winning.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Compare parlay payouts across sportsbooks — some offer parlay boosts or better odds on specific combinations.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Use our AI-powered <Link href="/parlay-builder" className="text-emerald-400 underline">Parlay Builder</Link> to find optimal leg combinations with correlation analysis.</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 p-8">
            <h3 className="text-lg font-bold text-white mb-2">Want AI-Optimized Parlays?</h3>
            <p className="text-sm text-slate-400 mb-4">
              ChalkPicks Pro uses AI to find correlated parlays with the highest expected value across all sports.
            </p>
            <Link href="/pricing">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                Try ChalkPicks Pro <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
