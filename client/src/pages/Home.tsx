import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import {
  TrendingUp, Zap, BarChart3, Shield, Trophy, Brain,
  ArrowRight, CheckCircle2, Star, Target, Lock, ChevronRight, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const performanceData = [
  { month: "Oct", roi: 12.1 },
  { month: "Nov", roi: 15.3 },
  { month: "Dec", roi: 19.7 },
  { month: "Jan", roi: 18.4 },
  { month: "Feb", roi: 21.3 },
  { month: "Mar", roi: 23.1 },
];

const features = [
  { icon: Brain, title: "AI-Powered Analysis", desc: "LLM engine analyzes thousands of data points — player stats, matchup history, weather, injuries — to generate picks with confidence scores.", color: "text-primary", bg: "bg-primary/10" },
  { icon: Activity, title: "Real-Time Live Data", desc: "Live odds, scores, injury reports, and player stats updated every 30 seconds across NFL, NBA, MLB, NHL, Soccer, and more.", color: "text-accent", bg: "bg-accent/10" },
  { icon: BarChart3, title: "Advanced Backtesting", desc: "Test any strategy against years of historical data. Filter by sport, confidence threshold, bet type, and date range to find your edge.", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: Target, title: "Edge Scoring", desc: "Every pick comes with a proprietary Edge Score (1-10) showing how much value you have vs. the market. Only bet when the edge is real.", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Trophy, title: "Community Leaderboard", desc: "Compete with thousands of bettors. Track your rank, win rate, and ROI. Learn from the top performers in the community.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Shield, title: "Bet Tracker & Analytics", desc: "Log every bet, track your bankroll, analyze your performance by sport, bet type, and time period. Know your numbers.", color: "text-green-400", bg: "bg-green-400/10" },
];

const statsBar = [
  { label: "Win Rate (2024)", value: "73.1%", sub: "Verified picks" },
  { label: "Average ROI", value: "+18.4%", sub: "Per unit staked" },
  { label: "Active Members", value: "12,847", sub: "Across all tiers" },
  { label: "Picks Generated", value: "847K+", sub: "Since launch" },
];

const testimonials = [
  { name: "Marcus T.", role: "Pro Bettor", text: "ChalkPicks Pro transformed how I bet. The AI analysis is insanely detailed and the backtesting showed me exactly which strategies work.", stars: 5 },
  { name: "Sarah K.", role: "Sports Analyst", text: "The real-time data and confidence scores are unmatched. I've been profitable for 8 consecutive months since subscribing.", stars: 5 },
  { name: "Derek M.", role: "Daily Bettor", text: "Finally a platform that treats bettors like professionals. The edge scoring alone is worth the subscription price.", stars: 5 },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: picksData } = trpc.picks.list.useQuery({ limit: 3, tier: "all" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(oklch(0.78 0.18 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.18 85) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary border-primary/30 text-sm font-medium">
              <Zap className="w-3.5 h-3.5" /> AI-Powered Sports Betting Intelligence
            </Badge>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl tracking-wider mb-6 leading-none">
              SMARTER PICKS.<br />
              <span className="text-gold-gradient">REAL EDGE.</span><br />
              PROVEN RESULTS.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The most advanced sports betting analytics platform ever built. AI-generated picks with confidence scores, live data feeds, backtesting engine, and community leaderboard — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {isAuthenticated ? (
                <Link href="/picks">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold text-base px-8 h-12">
                    View Today's Picks <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold text-base px-8 h-12" onClick={() => (window.location.href = getLoginUrl())}>
                  Start Free Today <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              <Link href="/picks">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-medium text-base px-8 h-12">
                  View Today's Picks
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsBar.map((stat) => (
                <div key={stat.label} className="bg-card/60 border border-border/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className="font-display text-3xl text-gold-gradient">{stat.value}</div>
                  <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Chart */}
      <section className="py-16 border-y border-border/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/15 text-accent border-accent/30">Verified Track Record</Badge>
              <h2 className="font-display text-4xl lg:text-5xl tracking-wider mb-4">
                <span className="text-emerald-gradient">73.1% WIN RATE</span><br />OVER 12 MONTHS
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every pick is logged, tracked, and verified. Our AI model has maintained a 73.1% win rate and +18.4% ROI over the past year across all major sports leagues.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "NFL", winRate: "72.4%", roi: "+16.8%" },
                  { label: "NBA", winRate: "73.6%", roi: "+19.2%" },
                  { label: "MLB", winRate: "73.4%", roi: "+18.9%" },
                  { label: "NHL", winRate: "73.0%", roi: "+17.6%" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{s.winRate}</span>
                      <span className="text-xs font-medium text-accent">{s.roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Monthly ROI Performance</span>
                <Badge className="badge-win border-0 text-xs">Live Tracking</Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.78 0.18 85)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                  <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} labelStyle={{ color: "oklch(0.95 0.01 260)" }} formatter={(v: number) => [`${v}%`, "ROI"]} />
                  <Area type="monotone" dataKey="roi" stroke="oklch(0.78 0.18 85)" strokeWidth={2} fill="url(#roiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Picks Preview */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 badge-pending border-0 text-xs">Updated Daily</Badge>
              <h2 className="font-display text-4xl tracking-wider">TODAY'S <span className="text-gold-gradient">TOP PICKS</span></h2>
            </div>
            <Link href="/picks">
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {picksData?.picks?.slice(0, 3).map((pick) => (
              <Link key={pick.id} href={`/picks/${pick.id}`}>
                <Card className="bg-card border-border card-hover cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`text-xs ${pick.tier === "premium" ? "badge-premium" : "badge-free"} border-0`}>
                        {pick.tier === "premium" ? "⭐ Premium" : "Free"}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase font-medium">{pick.sportKey}</span>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1">{pick.awayTeam} @ {pick.homeTeam}</div>
                      <div className="font-bold text-foreground text-base">{pick.recommendation}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{pick.odds && pick.odds > 0 ? `+${pick.odds}` : pick.odds}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-bold text-primary">{pick.confidenceScore}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pick.confidenceScore}%` }} />
                      </div>
                    </div>
                    {pick.tier === "premium" && !isAuthenticated && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" /> Subscribe to unlock full analysis
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/picks">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                View All Today's Picks <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">Platform Features</Badge>
            <h2 className="font-display text-4xl lg:text-5xl tracking-wider mb-4">
              EVERYTHING YOU NEED TO <span className="text-gold-gradient">WIN</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built by professional bettors and data scientists. Every feature is designed to give you a measurable edge over the market.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border-border card-hover">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl tracking-wider mb-2">WHAT OUR <span className="text-gold-gradient">MEMBERS SAY</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero-gradient border-t border-border/50">
        <div className="container text-center">
          <h2 className="font-display text-5xl lg:text-6xl tracking-wider mb-6">
            READY TO BET <span className="text-gold-gradient">SMARTER?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join 12,847+ members who use ChalkPicks Pro to gain a real edge. Start free, upgrade when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/pricing">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold px-8 h-12">
                  Upgrade to Pro <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold px-8 h-12" onClick={() => (window.location.href = getLoginUrl())}>
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8 h-12">View Pricing</Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> No credit card for free tier</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Verified results</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-display text-lg tracking-wider">CHALK<span className="text-gold-gradient">PICKS</span> PRO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/picks" className="hover:text-foreground transition-colors">Picks</Link>
              <Link href="/stats" className="hover:text-foreground transition-colors">Stats</Link>
              <Link href="/backtesting" className="hover:text-foreground transition-colors">Backtesting</Link>
              <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            </div>
            <div className="text-xs text-muted-foreground">© 2024 ChalkPicks Pro. Bet responsibly.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
