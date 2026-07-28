import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function BlogBestPicks() {
  const [, setLocation] = useLocation();
  const { data: performance } = trpc.picks.performance.useQuery();
  const overall = performance?.overall;

  useEffect(() => {
    document.title = "Best Sports Betting Picks Today | AI Predictions | ChalkPicks Pro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      // No win-rate claim here: this description previously advertised a
      // hardcoded "92% win rate" straight into search snippets.
      meta.setAttribute("content", "AI-powered sports betting picks with daily predictions for NFL, NBA, MLB — confidence scores, +EV analysis, and a fully graded public track record.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-700">AI-Powered Picks</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Best Sports Betting Picks Today</h1>
          <p className="text-xl text-slate-300 mb-8">
            Get daily AI-generated picks with real-time odds analysis, confidence scores, and a publicly graded ROI track record for NFL, NBA, MLB, and more.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation("/picks")} className="bg-emerald-500 hover:bg-emerald-600">
              View Today's Picks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => setLocation("/pricing")} variant="outline" className="border-slate-700 hover:bg-slate-800">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-emerald-400">What Makes a Good Sports Betting Pick?</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>A winning sports betting pick combines three critical elements: accurate data analysis, real-time odds comparison, and disciplined bankroll management. ChalkPicks Pro uses machine learning to analyze millions of data points to identify picks with positive expected value (+EV).</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-slate-700/50"><div className="font-semibold text-emerald-400 mb-2">Data-Driven</div><p className="text-sm">Real-time odds, player stats, injury reports, weather</p></div>
                <div className="p-4 rounded-lg bg-slate-700/50"><div className="font-semibold text-emerald-400 mb-2">Confidence Scored</div><p className="text-sm">70-95% confidence ratings based on model certainty</p></div>
                <div className="p-4 rounded-lg bg-slate-700/50"><div className="font-semibold text-emerald-400 mb-2">ROI Tracked</div><p className="text-sm">Every pick graded and published on our public track record</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-emerald-400">How ChalkPicks AI Generates Picks</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { num: 1, title: "Data Collection", desc: "Scrapes real-time odds from 18+ sportsbooks, player stats, injury reports, and game schedules" },
                { num: 2, title: "Line Movement Analysis", desc: "Detects sharp money and steam moves when professional bettors move the line" },
                { num: 3, title: "EV Calculation", desc: "Identifies +EV opportunities where our model probability exceeds implied odds probability" },
                { num: 4, title: "Confidence Scoring", desc: "Rates each pick 70-95% confidence based on model certainty and historical accuracy" },
                { num: 5, title: "Daily Delivery", desc: "Generates picks at 8 AM UTC daily, updated with latest odds and injury reports" }
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0"><div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-700"><span className="text-emerald-400 font-bold">{step.num}</span></div></div>
                  <div><h4 className="font-semibold text-white">{step.title}</h4><p className="text-slate-400 text-sm">{step.desc}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-emerald-400">Graded Track Record</CardTitle></CardHeader>
            <CardContent>
              {/* Real settled-pick results. This card previously advertised a
                  fabricated "backtest" (92% win rate, +$8.2K, 2,847 picks
                  tested) — an unsubstantiated performance claim on a public,
                  search-indexed page. */}
              {!overall || overall.totalPicks === 0 ? (
                <p className="text-sm text-slate-400">
                  Results publish here as picks settle. See the{" "}
                  <a href="/performance" className="text-emerald-400 underline">full performance page</a> for the live record.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-emerald-700/30"><div className="text-3xl font-bold text-emerald-400">{overall.winRate}%</div><p className="text-sm text-slate-400">Win Rate</p></div>
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-emerald-700/30"><div className="text-3xl font-bold text-emerald-400">{overall.roi >= 0 ? "+" : ""}{overall.roi}%</div><p className="text-sm text-slate-400">ROI (flat 1u)</p></div>
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-emerald-700/30"><div className="text-3xl font-bold text-emerald-400">{overall.wins}-{overall.losses}</div><p className="text-sm text-slate-400">Record</p></div>
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-emerald-700/30"><div className="text-3xl font-bold text-emerald-400">{overall.totalPicks.toLocaleString()}</div><p className="text-sm text-slate-400">Picks Graded</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-emerald-400">Sports We Cover</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {["NFL", "NBA", "MLB", "NHL", "College Football", "College Basketball", "MLS", "Tennis", "Golf"].map((sport) => (
                  <div key={sport} className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/50"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-slate-300">{sport}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-emerald-400">Premium Features</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Daily AI picks with confidence scores (70-95%)", "Real-time odds comparison across 18+ sportsbooks", "Line movement tracking and steam move alerts", "Bankroll management tools (Kelly Criterion calculator)", "Performance analytics and ROI tracking", "Community leaderboard and expert rankings", "Backtesting engine for historical analysis", "Email alerts for new picks and line movements"].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2"><Zap className="w-4 h-4 text-emerald-400" /><span className="text-slate-300">{feature}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-700/50 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20">
            <CardContent className="pt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Get Better Picks?</h3>
                <p className="text-slate-300 mb-6">Start your free 7-day trial today. No credit card required. Access all premium features.</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation("/pricing")} className="bg-emerald-500 hover:bg-emerald-600">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  <Button onClick={() => setLocation("/picks")} variant="outline" className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/20">View Today's Picks</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="py-12 bg-slate-800/30 rounded-xl px-6">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "How accurate are the picks?", a: "Every pick is timestamped, graded automatically, and published on our public performance page — you can review the full record yourself rather than take a marketing number at face value. Always practice responsible bankroll management." },
                { q: "What's the difference between free and premium picks?", a: "Free users see pick titles only. Premium users get full analysis, confidence scores, odds comparisons, ROI tracking, and exclusive premium picks." },
                { q: "Can I use the picks on any sportsbook?", a: "Yes! Our picks work on any sportsbook. We compare odds across 18+ books to help you find the best line." },
                { q: "Is there a free trial?", a: "Yes! Get 7 days free access to all premium features. No credit card required. Cancel anytime." },
                { q: "How often are picks updated?", a: "New picks are generated daily at 8 AM UTC. We also update existing picks if there are major line movements or injury updates." }
              ].map((faq, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"><h4 className="font-semibold text-white mb-2">{faq.q}</h4><p className="text-slate-400 text-sm">{faq.a}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
