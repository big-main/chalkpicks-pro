import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogStrategy() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Sports Betting Strategy Guide 2026 | Bankroll Management | ChalkPicks Pro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Complete sports betting strategy guide. Learn bankroll management, Kelly Criterion, line shopping, +EV betting, and common mistakes to avoid.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-700">Strategy Guide</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Sports Betting Strategy Guide 2026</h1>
          <p className="text-xl text-slate-300 mb-8">
            Master bankroll management, Kelly Criterion, line shopping, and +EV betting. The complete guide to profitable sports betting.
          </p>
          <Button onClick={() => setLocation("/tools/roi-calculator")} className="bg-amber-500 hover:bg-amber-600">
            Try Our ROI Calculator <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-amber-400"><DollarSign className="w-6 h-6 inline mr-2" />Bankroll Management</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>Bankroll management is the single most important factor in long-term betting success. Even with a 92% win rate, poor bankroll management can lead to ruin. Here are the key principles:</p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/50 border-l-2 border-amber-500"><h4 className="font-semibold text-white text-sm">1-3% Unit Size</h4><p className="text-xs text-slate-400">Never risk more than 1-3% of your total bankroll on a single bet. This protects against variance.</p></div>
                <div className="p-3 rounded-lg bg-slate-700/50 border-l-2 border-amber-500"><h4 className="font-semibold text-white text-sm">Separate Bankroll</h4><p className="text-xs text-slate-400">Keep betting funds separate from personal finances. Only bet with money you can afford to lose.</p></div>
                <div className="p-3 rounded-lg bg-slate-700/50 border-l-2 border-amber-500"><h4 className="font-semibold text-white text-sm">Track Everything</h4><p className="text-xs text-slate-400">Log every bet with date, sport, odds, stake, and result. Use ChalkPicks Performance Tracker for automated tracking.</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-amber-400"><Target className="w-6 h-6 inline mr-2" />Kelly Criterion</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>The Kelly Criterion is a mathematical formula that determines the optimal bet size based on your edge and the odds offered. It maximizes long-term growth while minimizing risk of ruin.</p>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-amber-700/30">
                <p className="font-mono text-center text-lg text-amber-400 mb-2">f* = (bp - q) / b</p>
                <p className="text-xs text-slate-400 text-center">Where: f* = fraction of bankroll, b = decimal odds - 1, p = probability of winning, q = 1 - p</p>
              </div>
              <p className="text-sm">Most professional bettors use fractional Kelly (25-50% of full Kelly) to reduce variance. ChalkPicks provides Kelly-optimized unit sizes with every pick.</p>
              <Button onClick={() => setLocation("/bet-calculator")} variant="outline" className="border-amber-700 text-amber-400 hover:bg-amber-900/20">
                Use Our Kelly Calculator
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-amber-400"><TrendingUp className="w-6 h-6 inline mr-2" />Line Shopping</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>Line shopping means comparing odds across multiple sportsbooks to find the best price. Even small differences in odds compound over time into significant profit differences.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">Example: NFL Spread</h4>
                  <p className="text-sm">Book A: Chiefs -3 (-110)</p>
                  <p className="text-sm">Book B: Chiefs -3 (-105)</p>
                  <p className="text-sm text-amber-400 mt-2">Saving 5 cents per bet = $500+ annually on 100 bets</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">ChalkPicks Advantage</h4>
                  <p className="text-sm">Our Odds Comparison tool shows real-time odds from 18+ sportsbooks, highlighting the best line for every pick.</p>
                  <Button onClick={() => setLocation("/odds-comparison")} size="sm" variant="outline" className="mt-2 border-amber-700 text-amber-400">
                    Compare Odds Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-amber-400">+EV Betting Explained</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>Positive Expected Value (+EV) betting is the foundation of profitable sports betting. A bet has +EV when your estimated probability of winning exceeds the implied probability from the odds.</p>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-amber-700/30">
                <h4 className="font-semibold text-white mb-2">Example:</h4>
                <p className="text-sm">Odds: +150 (implied probability = 40%)</p>
                <p className="text-sm">Your model says: 50% chance of winning</p>
                <p className="text-sm text-amber-400 mt-2">EV = (0.50 x $150) - (0.50 x $100) = +$25 per $100 bet</p>
              </div>
              <p className="text-sm">ChalkPicks EV Finder automatically identifies +EV opportunities across all sports and sportsbooks.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-amber-400"><AlertTriangle className="w-6 h-6 inline mr-2" />Common Mistakes to Avoid</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { mistake: "Chasing Losses", fix: "Stick to your unit size regardless of recent results. Variance is normal." },
                  { mistake: "Betting on Favorites Only", fix: "Value exists on both sides. Focus on +EV, not just who you think will win." },
                  { mistake: "Ignoring Line Movement", fix: "Sharp money moves lines. If a line moves against you, re-evaluate the bet." },
                  { mistake: "Parlays Over Singles", fix: "Parlays have higher vig. Focus on singles unless you find correlated parlays." },
                  { mistake: "Emotional Betting", fix: "Never bet on your favorite team. Remove emotion from the process entirely." },
                  { mistake: "Not Tracking Results", fix: "Without data, you cannot improve. Track every bet and analyze monthly." }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-700/50 flex gap-4">
                    <div className="flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                    <div><h4 className="font-semibold text-white text-sm">{item.mistake}</h4><p className="text-xs text-slate-400">{item.fix}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-700/50 bg-gradient-to-r from-amber-900/20 to-amber-800/20">
            <CardContent className="pt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Use Our Tools to Optimize Your Strategy</h3>
                <p className="text-slate-300 mb-6">ChalkPicks Pro includes Kelly Calculator, ROI Tracker, Odds Comparison, and EV Finder. Free 7-day trial.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button onClick={() => setLocation("/pricing")} className="bg-amber-500 hover:bg-amber-600">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  <Button onClick={() => setLocation("/tools/roi-calculator")} variant="outline" className="border-amber-700 text-amber-400 hover:bg-amber-900/20">ROI Calculator</Button>
                  <Button onClick={() => setLocation("/tools/odds-calculator")} variant="outline" className="border-amber-700 text-amber-400 hover:bg-amber-900/20">Odds Calculator</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
