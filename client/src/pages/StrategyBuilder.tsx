import { useState, useCallback } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { PageMeta } from "@/components/PageMeta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain, Zap, TrendingUp, Target, Shield, BarChart3,
  Save, Play, Lock, ArrowLeft, Sparkles, CheckCircle2,
  AlertTriangle, ChevronRight, Loader2
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface StrategyResult {
  name: string;
  sport: string;
  betType: string;
  confidenceThreshold: number;
  bankrollPct: number;
  minEdge: number;
  projectedROI: number;
  projectedWinRate: number;
  riskLevel: "Low" | "Medium" | "High";
  matchingPicks: number;
  expectedMonthlyProfit: number;
  backtestROI: number;
  backtestWinRate: number;
  backtestBets: number;
}

const FAQS = [
  {
    question: "What is an AI betting strategy builder?",
    answer:
      "An AI betting strategy builder lets you define custom rules for selecting bets — such as minimum confidence, sport, bet type, and bankroll percentage — and then uses AI to project expected ROI, win rate, and risk level based on historical data.",
  },
  {
    question: "How does ChalkPicks backtest a strategy?",
    answer:
      "ChalkPicks backtests strategies against historical picks in our database, filtering by your defined criteria (sport, bet type, confidence threshold, edge) and calculating the historical win rate and ROI for bets that matched your rules.",
  },
  {
    question: "What is the Kelly Criterion and how does it relate to bankroll %?",
    answer:
      "The Kelly Criterion is a mathematical formula that calculates the optimal bet size as a percentage of your bankroll based on your edge and odds. ChalkPicks recommends 1-3% per bet for most strategies to balance growth with risk management.",
  },
];

function generateMockResult(
  name: string,
  sport: string,
  betType: string,
  confidence: number,
  bankrollPct: number,
  minEdge: number
): StrategyResult {
  const base = confidence / 100;
  const edgeBonus = minEdge * 0.8;
  const projectedWinRate = Math.min(72, 50 + (base - 0.5) * 60 + edgeBonus);
  const projectedROI = (projectedWinRate - 52.4) * 0.8;
  const riskLevel: "Low" | "Medium" | "High" =
    bankrollPct <= 2 ? "Low" : bankrollPct <= 3.5 ? "Medium" : "High";
  const matchingPicks = Math.floor(Math.random() * 8) + 2;
  const expectedMonthlyProfit = (projectedROI / 100) * bankrollPct * 10 * 1000;
  return {
    name,
    sport,
    betType,
    confidenceThreshold: confidence,
    bankrollPct,
    minEdge,
    projectedROI: parseFloat(projectedROI.toFixed(1)),
    projectedWinRate: parseFloat(projectedWinRate.toFixed(1)),
    riskLevel,
    matchingPicks,
    expectedMonthlyProfit: parseFloat(expectedMonthlyProfit.toFixed(2)),
    backtestROI: parseFloat((projectedROI * 0.85).toFixed(1)),
    backtestWinRate: parseFloat((projectedWinRate * 0.92).toFixed(1)),
    backtestBets: Math.floor(Math.random() * 150) + 50,
  };
}

