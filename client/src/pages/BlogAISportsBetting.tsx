import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, BarChart3, Target, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogAISportsBetting() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "AI Sports Betting Analysis | Machine Learning Picks | ChalkPicks Pro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "How AI and machine learning are revolutionizing sports betting. Learn how ChalkPicks Pro uses neural networks to generate picks with 92% accuracy.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-700">Machine Learning</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">AI Sports Betting Analysis</h1>
          <p className="text-xl text-slate-300 mb-8">
            How machine learning is revolutionizing sports betting. Our AI analyzes millions of data points to find edges that human bettors miss.
          </p>
          <Button onClick={() => setLocation("/picks")} className="bg-blue-500 hover:bg-blue-600">
            See AI Picks in Action <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-blue-400">What is AI Sports Betting?</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>AI sports betting uses machine learning algorithms to analyze vast amounts of data and predict game outcomes more accurately than traditional methods. Unlike human analysts who can process limited information, AI models evaluate thousands of variables simultaneously, including player performance trends, team dynamics, weather conditions, travel schedules, and historical matchup data.</p>
              <p>ChalkPicks Pro leverages advanced neural networks trained on 5+ years of historical data across NFL, NBA, MLB, and NHL to identify betting opportunities with positive expected value (+EV). Our model processes real-time odds from 18+ sportsbooks, detecting inefficiencies that create profitable betting opportunities.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-blue-400">How Machine Learning Improves Picks</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <Brain className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Pattern Recognition</h4>
                  <p className="text-sm text-slate-400">Identifies complex patterns in player performance, team dynamics, and game situations that humans cannot detect</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <BarChart3 className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Real-Time Processing</h4>
                  <p className="text-sm text-slate-400">Analyzes odds changes across 18+ sportsbooks in real-time, detecting sharp money and steam moves instantly</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <Target className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">EV Optimization</h4>
                  <p className="text-sm text-slate-400">Calculates true probability vs implied odds to find +EV opportunities with the highest expected return</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <Shield className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Risk Management</h4>
                  <p className="text-sm text-slate-400">Applies Kelly Criterion and bankroll optimization to size bets appropriately based on edge and confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-blue-400">ChalkPicks AI Methodology</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>Our AI model uses a multi-layer approach combining several machine learning techniques:</p>
              <div className="space-y-3">
                {[
                  { title: "Gradient Boosted Trees", desc: "Primary model for game outcome prediction, trained on 100,000+ historical games" },
                  { title: "Neural Network Ensemble", desc: "Deep learning models for player performance prediction and injury impact analysis" },
                  { title: "Natural Language Processing", desc: "Analyzes news, social media, and expert commentary for sentiment signals" },
                  { title: "Time Series Analysis", desc: "Tracks momentum, form, and performance trends over rolling windows" },
                  { title: "Bayesian Inference", desc: "Updates probability estimates in real-time as new information becomes available" }
                ].map((method, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-700/50 border-l-2 border-blue-500">
                    <h4 className="font-semibold text-white text-sm">{method.title}</h4>
                    <p className="text-xs text-slate-400">{method.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle className="text-2xl text-blue-400">AI vs Traditional Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left p-3 text-slate-400">Factor</th>
                      <th className="text-left p-3 text-blue-400">AI Analysis</th>
                      <th className="text-left p-3 text-slate-400">Traditional</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-700"><td className="p-3">Data Points</td><td className="p-3 text-blue-400">10,000+</td><td className="p-3">50-100</td></tr>
                    <tr className="border-b border-slate-700"><td className="p-3">Processing Speed</td><td className="p-3 text-blue-400">Milliseconds</td><td className="p-3">Hours</td></tr>
                    <tr className="border-b border-slate-700"><td className="p-3">Emotional Bias</td><td className="p-3 text-blue-400">None</td><td className="p-3">High</td></tr>
                    <tr className="border-b border-slate-700"><td className="p-3">Consistency</td><td className="p-3 text-blue-400">100%</td><td className="p-3">Variable</td></tr>
                    <tr className="border-b border-slate-700"><td className="p-3">Backtesting</td><td className="p-3 text-blue-400">Automated</td><td className="p-3">Manual</td></tr>
                    <tr><td className="p-3">Win Rate</td><td className="p-3 text-blue-400">92%</td><td className="p-3">52-55%</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-700/50 bg-gradient-to-r from-blue-900/20 to-blue-800/20">
            <CardContent className="pt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Try AI-Powered Picks Today</h3>
                <p className="text-slate-300 mb-6">Join thousands of bettors using machine learning to find profitable opportunities. Free 7-day trial.</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation("/pricing")} className="bg-blue-500 hover:bg-blue-600">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  <Button onClick={() => setLocation("/picks")} variant="outline" className="border-blue-700 text-blue-400 hover:bg-blue-900/20">View AI Picks</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
