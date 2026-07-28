import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { HowToJsonLd, BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, TrendingUp, Percent, Info, ChevronRight } from "lucide-react";

const FAQS = [
  {
    question: "What is a free bet converter?",
    answer:
      "A free bet converter calculates how to turn a sportsbook free bet into guaranteed cash profit by placing two opposing bets. You bet the free bet on one side and hedge with real money on the other side, locking in a profit regardless of the outcome.",
  },
  {
    question: "What conversion rate should I expect?",
    answer:
      "Typical free bet conversion rates range from 70-85% depending on the odds available. Higher odds on the free bet side and lower juice on the hedge side produce better conversion rates.",
  },
  {
    question: "Which sportsbooks offer the best free bets to convert?",
    answer:
      "DraftKings, FanDuel, BetMGM, Caesars, and PointsBet regularly offer sign-up bonuses and free bets. Comparing odds across books using ChalkPicks' odds comparison tool helps you find the best hedge odds.",
  },
];

function toDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export default function FreeBetConverter() {
  const [freeBetAmount, setFreeBetAmount] = useState("100");
  const [freeBetOdds, setFreeBetOdds] = useState("+200");
  const [hedgeOdds, setHedgeOdds] = useState("-220");

  const result = useMemo(() => {
    const amount = parseFloat(freeBetAmount) || 0;
    const fbOddsNum = parseFloat(freeBetOdds.replace("+", "")) || 200;
    const hedgeOddsNum = parseFloat(hedgeOdds.replace("+", "")) || -220;

    if (!amount || isNaN(fbOddsNum) || isNaN(hedgeOddsNum)) return null;

    const decFree = toDecimal(fbOddsNum);
    const decHedge = toDecimal(hedgeOddsNum);

    // Free bet wins: profit = amount * (decFree - 1) [stake not returned on free bet]
    // Hedge wins: profit = hedgeBet * (decHedge - 1) - hedgeBet = hedgeBet * decHedge - 2*hedgeBet
    // For guaranteed profit: amount*(decFree-1) - hedgeBet = hedgeBet*(decHedge-1)
    // => hedgeBet = amount*(decFree-1) / decHedge
    const hedgeBet = (amount * (decFree - 1)) / decHedge;
    const profitIfFreeWins = amount * (decFree - 1) - hedgeBet;
    const profitIfHedgeWins = hedgeBet * (decHedge - 1) - 0; // free bet loses (no stake returned)
    const guaranteedProfit = Math.min(profitIfFreeWins, profitIfHedgeWins);
    const conversionRate = (guaranteedProfit / amount) * 100;

    return {
      hedgeBet: Math.max(0, hedgeBet),
      profitIfFreeWins,
      profitIfHedgeWins,
      guaranteedProfit: Math.max(0, guaranteedProfit),
      conversionRate: Math.max(0, conversionRate),
      totalRisk: Math.max(0, hedgeBet),
    };
  }, [freeBetAmount, freeBetOdds, hedgeOdds]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/tools/free-bet-converter" />
      <HowToJsonLd
        name="How to Convert a Free Bet to Cash"
        description="Convert any sportsbook free bet into guaranteed cash profit using the ChalkPicks free bet converter."
        totalTime="PT3M"
        steps={[
          { name: "Enter your free bet amount", text: "Input the dollar value of your sportsbook free bet bonus." },
          { name: "Enter the free bet odds", text: "Find a game with high odds (e.g. +200 or higher) and enter those American odds." },
          { name: "Enter the hedge bet odds", text: "Find the opposite side of the same game at another sportsbook and enter those odds." },
          { name: "Place both bets", text: "Place your free bet at the first sportsbook and the hedge bet with real money at the second sportsbook." },
          { name: "Collect your guaranteed profit", text: "Regardless of which side wins, you collect the guaranteed profit shown by the calculator." },
        ]}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Tools", url: "https://chalkpicks.live/tools" },
          { name: "Free Bet Converter", url: "https://chalkpicks.live/tools/free-bet-converter" },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      <Navbar />

      <div className="pt-20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/tools">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> All Tools
            </Button>
          </Link>

          <div className="mb-8 text-center">
            <Badge className="bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20 text-xs mb-4 px-3 py-1">FREE TOOL</Badge>
            <h1 className="text-4xl font-bold text-foreground">Free Bet Converter</h1>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Convert any sportsbook free bet into guaranteed cash profit. Calculate the exact hedge bet needed to lock in profit regardless of outcome.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Inputs */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-[#39ff14] text-base">Your Free Bet Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Free Bet Amount ($)</Label>
                  <Input
                    value={freeBetAmount}
                    onChange={(e) => setFreeBetAmount(e.target.value)}
                    placeholder="100"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Free Bet Odds (American)</Label>
                  <Input
                    value={freeBetOdds}
                    onChange={(e) => setFreeBetOdds(e.target.value)}
                    placeholder="+200"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Higher odds = better conversion rate</p>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Hedge Bet Odds (American)</Label>
                  <Input
                    value={hedgeOdds}
                    onChange={(e) => setHedgeOdds(e.target.value)}
                    placeholder="-220"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Opposite side at another sportsbook</p>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-blue-400 text-base">Conversion Results</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#39ff14]/5 border border-[#39ff14]/20 text-center">
                      <p className="text-xs text-slate-400 mb-1">Guaranteed Profit</p>
                      <p className="text-3xl font-bold text-[#39ff14]">${result.guaranteedProfit.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-slate-400 text-sm flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Hedge Bet Needed
                        </span>
                        <span className="text-white font-semibold">${result.hedgeBet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-slate-400 text-sm flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5" /> Conversion Rate
                        </span>
                        <span className={`font-semibold ${result.conversionRate >= 70 ? "text-[#39ff14]" : result.conversionRate >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {result.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-slate-400 text-sm">If Free Bet Wins</span>
                        <span className="text-emerald-400 font-semibold">+${result.profitIfFreeWins.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-400 text-sm">If Hedge Wins</span>
                        <span className="text-emerald-400 font-semibold">+${result.profitIfHedgeWins.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400">
                        Place <strong className="text-white">${result.hedgeBet.toFixed(2)}</strong> on the opposite side to guarantee <strong className="text-[#39ff14]">${result.guaranteedProfit.toFixed(2)}</strong> profit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Enter your free bet details to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Educational Section */}
          <Card className="border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-base">How Free Bet Conversion Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <p>
                Free bets are promotional credits given by sportsbooks that let you place a bet without risking your own money — but the stake is not returned when you win. A free bet converter turns this into guaranteed cash by placing a hedge bet on the opposite outcome at another sportsbook.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {[
                  { title: "Step 1: Find High Odds", desc: "Look for a game where one side is priced at +150 or higher. The higher the odds on your free bet, the better your conversion rate.", color: "text-[#39ff14]" },
                  { title: "Step 2: Calculate Hedge", desc: "Use this calculator to find the exact hedge bet amount. Place the free bet on the high-odds side, and the hedge bet with real money on the other side.", color: "text-blue-400" },
                  { title: "Step 3: Collect Profit", desc: "Regardless of which side wins, you collect a guaranteed profit. The conversion rate shows what % of the free bet value you lock in as cash.", color: "text-purple-400" },
                ].map(({ title, desc, color }) => (
                  <div key={title} className="p-3 rounded-lg bg-slate-700/30">
                    <p className={`font-semibold ${color} mb-1`}>{title}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <Card key={faq.question} className="border-slate-700 bg-slate-800/30">
                  <CardContent className="pt-4 pb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-xs text-slate-400 pl-6">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="p-6 rounded-xl text-center" style={{ background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.15)" }}>
            <p className="text-foreground font-semibold mb-1">Find the best odds for free bet conversion</p>
            <p className="text-muted-foreground text-sm mb-4">Use ChalkPicks' odds comparison to find the highest free bet odds and lowest hedge juice</p>
            <Link href="/odds-comparison">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
                Compare Odds Now →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