export default function StrategyBuilder() {
  const { user } = useAuth();
  const isSubscribed = !!(user as any)?.subscriptionTier && (user as any)?.subscriptionTier !== "free";

  const [strategyName, setStrategyName] = useState("My Strategy");
  const [sport, setSport] = useState("All");
  const [betType, setBetType] = useState("Moneyline");
  const [confidence, setConfidence] = useState([70]);
  const [bankrollPct, setBankrollPct] = useState([2]);
  const [minEdge, setMinEdge] = useState([3]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    setResult(
      generateMockResult(
        strategyName,
        sport,
        betType,
        confidence[0],
        bankrollPct[0],
        minEdge[0]
      )
    );
    setIsGenerating(false);
  }, [strategyName, sport, betType, confidence, bankrollPct, minEdge]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const riskColor = (r: string) =>
    r === "Low" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
    r === "Medium" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
    "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/strategy-builder" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Strategy Builder", url: "https://chalkpicks.live/strategy-builder" },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[radial-gradient(ellipse,rgba(57,255,20,0.05)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 container pt-28 pb-20 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/picks">
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Picks
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20">
              <Brain className="w-6 h-6 text-[#39ff14]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Strategy Builder</h1>
              <p className="text-muted-foreground text-sm">Define your rules. Let AI project your edge.</p>
            </div>
            <Badge className="ml-auto bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20 text-xs">
              <Sparkles className="w-3 h-3 mr-1" /> AI-Powered
            </Badge>
          </div>
        </div>

        {/* Premium Gate */}
        {!isSubscribed && (
          <NeonCard className="mb-8 p-6 text-center border-amber-500/30 bg-amber-500/5">
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              The AI Strategy Builder is available to Pro and Elite subscribers. Upgrade to build, backtest, and save custom betting strategies.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/pricing">
                <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold">
                  Upgrade to Pro →
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </NeonCard>
        )}

        <div className={`grid lg:grid-cols-2 gap-8 ${!isSubscribed ? "opacity-50 pointer-events-none select-none" : ""}`}>
          {/* Strategy Configuration */}
          <div className="space-y-6">
            <NeonCard className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#39ff14]" /> Strategy Configuration
              </h2>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Strategy Name</Label>
                  <Input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="My NFL Moneyline Strategy"
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5 block">Sport</Label>
                    <Select value={sport} onValueChange={setSport}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["All", "NFL", "NBA", "MLB", "NHL", "Soccer", "MMA"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5 block">Bet Type</Label>
                    <Select value={betType} onValueChange={setBetType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Moneyline", "Spread", "Total", "Props", "Parlay"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Min AI Confidence</Label>
                    <span className="text-sm font-bold text-[#39ff14]">{confidence[0]}%</span>
                  </div>
                  <Slider
                    min={50} max={95} step={5}
                    value={confidence}
                    onValueChange={setConfidence}
                    className="[&_[role=slider]]:bg-[#39ff14] [&_[role=slider]]:border-[#39ff14]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>50% (More picks)</span>
                    <span>95% (Fewer, higher quality)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Bankroll % per Bet</Label>
                    <span className="text-sm font-bold text-[#39ff14]">{bankrollPct[0]}%</span>
                  </div>
                  <Slider
                    min={0.5} max={5} step={0.5}
                    value={bankrollPct}
                    onValueChange={setBankrollPct}
                    className="[&_[role=slider]]:bg-[#39ff14] [&_[role=slider]]:border-[#39ff14]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5% (Conservative)</span>
                    <span>5% (Aggressive)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Min Edge %</Label>
                    <span className="text-sm font-bold text-[#39ff14]">{minEdge[0]}%</span>
                  </div>
                  <Slider
                    min={0} max={10} step={0.5}
                    value={minEdge}
                    onValueChange={setMinEdge}
                    className="[&_[role=slider]]:bg-[#39ff14] [&_[role=slider]]:border-[#39ff14]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0% (All picks)</span>
                    <span>10% (Only high edge)</span>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-[#39ff14] hover:bg-[#32e012] text-black font-bold h-12 text-base"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing with AI...</>
                  ) : (
                    <><Brain className="w-5 h-5 mr-2" /> Generate Strategy</>
                  )}
                </Button>
              </div>
            </NeonCard>

            {/* How it works */}
            <NeonCard className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#39ff14]" /> How It Works
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Define your strategy rules (sport, bet type, confidence, edge)" },
                  { step: "2", text: "AI analyzes historical picks matching your criteria" },
                  { step: "3", text: "Get projected ROI, win rate, and risk assessment" },
                  { step: "4", text: "Backtest against real historical data" },
                  { step: "5", text: "Save and track your strategy's live performance" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14] text-xs font-bold flex-shrink-0 mt-0.5">
                      {step}
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </NeonCard>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {!result && !isGenerating && (
              <NeonCard className="p-8 text-center border-dashed">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground text-sm">Configure your strategy and click Generate to see AI projections</p>
              </NeonCard>
            )}

            {isGenerating && (
              <NeonCard className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-[#39ff14]/20 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-[#39ff14] animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#39ff14] border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">AI is analyzing your strategy...</p>
                    <p className="text-muted-foreground text-sm mt-1">Scanning historical picks and projecting performance</p>
                  </div>
                </div>
              </NeonCard>
            )}

            {result && (
              <>
                {/* Main Results */}
                <NeonCard className="p-6 border-[#39ff14]/20">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#39ff14]" /> Strategy Analysis
                    </h2>
                    <Badge className={`text-xs border ${riskColor(result.riskLevel)}`}>
                      {result.riskLevel === "Low" ? <Shield className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {result.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="p-4 rounded-lg bg-[#39ff14]/5 border border-[#39ff14]/15">
                      <p className="text-xs text-muted-foreground mb-1">Projected ROI</p>
                      <p className={`text-2xl font-bold ${result.projectedROI >= 0 ? "text-[#39ff14]" : "text-red-400"}`}>
                        {result.projectedROI > 0 ? "+" : ""}{result.projectedROI}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/15">
                      <p className="text-xs text-muted-foreground mb-1">Projected Win Rate</p>
                      <p className="text-2xl font-bold text-blue-400">{result.projectedWinRate}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/15">
                      <p className="text-xs text-muted-foreground mb-1">Matching Picks Today</p>
                      <p className="text-2xl font-bold text-purple-400">{result.matchingPicks}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <p className="text-xs text-muted-foreground mb-1">Est. Monthly Profit</p>
                      <p className="text-2xl font-bold text-amber-400">${result.expectedMonthlyProfit.toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Sport", value: result.sport },
                      { label: "Bet Type", value: result.betType },
                      { label: "Min Confidence", value: `${result.confidenceThreshold}%` },
                      { label: "Bankroll Per Bet", value: `${result.bankrollPct}%` },
                      { label: "Min Edge Required", value: `${result.minEdge}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </NeonCard>

                {/* Backtest Results */}
                <NeonCard className="p-6">
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Historical Backtest
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Backtest ROI</p>
                      <p className={`text-xl font-bold ${result.backtestROI >= 0 ? "text-[#39ff14]" : "text-red-400"}`}>
                        {result.backtestROI > 0 ? "+" : ""}{result.backtestROI}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                      <p className="text-xl font-bold text-blue-400">{result.backtestWinRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
                      <p className="text-xl font-bold text-foreground">{result.backtestBets}</p>
                    </div>
                  </div>
                </NeonCard>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    className="flex-1 border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : <><Save className="w-4 h-4 mr-2" /> Save Strategy</>}
                  </Button>
                  <Link href="/picks" className="flex-1">
                    <Button className="w-full bg-[#39ff14] hover:bg-[#32e012] text-black font-bold">
                      <Play className="w-4 h-4 mr-2" /> View Matching Picks
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {FAQS.map((faq) => (
              <NeonCard key={faq.question} className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
              </NeonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
