import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Calculator, TrendingUp, DollarSign, RefreshCw, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ─── Odds Conversion Helpers ────────────────────────────────────────────────
function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}
function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}
function decimalToImplied(decimal: number): number {
  return (1 / decimal) * 100;
}
function americanToImplied(american: number): number {
  if (american > 0) return (100 / (american + 100)) * 100;
  return (Math.abs(american) / (Math.abs(american) + 100)) * 100;
}
function impliedToAmerican(implied: number): number {
  const p = implied / 100;
  if (p >= 0.5) return Math.round(-p / (1 - p) * 100);
  return Math.round((1 - p) / p * 100);
}

// ─── Odds Converter ──────────────────────────────────────────────────────────
function OddsConverter() {
  const [american, setAmerican] = useState("");
  const [decimal, setDecimal] = useState("");
  const [implied, setImplied] = useState("");
  const [fractional, setFractional] = useState("");

  const fromAmerican = (val: string) => {
    setAmerican(val);
    const n = parseFloat(val);
    if (isNaN(n) || (n > -100 && n < 100 && n !== 0)) return;
    const dec = americanToDecimal(n);
    setDecimal(dec.toFixed(3));
    setImplied(americanToImplied(n).toFixed(2));
    const num = dec - 1;
    const gcd = (a: number, b: number): number => b < 0.001 ? a : gcd(b, a % b);
    const d = 100;
    const g = gcd(Math.round(num * d), d);
    setFractional(`${Math.round(num * d / g)}/${d / g}`);
  };

  const fromDecimal = (val: string) => {
    setDecimal(val);
    const n = parseFloat(val);
    if (isNaN(n) || n <= 1) return;
    setAmerican(decimalToAmerican(n).toString());
    setImplied(decimalToImplied(n).toFixed(2));
    const num = n - 1;
    const gcd = (a: number, b: number): number => b < 0.001 ? a : gcd(b, a % b);
    const d = 100;
    const g = gcd(Math.round(num * d), d);
    setFractional(`${Math.round(num * d / g)}/${d / g}`);
  };

  const fromImplied = (val: string) => {
    setImplied(val);
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0 || n >= 100) return;
    const am = impliedToAmerican(n);
    setAmerican(am.toString());
    const dec = americanToDecimal(am);
    setDecimal(dec.toFixed(3));
    const num = dec - 1;
    const gcd = (a: number, b: number): number => b < 0.001 ? a : gcd(b, a % b);
    const d = 100;
    const g = gcd(Math.round(num * d), d);
    setFractional(`${Math.round(num * d / g)}/${d / g}`);
  };

  const clear = () => { setAmerican(""); setDecimal(""); setImplied(""); setFractional(""); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">American Odds</Label>
          <Input
            placeholder="-110 or +150"
            value={american}
            onChange={e => fromAmerican(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono text-lg h-12 focus:border-[#00ff87]"
          />
          <p className="text-xs text-gray-500">e.g. -110, +150, -200</p>
        </div>
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">Decimal Odds</Label>
          <Input
            placeholder="1.909"
            value={decimal}
            onChange={e => fromDecimal(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono text-lg h-12 focus:border-[#00ff87]"
          />
          <p className="text-xs text-gray-500">Used in Europe/Australia</p>
        </div>
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">Implied Probability (%)</Label>
          <Input
            placeholder="52.38"
            value={implied}
            onChange={e => fromImplied(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono text-lg h-12 focus:border-[#00ff87]"
          />
          <p className="text-xs text-gray-500">True win probability</p>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400 font-semibold text-sm">Fractional Odds</Label>
          <Input
            placeholder="10/11"
            value={fractional}
            readOnly
            className="bg-[#0d0d14] border-[#1a1a2a] text-gray-400 font-mono text-lg h-12 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500">UK format (read-only)</p>
        </div>
      </div>
      <Button onClick={clear} variant="outline" size="sm" className="border-[#2a2a3a] text-gray-400 hover:text-white">
        <RefreshCw className="w-3 h-3 mr-2" /> Clear
      </Button>
    </div>
  );
}

// ─── Parlay Calculator ───────────────────────────────────────────────────────
interface ParlayLeg {
  id: number;
  odds: string;
}

function ParlayCalculator() {
  const [legs, setLegs] = useState<ParlayLeg[]>([{ id: 1, odds: "" }, { id: 2, odds: "" }]);
  const [stake, setStake] = useState("100");
  const nextId = legs.length + 1;

  const addLeg = () => setLegs(prev => [...prev, { id: nextId, odds: "" }]);
  const removeLeg = (id: number) => setLegs(prev => prev.filter(l => l.id !== id));
  const updateLeg = (id: number, odds: string) => setLegs(prev => prev.map(l => l.id === id ? { ...l, odds } : l));

  const validLegs = legs.filter(l => {
    const n = parseFloat(l.odds);
    return !isNaN(n) && (n >= 100 || n <= -100);
  });

  const combinedDecimal = validLegs.reduce((acc, l) => {
    return acc * americanToDecimal(parseFloat(l.odds));
  }, 1);

  const stakeNum = parseFloat(stake) || 0;
  const payout = stakeNum * combinedDecimal;
  const profit = payout - stakeNum;
  const combinedAmerican = validLegs.length >= 2 ? decimalToAmerican(combinedDecimal) : null;
  const impliedProb = validLegs.length >= 2 ? decimalToImplied(combinedDecimal) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {legs.map((leg, i) => (
          <div key={leg.id} className="flex items-center gap-3">
            <span className="text-gray-500 text-sm w-16 shrink-0">Leg {i + 1}</span>
            <Input
              placeholder="American odds (e.g. -110)"
              value={leg.odds}
              onChange={e => updateLeg(leg.id, e.target.value)}
              className="bg-[#111118] border-[#2a2a3a] text-white font-mono focus:border-[#00ff87]"
            />
            {legs.length > 2 && (
              <Button onClick={() => removeLeg(leg.id)} variant="ghost" size="sm" className="text-brand-red hover:text-red-300 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button onClick={addLeg} variant="outline" size="sm" className="border-[#2a2a3a] text-[#00ff87] hover:bg-[#00ff87]/10">
        <Plus className="w-3 h-3 mr-2" /> Add Leg
      </Button>

      <div className="space-y-2">
        <Label className="text-[#00ff87] font-semibold text-sm">Stake ($)</Label>
        <Input
          placeholder="100"
          value={stake}
          onChange={e => setStake(e.target.value)}
          className="bg-[#111118] border-[#2a2a3a] text-white font-mono text-lg h-12 focus:border-[#00ff87] max-w-xs"
        />
      </div>

      {validLegs.length >= 2 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Parlay Odds</p>
            <p className="text-lg font-bold font-mono text-white">
              {combinedAmerican !== null ? (combinedAmerican > 0 ? `+${combinedAmerican}` : combinedAmerican) : "—"}
            </p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Payout</p>
            <p className="text-lg font-bold font-mono text-[#00ff87]">${payout.toFixed(2)}</p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Profit</p>
            <p className="text-lg font-bold font-mono text-[#ff6b35]">${profit.toFixed(2)}</p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Win Probability</p>
            <p className="text-lg font-bold font-mono text-brand-gold">{impliedProb?.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kelly Criterion ─────────────────────────────────────────────────────────
function KellyCalculator() {
  const [bankroll, setBankroll] = useState("1000");
  const [odds, setOdds] = useState("");
  const [winProb, setWinProb] = useState("");
  const [fraction, setFraction] = useState<"full" | "half" | "quarter">("half");

  const bankrollNum = parseFloat(bankroll) || 0;
  const oddsNum = parseFloat(odds);
  const winProbNum = parseFloat(winProb) / 100;

  let kellyFraction = 0;
  let recommendation = "";
  let betAmount = 0;
  let ev = 0;

  if (!isNaN(oddsNum) && !isNaN(winProbNum) && winProbNum > 0 && winProbNum < 1 && (oddsNum >= 100 || oddsNum <= -100)) {
    const b = americanToDecimal(oddsNum) - 1; // net odds
    const p = winProbNum;
    const q = 1 - p;
    kellyFraction = (b * p - q) / b;
    ev = (b * p - q) * 100; // EV per $100

    const multiplier = fraction === "full" ? 1 : fraction === "half" ? 0.5 : 0.25;
    betAmount = Math.max(0, kellyFraction * multiplier * bankrollNum);
    recommendation = kellyFraction <= 0
      ? "No edge — skip this bet"
      : kellyFraction < 0.05
      ? "Small edge — minimal bet"
      : kellyFraction < 0.15
      ? "Moderate edge — solid bet"
      : "Strong edge — high-confidence bet";
  }

  const fractionMultiplier = fraction === "full" ? 1 : fraction === "half" ? 0.5 : 0.25;
  const adjustedKelly = kellyFraction * fractionMultiplier * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">Bankroll ($)</Label>
          <Input
            placeholder="1000"
            value={bankroll}
            onChange={e => setBankroll(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono h-12 focus:border-[#00ff87]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">American Odds</Label>
          <Input
            placeholder="-110 or +200"
            value={odds}
            onChange={e => setOdds(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono h-12 focus:border-[#00ff87]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#00ff87] font-semibold text-sm">Your Win Probability (%)</Label>
          <Input
            placeholder="55"
            value={winProb}
            onChange={e => setWinProb(e.target.value)}
            className="bg-[#111118] border-[#2a2a3a] text-white font-mono h-12 focus:border-[#00ff87]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 font-semibold text-sm">Kelly Fraction</Label>
        <div className="flex gap-2">
          {(["full", "half", "quarter"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFraction(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                fraction === f
                  ? "bg-[#00ff87]/20 border-[#00ff87] text-[#00ff87]"
                  : "bg-[#111118] border-[#2a2a3a] text-gray-400 hover:border-[#00ff87]/50"
              }`}
            >
              {f === "full" ? "Full Kelly" : f === "half" ? "Half Kelly" : "Quarter Kelly"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">Half Kelly is recommended for most bettors to reduce variance</p>
      </div>

      {betAmount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="bg-[#111118] border border-[#00ff87]/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Recommended Bet</p>
            <p className="text-xl font-bold font-mono text-[#00ff87]">${betAmount.toFixed(2)}</p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Kelly %</p>
            <p className="text-xl font-bold font-mono text-white">{adjustedKelly.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Expected Value</p>
            <p className={`text-xl font-bold font-mono ${ev > 0 ? "text-[#ff6b35]" : "text-brand-red"}`}>
              {ev > 0 ? "+" : ""}{ev.toFixed(1)}%
            </p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Edge</p>
            <p className={`text-sm font-semibold ${kellyFraction > 0 ? "text-[#00ff87]" : "text-brand-red"}`}>
              {recommendation}
            </p>
          </div>
        </div>
      )}

      {kellyFraction <= 0 && odds && winProb && (
        <div className="bg-red-900/20 border border-brand-red/30 rounded-lg p-3 text-center">
          <p className="text-brand-red font-semibold">No edge detected — the implied probability exceeds your win estimate. Skip this bet.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BetCalculator() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <div className="border-b border-[#1a1a2a] bg-gradient-to-b from-[#0d0d18] to-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Badge className="mb-4 bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/30 text-xs font-semibold px-3 py-1">
            FREE TOOL — NO SIGNUP REQUIRED
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Sports Betting <span className="text-[#00ff87]">Calculator</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
            Free odds converter, parlay calculator, and Kelly Criterion bankroll tool. No account needed.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calculator className="w-4 h-4 text-[#00ff87]" /> Odds Converter</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-[#00ff87]" /> Parlay Calculator</span>
            <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-[#00ff87]" /> Kelly Criterion</span>
          </div>
        </div>
      </div>

      {/* Calculators */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Tabs defaultValue="odds" className="w-full">
          <TabsList className="bg-[#111118] border border-[#2a2a3a] mb-8 w-full sm:w-auto">
            <TabsTrigger value="odds" className="data-[state=active]:bg-[#00ff87]/20 data-[state=active]:text-[#00ff87] flex-1 sm:flex-none">
              <Calculator className="w-4 h-4 mr-2" /> Odds Converter
            </TabsTrigger>
            <TabsTrigger value="parlay" className="data-[state=active]:bg-[#00ff87]/20 data-[state=active]:text-[#00ff87] flex-1 sm:flex-none">
              <TrendingUp className="w-4 h-4 mr-2" /> Parlay Builder
            </TabsTrigger>
            <TabsTrigger value="kelly" className="data-[state=active]:bg-[#00ff87]/20 data-[state=active]:text-[#00ff87] flex-1 sm:flex-none">
              <DollarSign className="w-4 h-4 mr-2" /> Kelly Criterion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="odds">
            <Card className="bg-[#0d0d18] border-[#2a2a3a]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#00ff87]" />
                  Odds Converter
                </CardTitle>
                <p className="text-gray-400 text-sm">Convert between American, Decimal, and Implied Probability formats instantly.</p>
              </CardHeader>
              <CardContent>
                <OddsConverter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parlay">
            <Card className="bg-[#0d0d18] border-[#2a2a3a]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00ff87]" />
                  Parlay Calculator
                </CardTitle>
                <p className="text-gray-400 text-sm">Calculate combined parlay odds, total payout, and win probability for up to 12 legs.</p>
              </CardHeader>
              <CardContent>
                <ParlayCalculator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kelly">
            <Card className="bg-[#0d0d18] border-[#2a2a3a]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#00ff87]" />
                  Kelly Criterion Bankroll Calculator
                </CardTitle>
                <p className="text-gray-400 text-sm">Calculate the mathematically optimal bet size based on your edge and bankroll.</p>
              </CardHeader>
              <CardContent>
                <KellyCalculator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SEO Content */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6 text-sm text-gray-400">
          <div>
            <h2 className="text-white font-semibold mb-2">What is +EV Betting?</h2>
            <p>Positive expected value (+EV) betting means placing wagers where your true win probability exceeds the implied probability in the odds. Over time, +EV bets are profitable even if you lose individual bets.</p>
          </div>
          <div>
            <h2 className="text-white font-semibold mb-2">How Does Kelly Criterion Work?</h2>
            <p>The Kelly Criterion calculates the optimal fraction of your bankroll to bet based on your edge. Half Kelly is recommended to reduce variance while still growing your bankroll efficiently.</p>
          </div>
          <div>
            <h2 className="text-white font-semibold mb-2">How to Read Parlay Odds</h2>
            <p>Parlay odds multiply each leg's decimal odds together. A 3-leg parlay at -110 each gives combined odds of +596 — meaning a $100 bet pays $696 total. The more legs, the higher the payout but lower the win probability.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#00ff87]/10 to-[#ff6b35]/10 border border-[#00ff87]/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Want AI to find the +EV bets for you?
          </h2>
          <p className="text-gray-400 mb-6">ChalkPicks scans 15+ sportsbooks in real time to surface the highest-edge picks with confidence scores, edge analysis, and line movement alerts.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing">
              <Button className="bg-[#ff6b35] hover:bg-[#ff8555] text-white font-bold px-8 py-3 text-base">
                Start Free 3-Day Trial <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/ev-finder">
              <Button variant="outline" className="border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87]/10 px-8 py-3 text-base">
                Try Free +EV Finder
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-3">$9.99/mo after trial · Cancel anytime · No commitment</p>
        </div>
      </div>
    </div>
  );
}
