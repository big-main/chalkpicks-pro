import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  BarChart3,
  Trophy,
  Brain,
  ArrowRight,
  CheckCircle2,
  Star,
  Target,
  TrendingUp,
  Percent,
  Calculator,
  CloudLightning,
  Layers,
  Eye,
  Flame,
  Activity,
  Shield,
  Sparkles,
  Users,
  MessageCircle,
} from "lucide-react";
import NeonCard from "@/components/NeonCard";
import { HeroBackground } from "@/components/HeroBackground";
import { FadeIn } from "@/components/animations";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

// Lazy-load Recharts to reduce TBT on initial page load
const LazyRechartsChart = lazy(() => import("@/components/LazyRechartsChart"));
import HorizontalScrollTicker from "@/components/HorizontalScrollTicker";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = Date.now();
          const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function LiveDashboardPreview() {
  const { data: picksData } = trpc.picks.list.useQuery({
    limit: 1,
    tier: "all",
  });
  const pick = picksData?.picks?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="relative max-w-md mx-auto"
    >
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(57, 255, 20, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          transform: "scale(1.2)",
        }}
      />

      <div
        className="relative glass-card p-6 rounded-2xl border border-white/10"
        style={{
          background: "rgba(10, 10, 20, 0.85)",
          boxShadow:
            "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(57, 255, 20, 0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              AI Pick Engine
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#39ff14]/10 text-[#39ff14] font-bold">
            LIVE
          </span>
        </div>

        <div className="mb-5">
          <div className="text-lg font-bold text-white mb-1">
            {pick
              ? `${pick.awayTeam || "Away"} vs ${pick.homeTeam || "Home"}`
              : "Yankees vs Red Sox"}
          </div>
          <div className="text-sm text-white/40">
            {pick?.sportKey || "MLB"} · {pick?.pickType || "Moneyline"} ·{" "}
            {pick?.recommendation || "Yankees ML"}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-[#39ff14]">
              {pick?.confidenceScore || 92}%
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#f0b800]">
              +{pick?.edgeScore ? Number(pick.edgeScore).toFixed(1) : "7.3"}%
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">+EV Edge</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#60a5fa]">2.1%</div>
            <div className="text-[10px] text-white/35 mt-0.5">Kelly Bet</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#06b6d4]">14.2%</div>
            <div className="text-[10px] text-white/35 mt-0.5">Exp. ROI</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="text-xs text-white/50">Steam Detected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#39ff14] font-semibold">
              Strong Buy
            </span>
            <ArrowRight className="w-3 h-3 text-[#39ff14]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: Brain,
    title: "AI Pick Engine",
    desc: "Neural network analyzes thousands of data points — player stats, matchup history, weather, injuries — generating picks with confidence scores.",
    color: "#39ff14",
  },
  {
    icon: Percent,
    title: "+EV Finder",
    desc: "Scan real-time odds from 10+ sportsbooks to surface positive expected value bets. Only bet when the math is on your side.",
    color: "#f0b800",
  },
  {
    icon: TrendingUp,
    title: "Steam Move Detector",
    desc: "Detect sudden sharp money line movements the moment they happen. Follow the sharps, not the public.",
    color: "#60a5fa",
  },
  {
    icon: Eye,
    title: "Public Betting %",
    desc: "See where the public money is going on every game. Fade the public or follow the sharp money.",
    color: "#06b6d4",
  },
  {
    icon: Calculator,
    title: "Kelly Criterion Tool",
    desc: "Mathematically optimal bet sizing based on your edge and bankroll. Never over-bet or under-bet again.",
    color: "#39ff14",
  },
  {
    icon: CloudLightning,
    title: "Weather Impact Model",
    desc: "Real weather data integrated into NFL and MLB picks. Wind speed, temperature, and precipitation affect outcomes.",
    color: "#f0b800",
  },
  {
    icon: Layers,
    title: "Parlay Optimizer",
    desc: "AI-powered correlated parlay builder. Finds leg combinations that are statistically linked for higher combined win probability.",
    color: "#60a5fa",
  },
  {
    icon: BarChart3,
    title: "Advanced Backtesting",
    desc: "Test any strategy against years of historical data. Filter by sport, confidence, bet type, and date range.",
    color: "#a855f7",
  },
  {
    icon: Target,
    title: "CLV Tracker",
    desc: "Track your closing line value on every bet. CLV is the #1 predictor of long-term profitability.",
    color: "#06b6d4",
  },
];

const sportStats = [
  { label: "NFL", note: "Spreads, totals & props" },
  { label: "NBA", note: "Nightly slate coverage" },
  { label: "MLB", note: "Moneylines, runlines & props" },
  { label: "NHL", note: "Puck lines & totals" },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );
  const hasFullAccess =
    user?.role === "admin" ||
    (subscription?.isActive && subscription?.tier !== "free");
  const { data: siteStats } = trpc.system.siteStats.useQuery(undefined, {
    staleTime: 60_000,
  });
  const [emailCapture, setEmailCapture] = useState("");
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmailSubscribed(true);
      toast.success("You're in! Free daily picks coming to your inbox.");
    },
    onError: () => toast.error("Something went wrong. Try again."),
  });
  const handleEmailCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCapture || !emailCapture.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }
    newsletterMutation.mutate({ email: emailCapture, source: "home" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Navbar />

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
        {/* Background effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 900px 700px at 50% 20%, rgba(57, 255, 20, 0.07) 0%, rgba(57, 255, 20, 0.02) 40%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute animate-orb"
            style={{
              top: "-20%",
              left: "10%",
              width: "60vw",
              height: "60vw",
              background:
                "radial-gradient(ellipse, rgba(57, 255, 20, 0.06) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute animate-orb"
            style={{
              bottom: "-30%",
              right: "-10%",
              width: "50vw",
              height: "50vw",
              background:
                "radial-gradient(ellipse, rgba(59, 130, 246, 0.05) 0%, transparent 60%)",
              filter: "blur(80px)",
              animationDelay: "-7s",
            }}
          />
        </div>
        <div className="hidden md:block">
          <HeroBackground />
        </div>
        <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column — headline + CTA */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-static text-xs font-semibold tracking-wide">
                  <span className="live-dot" />
                  <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    AI-Powered Sports Analytics Platform
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display mb-6 leading-[1.05]"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}
              >
                <span className="text-emerald-gradient">
                  AI Sports Betting Picks
                </span>
                <br />
                <span className="text-white">with </span>
                <span className="text-cyan-400">Quantitative Edge</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8 max-w-lg text-lg leading-relaxed mx-auto lg:mx-0"
                style={{ color: "rgba(255, 255, 255, 0.55)" }}
              >
                Real-time +EV detection, Monte Carlo backtesting, steam move
                tracking, Kelly Criterion sizing, and institutional-grade
                predictive modeling — all in one platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-8"
              >
                {isAuthenticated ? (
                  <Link href="/picks">
                    <button className="btn-premium text-base px-8 py-4">
                      View Today's Picks <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <button
                    className="btn-premium text-base px-8 py-4"
                    onClick={() => (window.location.href = "/signup")}
                  >
                    Start Winning Today <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <a
                  href="https://discord.gg/rUrkBW9N"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn-outline-premium text-base px-6 py-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Join Discord
                  </button>
                </a>
                <Link href="/methodology">
                  <button className="btn-outline-premium text-base px-6 py-4">
                    How It Works
                  </button>
                </Link>
              </motion.div>

              {/* Social proof badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
              >
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Users className="w-3.5 h-3.5 text-[#39ff14]" />
                  <span className="font-semibold text-white/70">
                    {siteStats
                      ? `${(siteStats.totalMembers / 1000).toFixed(1)}K+`
                      : "12.8K+"}
                  </span>
                  <span>members</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Star className="w-3.5 h-3.5 text-[#f0b800]" />
                  <span className="font-semibold text-white/70">4.9</span>
                  <span>rating</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Brain className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span className="font-semibold text-white/70">
                    {siteStats
                      ? `${Math.round(siteStats.totalPicksGenerated / 1000)}K+`
                      : "847K+"}
                  </span>
                  <span>picks</span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs mt-4"
                style={{ color: "rgba(255, 255, 255, 0.3)" }}
              >
                Free tools available · Pro from $9.99/mo · Cancel anytime
              </motion.p>
            </div>

            {/* Right column — Live dashboard preview */}
            <div className="hidden lg:block">
              <LiveDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE TICKER ─── */}
      <div className="border-y border-white/5">
        <HorizontalScrollTicker />
      </div>

      {/* ─── STATS BAR ─── */}
      <section className="py-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(57,255,20,0.02)] to-transparent" />
        <div className="container relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#39ff14] mb-1">
                <AnimatedCounter value={siteStats?.picksToday ?? 8} />
              </div>
              <div className="text-sm text-white/50">Today's AI Picks</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#f0b800] mb-1">
                <AnimatedCounter
                  value={
                    siteStats ? Math.round(siteStats.totalMembers / 1000) : 12
                  }
                  suffix="K+"
                />
              </div>
              <div className="text-sm text-white/50">Active Members</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#60a5fa] mb-1">
                <AnimatedCounter
                  value={siteStats ? Math.round(siteStats.winRate) : 71}
                  suffix="%"
                />
              </div>
              <div className="text-sm text-white/50">AI Win Rate</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#06b6d4] mb-1">
                <AnimatedCounter
                  value={
                    siteStats
                      ? Math.round(siteStats.totalPicksGenerated / 1000)
                      : 847
                  }
                  suffix="K+"
                />
              </div>
              <div className="text-sm text-white/50">Picks Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRANSPARENT RESULTS ─── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-white/60">Verified Track Record</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl mb-5 leading-tight">
                <span className="text-emerald-gradient">Transparent</span>
                <span className="text-white"> Results</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8 max-w-lg">
                Every pick is logged, timestamped, and graded automatically. No
                cherry-picking, no hindsight edits. Review the full history
                yourself on our Performance page.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sportStats.map(s => (
                  <NeonCard key={s.label} className="p-4">
                    <div className="text-sm text-brand-gold font-bold mb-1">
                      {s.label}
                    </div>
                    <div className="text-xs text-white/50">{s.note}</div>
                    <div className="text-xs mt-1.5 text-brand-green font-semibold">
                      Auto-graded
                    </div>
                  </NeonCard>
                ))}
              </div>
              <Link
                href="/performance"
                className="inline-flex items-center gap-2 mt-6 text-sm text-[#39ff14] hover:text-[#39ff14]/80 transition-colors font-medium"
              >
                View Full Performance <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>

            <FadeIn direction="right">
              <NeonCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/50">
                    Model ROI — 6 Month
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card-static text-xs font-semibold text-[#39ff14]">
                    <Activity className="w-3 h-3" /> +23.1%
                  </div>
                </div>
                <Suspense
                  fallback={
                    <div className="w-full h-[240px] animate-pulse rounded-lg bg-white/5" />
                  }
                >
                  <LazyRechartsChart />
                </Suspense>
              </NeonCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-24 relative">
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-white/60">Professional-Grade Tools</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
              Everything You Need to{" "}
              <span className="text-emerald-gradient">Win</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg">
              The same tools used by professional bettors and sharp syndicates —
              now available to everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <NeonCard className="p-6 h-full card-hover">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${f.color}10`,
                        border: `1px solid ${f.color}20`,
                      }}
                    >
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-sm text-white/45 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/tools">
              <button className="btn-outline-premium">
                Explore All Tools <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 relative border-t border-white/5">
        <div className="absolute inset-0 bg-mesh pointer-events-none opacity-50" />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
              How It <span className="text-gold-gradient">Works</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              From data to dollars in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "AI Analyzes",
                desc: "Our model processes 50,000+ data points per game — odds, injuries, weather, sharp money, historical matchups.",
                color: "#39ff14",
              },
              {
                step: "02",
                title: "You Get Picks",
                desc: "Receive AI-generated picks with confidence scores, +EV edge, and optimal bet sizing via Kelly Criterion.",
                color: "#f0b800",
              },
              {
                step: "03",
                title: "Track & Win",
                desc: "Every pick is auto-graded against closing lines. Track your CLV, ROI, and bankroll growth in real-time.",
                color: "#60a5fa",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center font-display text-2xl"
                  style={{
                    background: `${item.color}08`,
                    border: `1px solid ${item.color}20`,
                    color: item.color,
                  }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST / NEWSLETTER ─── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-white/60">Trusted by Thousands</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl text-white">
              Less Hype, More{" "}
              <span className="text-emerald-gradient">Proof</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              {
                value: siteStats
                  ? `${(siteStats.totalMembers / 1000).toFixed(1)}K+`
                  : "12.8K+",
                label: "Active Members",
                icon: Users,
                color: "#39ff14",
              },
              {
                value: siteStats
                  ? `${Math.round(siteStats.totalPicksGenerated / 1000)}K+`
                  : "847K+",
                label: "Picks Generated",
                icon: Brain,
                color: "#f0b800",
              },
              {
                value: "4.9/5",
                label: "Member Rating",
                icon: Star,
                color: "#60a5fa",
              },
              {
                value: "24/7",
                label: "AI Monitoring",
                icon: Activity,
                color: "#06b6d4",
              },
            ].map(stat => (
              <NeonCard key={stat.label} className="p-5 text-center">
                <stat.icon
                  className="w-5 h-5 mx-auto mb-3"
                  style={{ color: stat.color }}
                />
                <div className="font-display text-2xl text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </NeonCard>
            ))}
          </div>

          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card-static">
              <span className="live-dot" />
              <span className="text-sm text-white/60">
                <strong className="text-brand-green">
                  {siteStats?.paidSubscribers ?? 247}
                </strong>{" "}
                paid subscribers active
              </span>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 border border-[rgba(57,255,20,0.2)] bg-gradient-to-br from-[rgba(57,255,20,0.06)] to-transparent shadow-[0_0_40px_rgba(57,255,20,0.05)]">
                <p className="text-base font-bold text-white mb-1">
                  Get Today's Free AI Pick
                </p>
                <p className="text-sm text-white/40 mb-4">
                  Delivered every morning — free forever, no credit card needed
                </p>
                {emailSubscribed ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.25)]">
                    <CheckCircle2 className="w-4 h-4 text-[#39ff14]" />
                    <span className="text-sm font-medium text-[#39ff14]">
                      You're in! Daily free pick coming to your inbox.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleEmailCapture} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={emailCapture}
                      onChange={e => setEmailCapture(e.target.value)}
                      aria-label="Email address for free daily pick"
                      autoComplete="email"
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#39ff14]/50 h-11"
                    />
                    <button
                      type="submit"
                      disabled={newsletterMutation.isPending}
                      className="btn-premium px-6 py-2.5 text-sm font-semibold whitespace-nowrap h-11"
                    >
                      {newsletterMutation.isPending
                        ? "Sending..."
                        : "Get Free Pick"}
                    </button>
                  </form>
                )}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="text-xs text-white/50">✓ Free forever</span>
                  <span className="text-xs text-white/50">✓ No spam</span>
                  <span className="text-xs text-white/50">
                    ✓ Unsubscribe anytime
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute animate-orb"
            style={{
              bottom: "-30%",
              left: "30%",
              width: "60vw",
              height: "60vw",
              background:
                "radial-gradient(ellipse, rgba(57, 255, 20, 0.06) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="font-display text-4xl lg:text-6xl mb-6 text-white leading-tight">
            Ready to Bet <span className="text-emerald-gradient">Smarter?</span>
          </h2>
          <p className="text-white/45 text-lg mb-10 max-w-lg mx-auto">
            Join thousands of members who use ChalkPicks to gain a real,
            mathematical edge over the sportsbooks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {hasFullAccess ? (
              <Link href="/dashboard">
                <button className="btn-premium text-base px-8 py-4">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : isAuthenticated ? (
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
          </div>
          <div className="mt-12 mb-8">
            <NewsletterSignup />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/35">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Secure
              Stripe checkout
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Cancel
              anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" /> Verified
              results
            </span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-16">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-8 border-b border-white/5">
            <p className="text-sm text-white/50">
              Follow us for daily picks & alerts
            </p>
            <div className="flex items-center gap-3">
              {[
                { href: "https://facebook.com/chalkpicks", label: "Facebook" },
                { href: "https://x.com/chalkpickspro", label: "X" },
                {
                  href: "https://instagram.com/chalkpicks",
                  label: "Instagram",
                },
                { href: "https://youtube.com/@chalkpicks", label: "YouTube" },
                { href: "https://reddit.com/r/chalkpicks", label: "Reddit" },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white/40 hover:text-lime-400 hover:bg-lime-400/10 transition-all duration-200 text-xs font-medium"
                >
                  {label[0]}
                </a>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <p className="text-sm font-bold text-white mb-3">ChalkPicks</p>
              <p className="text-sm text-white/40 leading-relaxed">
                Institutional-grade sports analysis and predictive modeling.
                Gain a mathematical edge with AI-driven player projections and
                market analysis.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">
                Platform
              </h4>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/picks"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  AI Picks
                </Link>
                <Link
                  href="/ev-finder"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  +EV Finder
                </Link>
                <Link
                  href="/tools"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Tools
                </Link>
                <Link
                  href="/performance"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Performance
                </Link>
                <Link
                  href="/blog"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Blog
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">
                Community
              </h4>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/leaderboard"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Pricing
                </Link>
                <a
                  href="https://discord.gg/chalkpicks"
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Discord
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">
                Legal
              </h4>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/terms"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/responsible-gambling"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  Responsible Gambling
                </Link>
                <Link
                  href="/profile"
                  className="text-sm text-white/40 hover:text-lime-400 transition-colors"
                >
                  My Profile
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <div className="text-xs text-white/45">
              © 2026 ChalkPicks Pro. All rights reserved. Analyze responsibly.
            </div>
            <div className="text-xs text-white/45">
              Predictive sports analysis involves variance. Past performance
              does not guarantee future results.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
