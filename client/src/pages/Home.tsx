import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Zap, BarChart3, Trophy, Brain,
  ArrowRight, CheckCircle2, Star, Target, Lock,
  TrendingUp, Percent,
  Calculator, CloudLightning, Layers, Eye, Flame
} from "lucide-react";
import NeonCard from "@/components/NeonCard";
import { HeroBackground } from "@/components/HeroBackground";
import { FadeIn, StaggerChildren, StaggerItem, ScaleOnHover } from "@/components/animations";
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
  {
    icon: Brain,
    title: "AI Pick Engine",
    desc: "Neural network analyzes thousands of data points — player stats, matchup history, weather, injuries — generating picks with confidence scores.",
    color: "#39ff14",
    badge: "CORE",
  },
  {
    icon: Percent,
    title: "+EV Finder",
    desc: "Scan real-time odds from 10+ sportsbooks to surface positive expected value bets. Only bet when the math is on your side.",
    color: "#f0b800",
    badge: "EXCLUSIVE",
  },
  {
    icon: TrendingUp,
    title: "Steam Move Detector",
    desc: "Detect sudden sharp money line movements the moment they happen. Follow the sharps, not the public.",
    color: "#60a5fa",
    badge: "LIVE",
  },
  {
    icon: Eye,
    title: "Public Betting %",
    desc: "See where the public money is going on every game. Fade the public or follow the sharp money.",
    color: "#a855f7",
    badge: "NEW",
  },
  {
    icon: Calculator,
    title: "Kelly Criterion Tool",
    desc: "Mathematically optimal bet sizing based on your edge and bankroll. Never over-bet or under-bet again.",
    color: "#39ff14",
    badge: "FREE",
  },
  {
    icon: CloudLightning,
    title: "Weather Impact Model",
    desc: "Real weather data integrated into NFL and MLB picks. Wind speed, temperature, and precipitation affect outcomes.",
    color: "#f0b800",
    badge: "NEW",
  },
  {
    icon: Layers,
    title: "Parlay Optimizer",
    desc: "AI-powered correlated parlay builder. Finds leg combinations that are statistically linked for higher combined win probability.",
    color: "#60a5fa",
    badge: "AI",
  },
  {
    icon: BarChart3,
    title: "Advanced Backtesting",
    desc: "Test any strategy against years of historical data. Filter by sport, confidence, bet type, and date range.",
    color: "#a855f7",
    badge: "PRO",
  },
  {
    icon: Target,
    title: "CLV Tracker",
    desc: "Track your closing line value on every bet. CLV is the #1 predictor of long-term profitability.",
    color: "#39ff14",
    badge: "PRO",
  },
];

const statsBar = [
  { label: "Win Rate", value: "92%", sub: "Verified 12-month", color: "#39ff14" },
  { label: "Avg ROI", value: "+18.4%", sub: "Per unit staked", color: "#f0b800" },
  { label: "Members", value: "12,847", sub: "Active bettors", color: "#60a5fa" },
  { label: "Picks", value: "847K+", sub: "Generated & tracked", color: "#a855f7" },
];

const testimonials = [
  { name: "Marcus T.", role: "Pro Bettor", text: "The +EV finder alone pays for the subscription 10x over. I've never had a tool this precise for finding real value.", stars: 5, streak: "12W" },
  { name: "Sarah K.", role: "Sports Analyst", text: "The steam move detector is insane. I get alerted the second sharp money hits and I can beat the closing line consistently.", stars: 5, streak: "8W" },
  { name: "Derek M.", role: "Daily Bettor", text: "Kelly Criterion tool changed how I size bets. My bankroll grew 34% in 3 months just from better bet sizing.", stars: 5, streak: "15W" },
  { name: "Jason R.", role: "Sharp Bettor", text: "I've used every tool out there. ChalkPicks is the only platform that consistently finds +EV spots before the market corrects.", stars: 5, streak: "10W" },
  { name: "Amanda L.", role: "DFS Player", text: "The AI correlation engine for parlays is next level. Hit a 6-leg parlay last week that no other tool would have suggested.", stars: 5, streak: "6W" },
  { name: "Chris B.", role: "Bankroll Manager", text: "From $500 to $4,200 in 4 months. The combination of +EV bets and Kelly sizing is unbeatable.", stars: 5, streak: "9W" },
];

