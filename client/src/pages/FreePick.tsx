import { getSportBadgeClass } from "@/lib/badges";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { Link } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain, TrendingUp, Target, Zap, ArrowRight, CheckCircle2,
  Calendar, Clock, BarChart3, Shield, Star, Lock
} from "lucide-react";
import { toast } from "sonner";
import ConfidenceBar from "@/components/ConfidenceBar";

const SPORT_ICONS: Record<string, string> = {
  nfl: "🏈", nba: "🏀", mlb: "⚾", nhl: "🏒",
  ncaaf: "🏈", ncaab: "🏀", soccer: "⚽", mma: "🥊",
};

export default function FreePick() {
  const { data, isLoading } = trpc.picks.freeDailyPick.useQuery();
  const { data: perfData } = trpc.picks.performance.useQuery();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubscribed(true);
      toast.success("Subscribed! You'll get free daily picks in your inbox.");
    },
    onError: () => toast.error("Something went wrong. Try again."),
  });

  const pick = data?.pick;
  const today = data?.date ?? new Date().toISOString().split("T")[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    newsletterMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(57, 255, 20, 0.04) 0%, transparent 60%)",
        }} />
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="badge-free text-xs mb-4 px-3 py-1">FREE DAILY PICK</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Today's Free AI Pick
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One free AI-generated sports pick every day with full analysis, confidence score, and edge rating.
              No account required. No credit card.
            </p>
          </div>

          {/* Trust Stats Bar */}
          {perfData && (
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  +{perfData.overall?.roi?.toFixed(1) ?? "0"} ROI All-Time
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {perfData.overall?.winRate?.toFixed(1) ?? "0"}% Win Rate
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {perfData.overall?.totalPicks ?? "0"} Picks Graded
                </span>
              </div>
            </div>
          )}

          {/* Free Pick Card */}
          {isLoading ? (
            <NeonCard className="max-w-2xl mx-auto p-8 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-8 bg-muted rounded w-2/3 mb-4" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </NeonCard>
          ) : pick ? (
            <NeonCard className="max-w-2xl mx-auto p-0 overflow-hidden" variant="premium">
              {/* Pick Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{SPORT_ICONS[pick.sportKey] ?? "🎯"}</span>
                    <div>
                      <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded-full ${getSportBadgeClass(pick.sportKey)}`}>
                        {(pick.sportKey ?? "").replace(/americanfootball_|basketball_|baseball_|icehockey_/i, "").toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{pick.pickType?.replace("_", " ")}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{today}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="badge-free border-0 text-xs">FREE</Badge>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {pick.awayTeam} @ {pick.homeTeam}
                </h2>
              </div>

              {/* Pick Details - FULLY VISIBLE */}
              <div className="p-6 space-y-5">
                {/* Recommendation */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">Official Pick</div>
                  <div className="text-2xl font-black text-primary">{pick.recommendation}</div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Odds</div>
                    <div className="text-lg font-mono font-bold text-foreground">
                      {(pick.odds ?? 0) > 0 ? `+${pick.odds}` : pick.odds ?? "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <div className="text-lg font-mono font-bold text-primary">{Number(pick.confidenceScore ?? 0)}%</div>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Edge</div>
                    <div className="text-lg font-mono font-bold text-foreground">+{String(pick.edgeScore ?? "0")}%</div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <ConfidenceBar score={Number(pick.confidenceScore ?? 0)} height="h-2" />

                {/* AI Analysis */}
                {pick.aiAnalysis && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">AI Analysis</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pick.aiAnalysis}
                    </p>
                  </div>
                )}

                {/* Key Factors */}
                {(() => {
                  const factors = pick.keyFactors as string[] | null;
                  if (!factors || !Array.isArray(factors) || factors.length === 0) return null;
                  return (
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Key Factors</div>
                      <div className="flex flex-wrap gap-2">
                        {factors.map((factor: string, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Result (if graded) */}
                {pick.result && pick.result !== "pending" && (
                  <div className={`p-3 rounded-xl text-center font-bold text-sm uppercase tracking-wider ${
                    pick.result === "win" ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                    pick.result === "loss" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                  }`}>
                    Result: {pick.result}
                  </div>
                )}
              </div>
            </NeonCard>
          ) : (
            <NeonCard className="max-w-2xl mx-auto p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Today's Pick Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Our AI generates fresh picks every morning. Subscribe below to get notified.
              </p>
            </NeonCard>
          )}
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="py-12 border-t border-border/50">
        <div className="container max-w-xl mx-auto px-4 text-center">
          <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Get Free Picks in Your Inbox</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe to receive our daily free AI pick plus graded results every morning. No spam, unsubscribe anytime.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">You're subscribed! Check your inbox.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="btn-cta px-6" disabled={newsletterMutation.isPending}>
                {newsletterMutation.isPending ? "..." : "Subscribe"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Premium Upsell Section */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Want More Than 1 Pick Per Day?</h2>
            <p className="text-sm text-muted-foreground">
              Premium members get 5-10 AI picks daily plus access to all professional betting tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <NeonCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="badge-free border-0 text-xs">FREE</Badge>
                <span className="text-sm font-medium text-foreground">Current Plan</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1 AI pick per day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Full analysis & confidence score</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Public track record</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Email alerts</li>
              </ul>
            </NeonCard>
            <NeonCard className="p-6" variant="premium">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="badge-premium border-0 text-xs">PREMIUM</Badge>
                <span className="text-sm font-medium text-foreground">From $9.99/day</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> 5-10 AI picks daily</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> +EV Finder & Arbitrage tools</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Steam Move Detector</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> CLV Tracker & Kelly Calculator</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Parlay Builder & DFS Optimizer</li>
              </ul>
              <Link href="/pricing">
                <Button className="w-full mt-4 btn-cta">
                  View Plans <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </NeonCard>
          </div>
        </div>
      </section>

      {/* Track Record CTA */}
      <section className="py-12 border-t border-border/50">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Full Transparency</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Every pick is publicly graded. View our complete track record with wins, losses, ROI, and units.
          </p>
          <Link href="/performance">
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              View Track Record <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
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
