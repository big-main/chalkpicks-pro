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
import { ArrowLeft, Target, TrendingUp, ChevronRight, CheckCircle2, XCircle, Info } from "lucide-react";

const FAQS = [
  {
    question: "What is a middle in sports betting?",
    answer:
      "A middle occurs when you bet both sides of a game at different lines and there is a scenario where both bets can win. For example, betting Team A -3 and Team B +4.5 creates a middle window: if Team A wins by exactly 4, both bets win.",
  },
  {
    question: "How do I find middle opportunities?",
    answer:
      "Middles occur when line movement creates a gap between two lines at different sportsbooks. Shop lines across multiple books and look for spreads or totals where the lines have diverged enough to create a middle window.",
  },
  {
    question: "Are middles profitable?",
    answer:
      "Middles are a low-risk, high-reward strategy. In the worst case, you lose the vig on one side (small loss). In the best case, both bets win (large profit). The middle probability depends on the size of the window and the sport.",
  },
];

function toDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export default function MiddlesFinder() {
  const [gameName, setGameName] = useState("Chiefs vs Eagles");
  const [sideAOdds, setSideAOdds] = useState("-110");
  const [sideALine, setSideALine] = useState("-3");
  const [sideBOdds, setSideBOdds] = useState("-110");
  const [sideBLine, setSideBLine] = useState("+4.5");
  const [stake, setStake] = useState("100");

  const result = useMemo(() => {
    const stakeNum = parseFloat(stake) || 100;
    const aOddsNum = parseFloat(sideAOdds.replace("+", "")) || -110;
    const bOddsNum = parseFloat(sideBOdds.replace("+", "")) || -110;
    const aLine = parseFloat(sideALine) || -3;
    const bLine = parseFloat(sideBLine.replace("+", "")) || 4.5;

    const decA = toDecimal(aOddsNum);
    const decB = toDecimal(bOddsNum);

    const payoutA = stakeNum * decA;
    const payoutB = stakeNum * decB;
    const profitA = payoutA - stakeNum;
    const profitB = payoutB - stakeNum;

    // Middle window: if Side A is -3 and Side B is +4.5, middle window is 3 < margin <= 4.5
    const lowerBound = Math.abs(aLine);
    const upperBound = Math.abs(bLine);
    const hasMiddle = upperBound > lowerBound;
    const middleWindow = hasMiddle ? upperBound - lowerBound : 0;

    // Rough probability of hitting the middle (depends on sport and window size)
    const middleProbability = hasMiddle ? Math.min(25, middleWindow * 4.5) : 0;

    // Scenarios
    const bothWinProfit = profitA + profitB;
    const aWinsProfit = profitA - stakeNum;
    const bWinsProfit = profitB - stakeNum;
    const bothLoseProfit = -(stakeNum * 2);

    // Expected value
    const pMiddle = middleProbability / 100;
    const pOneSideWins = (1 - pMiddle) * 0.9;
    const pBothLose = (1 - pMiddle) * 0.1;
    const ev = pMiddle * bothWinProfit + pOneSideWins * ((aWinsProfit + bWinsProfit) / 2) + pBothLose * bothLoseProfit;

    return {
      hasMiddle,
      middleWindow,
      middleProbability,
      payoutA,
      payoutB,
      profitA,
      profitB,
      bothWinProfit,
      aWinsProfit,
      bWinsProfit,
      bothLoseProfit,
      ev,
      totalRisk: stakeNum * 2,
      lowerBound,
      upperBound,
    };
  }, [sideAOdds, sideALine, sideBOdds, sideBLine, stake]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/tools/middles-finder" />
      <HowToJsonLd
        name="How to Find and Bet Middles"
        description="Calculate middle opportunities in sports betting using the ChalkPicks free middles finder tool."
        totalTime="PT3M"
        steps={[
          { name: "Enter the game name", text: "Input the teams or event you want to analyze for a middle opportunity." },
          { name: "Enter Side A odds and line", text: "Input the American odds and spread/total line for Side A (e.g., -110 at -3)." },
          { name: "Enter Side B odds and line", text: "Input the American odds and spread/total line for Side B at a different sportsbook (e.g., -110 at +4.5)." },
          { name: "Enter your stake", text: "Input how much you want to bet on each side." },
          { name: "Analyze the middle", text: "Review the middle window, probability, and expected value to decide if the middle is worth betting." },
        ]}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Tools", url: "https://chalkpicks.live/tools" },
          { name: "Middles Finder", url: "https://chalkpicks.live/tools/middles-finder" },
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
            <h1 className="text-4xl font-bold text-foreground">Middles Finder</h1>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Find middle opportunities where you can win both sides of a bet. Enter two lines from different sportsbooks to calculate your middle window and expected value.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Inputs */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-[#39ff14] text-base">Game Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Game / Event</Label>
                  <Input
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="Chiefs vs Eagles"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-400 mb-3">Side A (Book 1)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Odds</Label>
                      <Input
                        value={sideAOdds}
                        onChange={(e) => setSideAOdds(e.target.value)}
                        placeholder="-110"
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Line</Label>
                      <Input
                        value={sideALine}
                        onChange={(e) => setSideALine(e.target.value)}
                        placeholder="-3"
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-3">Side B (Book 2)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Odds</Label>
                      <Input
                        value={sideBOdds}
                        onChange={(e) => setSideBOdds(e.target.value)}
                        placeholder="-110"
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Line</Label>
                      <Input
                        value={sideBLine}
                        onChange={(e) => setSideBLine(e.target.value)}
                        placeholder="+4.5"
                        className="bg-slate-700/50 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Stake Per Side ($)</Label>
                  <Input
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="100"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#39ff14]" />
                  Middle Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.hasMiddle ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#39ff14]/5 border border-[#39ff14]/20 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-[#39ff14]" />
                        <span className="text-[#39ff14] font-bold">Middle Exists!</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Win both if margin is between {result.lowerBound} and {result.upperBound}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                        <p className="text-xs text-slate-400 mb-1">Middle Window</p>
                        <p className="text-xl font-bold text-[#39ff14]">{result.middleWindow.toFixed(1)} pts</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                        <p className="text-xs text-slate-400 mb-1">Hit Probability</p>
                        <p className="text-xl font-bold text-blue-400">~{result.middleProbability.toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-700">
                        <span className="text-slate-400">🏆 Both Win (Middle)</span>
                        <span className="text-[#39ff14] font-bold">+${result.bothWinProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Side A Wins Only</span>
                        <span className={result.aWinsProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {result.aWinsProfit >= 0 ? "+" : ""}${result.aWinsProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Side B Wins Only</span>
                        <span className={result.bWinsProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {result.bWinsProfit >= 0 ? "+" : ""}${result.bWinsProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Both Lose (Push)</span>
                        <span className="text-red-400">${result.bothLoseProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400 font-semibold">Expected Value</span>
                        <span className={`font-bold ${result.ev >= 0 ? "text-[#39ff14]" : "text-red-400"}`}>
                          {result.ev >= 0 ? "+" : ""}${result.ev.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400">
                        Total risk: <strong className="text-white">${result.totalRisk.toFixed(2)}</strong>. Best case: <strong className="text-[#39ff14]">+${result.bothWinProfit.toFixed(2)}</strong> if the middle hits.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-bold">No Middle</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        The lines overlap — no middle window exists. Try finding lines with a larger gap.
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Side A Profit</span>
                        <span className="text-emerald-400">+${result.profitA.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Side B Profit</span>
                        <span className="text-emerald-400">+${result.profitB.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Educational Section */}
          <Card className="border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-base">Middles Betting Strategy Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <p>
                A "middle" is one of the most powerful strategies in sports betting. By betting both sides of a game at different lines from different sportsbooks, you create a scenario where both bets can win simultaneously.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="font-semibold text-[#39ff14] mb-1">Example Middle</p>
                  <p className="text-xs text-slate-400">You bet Chiefs -3 at Book A and Eagles +4.5 at Book B. If Chiefs win by exactly 4, both bets win. If Chiefs win by 3 or less, your Eagles bet wins. If Chiefs win by 5+, your Chiefs bet wins.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="font-semibold text-blue-400 mb-1">Why Middles Work</p>
                  <p className="text-xs text-slate-400">In the worst case, you lose only the vig on one side (small loss). In the best case, both bets win for a large profit. The risk/reward ratio is highly favorable when the middle window is 1+ points.</p>
                </div>
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
            <p className="text-foreground font-semibold mb-1">Find line movement opportunities in real time</p>
            <p className="text-muted-foreground text-sm mb-4">ChalkPicks tracks line movement across 15+ sportsbooks to alert you to middle opportunities</p>
            <Link href="/line-movement">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
                View Line Movement →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