const sportStats = [
  { label: "NFL", winRate: "72.4%", roi: "+16.8%", games: "1,204" },
  { label: "NBA", winRate: "73.6%", roi: "+19.2%", games: "2,847" },
  { label: "MLB", winRate: "73.4%", roi: "+18.9%", games: "3,102" },
  { label: "NHL", winRate: "73.0%", roi: "+17.6%", games: "892" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: picksData } = trpc.picks.list.useQuery({ limit: 3, tier: "all" });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute animate-orb"
            style={{
              top: "-20%", left: "10%",
              width: "60vw", height: "60vw",
              background: "radial-gradient(ellipse, rgba(57, 255, 20, 0.07) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute animate-orb"
            style={{
              bottom: "-30%", right: "-10%",
              width: "50vw", height: "50vw",
              background: "radial-gradient(ellipse, rgba(59, 130, 246, 0.06) 0%, transparent 60%)",
              filter: "blur(80px)",
              animationDelay: "-7s",
            }}
          />
          <div
            className="absolute animate-orb"
            style={{
              top: "40%", right: "20%",
              width: "30vw", height: "30vw",
              background: "radial-gradient(ellipse, rgba(168, 85, 247, 0.04) 0%, transparent 60%)",
              filter: "blur(60px)",
              animationDelay: "-14s",
            }}
          />
        </div>

        {/* Animated particle mesh background */}
        <HeroBackground />

        {/* Subtle grid */}
        <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-static text-xs font-semibold tracking-wide">
                <span className="live-dot" />
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>AI-Powered Sports Analytics</span>
                <span className="text-brand-green font-bold">LIVE</span>
              </div>
            </motion.div>

            {/* Headline — large, modern, no uppercase */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display mb-6 leading-[1.05]"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              <span className="text-white">The AI That </span>
              <span className="text-emerald-gradient">Wins</span>
              <br />
              <span className="text-white">Your Bets</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-10 max-w-2xl mx-auto text-lg leading-relaxed"
              style={{ color: "rgba(255, 255, 255, 0.55)" }}
            >
              Real-time odds from 10+ sportsbooks. AI picks with confidence scores. +EV finder, steam move detector, CLV tracker — features no other platform offers.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              {isAuthenticated ? (
                <Link href="/picks">
                  <button className="btn-premium">
                    View Today's Picks <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <button
                  className="btn-premium"
                  onClick={() => (window.location.href = "/signup")}
                >
                  Start Winning Today <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link href="/pricing">
                <button className="btn-outline-premium">
                  View Plans
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm mb-16"
              style={{ color: "rgba(255, 255, 255, 0.35)" }}
            >
              Starting at $4.99/day · Cancel anytime · No credit card for free tools
            </motion.p>

            {/* Stats bar — floating glass cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {statsBar.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <NeonCard variant="default" className="p-5 text-center">
                    <div
                      className="font-display text-3xl lg:text-4xl mb-1"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-white/80">{stat.label}</div>
                    <div className="text-xs mt-0.5 text-white/40">{stat.sub}</div>
                  </NeonCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE CHART ────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-white/60">Verified Track Record</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl mb-5 leading-tight">
                <span className="text-emerald-gradient">73.1% Win Rate</span>
                <br />
                <span className="text-white">Over 12 Months</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8 max-w-lg">
                Every pick is logged, tracked, and verified. Our AI model has maintained a 73.1% win rate and +18.4% ROI over the past year across all major sports leagues.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sportStats.map((s) => (
                  <NeonCard key={s.label} className="p-4">
                    <div className="text-xs text-brand-gold font-semibold mb-1">{s.label}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{s.winRate}</span>
                      <span className="text-xs font-bold text-brand-green">{s.roi}</span>
                    </div>
                    <div className="text-xs mt-0.5 text-white/35">{s.games} games</div>
                  </NeonCard>
                ))}
              </div>
            </FadeIn>

            <FadeIn direction="right">
            <NeonCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/50">Monthly ROI Performance</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card-static text-xs font-semibold">
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span className="text-brand-green">LIVE</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#39ff14" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,10,15,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", backdropFilter: "blur(10px)" }}
                    labelStyle={{ color: "#f0b800" }}
                    formatter={(v: number) => [`${v}%`, "ROI"]}
                  />
                  <Area type="monotone" dataKey="roi" stroke="#39ff14" strokeWidth={2} fill="url(#roiGrad)" dot={{ fill: "#39ff14", strokeWidth: 0, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </NeonCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── TODAY'S PICKS PREVIEW ────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full glass-card-static text-xs font-semibold">
                <span className="live-dot" style={{ background: "#f0b800" }} />
                <span className="text-white/60">Updated daily at 6AM UTC</span>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl text-white">
                Today's <span className="text-emerald-gradient">Top Picks</span>
              </h2>
            </div>
            <Link href="/picks">
              <button className="hidden sm:flex btn-outline-premium text-sm py-2 px-4">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {picksData?.picks?.slice(0, 3).map((pick) => (
              <Link key={pick.id} href={`/picks/${pick.id}`}>
                <NeonCard className="p-6 cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-full"
                      style={{
                        background: pick.tier === "premium" ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${pick.tier === "premium" ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.1)"}`,
                        color: pick.tier === "premium" ? "#39ff14" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {pick.tier === "premium" ? "⚡ PREMIUM" : "FREE"}
                    </div>
                    <span className="text-xs font-semibold text-brand-gold">
                      {pick.sportKey?.toUpperCase()}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs mb-1.5 text-white/40">
                      {pick.awayTeam} @ {pick.homeTeam}
                    </div>
                    <div className="font-display text-lg text-white mb-1">
                      {pick.recommendation}
                    </div>
                    <div className="text-sm text-white/50">
                      {pick.odds && pick.odds > 0 ? `+${pick.odds}` : pick.odds}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Confidence</span>
                      <span className="font-bold text-brand-green">{pick.confidenceScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pick.confidenceScore}%`,
                          background: "linear-gradient(90deg, #39ff14, #00e676)",
                          boxShadow: "0 0 8px rgba(57,255,20,0.4)",
                        }}
                      />
                    </div>
                  </div>
                  {pick.tier === "premium" && !isAuthenticated && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-white/35">
                      <Lock className="w-3 h-3" /> Subscribe to unlock full analysis
                    </div>
                  )}
                </NeonCard>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/picks">
              <button className="btn-premium">
                View All Picks <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES — Bento Grid Style ─────────────────────── */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-mesh pointer-events-none opacity-50" />
        <div className="container relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-white/60">Premium Tools</span>
            </div>
            <h2 className="font-display text-3xl lg:text-5xl mb-4 text-white">
              Features No Other Platform{" "}
              <span className="text-emerald-gradient">Offers</span>
            </h2>
            <p className="text-white/45 max-w-xl mx-auto text-lg">
              Built by professional bettors and data scientists. Every tool is designed to give you a measurable, mathematical edge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <NeonCard className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 flex items-center justify-center rounded-xl"
                      style={{
                        background: `${f.color}0a`,
                        border: `1px solid ${f.color}20`,
                      }}
                    >
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div
                      className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full"
                      style={{
                        background: `${f.color}0a`,
                        border: `1px solid ${f.color}20`,
                        color: f.color,
                      }}
                    >
                      {f.badge}
                    </div>
                  </div>
                  <h3 className="font-display text-lg mb-2 text-white">{f.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
              <Star className="w-3.5 h-3.5 text-brand-gold" />
              <span className="text-white/60">Verified Member Results</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl text-white">
              What Our Members <span className="text-gold-gradient">Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <NeonCard className="p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="w-4 h-4" style={{ fill: "#f0b800", color: "#f0b800" }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-card-static text-xs font-bold text-brand-green">
                      <Flame className="w-3 h-3" /> {t.streak}
                    </div>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-xs text-white/35">{t.role}</div>
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>

          {/* Live user count */}
          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card-static">
              <span className="live-dot" />
              <span className="text-sm text-white/60">
                <strong className="text-brand-green">247</strong> members online now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute animate-orb"
            style={{
              bottom: "-30%", left: "30%",
              width: "60vw", height: "60vw",
              background: "radial-gradient(ellipse, rgba(57, 255, 20, 0.06) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="font-display text-4xl lg:text-6xl mb-6 text-white leading-tight">
            Ready to Bet{" "}
            <span className="text-emerald-gradient">Smarter?</span>
          </h2>
          <p className="text-white/45 text-lg mb-10 max-w-lg mx-auto">
            Join 12,847+ members who use ChalkPicks to gain a real, mathematical edge over the sportsbooks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {isAuthenticated ? (
              <Link href="/pricing">
                <button className="btn-premium text-base px-8 py-4">
                  Upgrade to Pro <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <button
                className="btn-premium text-base px-8 py-4"
                onClick={() => (window.location.href = "/signup")}
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <Link href="/pricing">
              <button className="btn-outline-premium">
                View Plans
              </button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/35">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Secure Stripe checkout
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Verified results
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-dark-v2-Ey5FDp5iZKArkMRM3n8FwX.webp"
                alt="ChalkPicks"
                className="h-10 w-auto mb-4"
                style={{ filter: "drop-shadow(0 0 8px rgba(57,255,20,0.3))" }}
              />
              <p className="text-sm text-white/40 leading-relaxed">
                AI-powered sports betting analytics. Beat the books with data-driven picks and mathematical edge.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">Platform</h4>
              <div className="space-y-2.5">
                <Link href="/picks" className="block text-sm text-white/40 hover:text-white/70 transition-colors">AI Picks</Link>
                <Link href="/stats" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Live Stats</Link>
                <Link href="/ev-finder" className="block text-sm text-white/40 hover:text-white/70 transition-colors">+EV Finder</Link>
                <Link href="/tools" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Tools</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">Community</h4>
              <div className="space-y-2.5">
                <Link href="/leaderboard" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Leaderboard</Link>
                <Link href="/pricing" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Pricing</Link>
                <a href="https://twitter.com/chalkpicks" target="_blank" rel="noopener" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Twitter/X</a>
                <a href="https://discord.gg/chalkpicks" target="_blank" rel="noopener" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Discord</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">Legal</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/40">Terms of Service</span>
                <span className="block text-sm text-white/40">Privacy Policy</span>
                <span className="block text-sm text-white/40">Responsible Gambling</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <div className="text-xs text-white/30">
              © 2026 ChalkPicks Pro. All rights reserved. Bet responsibly.
            </div>
            <div className="text-xs text-white/25">
              Sports betting involves risk. Past performance is not indicative of future results.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
