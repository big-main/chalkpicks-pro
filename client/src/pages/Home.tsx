import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Zap, BarChart3, Trophy, Brain,
  ArrowRight, CheckCircle2, Star, Target, Lock,
  TrendingUp, Percent,
  Calculator, CloudLightning, Layers, Eye, Flame,
  Activity, Shield, Sparkles, Users
} from "lucide-react";
import NeonCard from "@/components/NeonCard";
import { HeroBackground } from "@/components/HeroBackground";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/animations";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { LiveResultsTicker } from "@/components/LiveResultsTicker";

// ─── Animated Counter Component ───────────────────────────────────
function AnimatedCounter({ value, prefix = "", suffix = "", duration = 2 }: {
  value: number; prefix?: string; suffix?: string; duration?: number;
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

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Live Dashboard Preview Widget ────────────────────────────────
function LiveDashboardPreview() {
  const { data: picksData } = trpc.picks.list.useQuery({ limit: 1, tier: "all" });
  const pick = picksData?.picks?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="relative max-w-md mx-auto"
    >
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-2xl" style={{
        background: "radial-gradient(ellipse at center, rgba(57, 255, 20, 0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
        transform: "scale(1.2)",
      }} />

      <div className="relative glass-card p-6 rounded-2xl border border-white/10" style={{
        background: "rgba(10, 10, 20, 0.85)",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(57, 255, 20, 0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">AI Pick Engine</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#39ff14]/10 text-[#39ff14] font-bold">LIVE</span>
        </div>

        {/* Pick content */}
        <div className="mb-5">
          <div className="text-lg font-bold text-white mb-1">
            {pick ? `${pick.awayTeam || "Away"} vs ${pick.homeTeam || "Home"}` : "Yankees vs Red Sox"}
          </div>
          <div className="text-sm text-white/40">
            {pick?.sportKey || "MLB"} · {pick?.pickType || "Moneyline"} · {pick?.recommendation || "Yankees ML"}
          </div>
        </div>

        {/* Metrics grid */}
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
            <div className="text-xl font-bold text-[#60a5fa]">
              2.1%
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">Kelly Bet</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#06b6d4]">
              14.2%
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">Exp. ROI</div>
          </div>
        </div>

        {/* Steam indicator */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="text-xs text-white/50">Steam Detected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#39ff14] font-semibold">Strong Buy</span>
            <ArrowRight className="w-3 h-3 text-[#39ff14]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Performance Chart Data ───────────────────────────────────────
const performanceData = [
  { month: "Oct", roi: 12.1 },
  { month: "Nov", roi: 15.3 },
  { month: "Dec", roi: 19.7 },
  { month: "Jan", roi: 18.4 },
  { month: "Feb", roi: 21.3 },
  { month: "Mar", roi: 23.1 },
];

// ─── Features (no badges — let content speak) ────────────────────
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

// ─── Sport coverage ──────────────────────────────────────────────
const sportStats = [
  { label: "NFL", note: "Spreads, totals & props" },
  { label: "NBA", note: "Nightly slate coverage" },
  { label: "MLB", note: "Moneylines, runlines & props" },
  { label: "NHL", note: "Puck lines & totals" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
            <Navbar />
      <LiveResultsTicker />

      {/* ── LOGO HERO (borderless, bleeds into page) ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative flex flex-col items-center justify-center overflow-visible select-none"
        style={{ marginTop: "60px", zIndex: 0 }}
      >
        {/* Radial mask: logo fades into black on all sides */}
        <div
          style={{
            position: "relative",
            width: "min(880px, 95vw)",
            aspectRatio: "1 / 1",
          }}
          aria-hidden="true"
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png"
            alt="ChalkPicks"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              WebkitMaskImage: "radial-gradient(ellipse 72% 67% at 50% 48%, black 28%, transparent 78%)",
              maskImage: "radial-gradient(ellipse 72% 67% at 50% 48%, black 28%, transparent 78%)",
              opacity: 0.94,
            }}
          />
          {/* Extra bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "38%",
              background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
            }}
          />
        </div>

        {/* ── SOCIAL MEDIA LINKS ── */}
        <div
          className="flex items-center gap-5 pointer-events-auto"
          style={{ marginTop: "-48px", zIndex: 10, position: "relative" }}
        >
          {[
            { href: "https://facebook.com/chalkpicks", label: "Facebook", icon: (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            )},
            { href: "https://x.com/chalkpickspro", label: "X (Twitter)", icon: (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            )},
            { href: "https://instagram.com/chalkpicks", label: "Instagram", icon: (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            )},
            { href: "https://youtube.com/@chalkpicks", label: "YouTube", icon: (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            )},
            { href: "https://reddit.com/r/chalkpicks", label: "Reddit", icon: (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            )},
          ].map(({ href, label, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(132,204,22,0.15)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(132,204,22,0.5)";
                (e.currentTarget as HTMLElement).style.color = "#84cc16";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {icon}
            </a>
          ))}
        </div>
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-0 pb-20 lg:pt-0 lg:pb-28 overflow-hidden" style={{ marginTop: "-120px" }}>
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

        <HeroBackground />
        <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
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
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display mb-6 leading-[1.05]"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
              >
                <span className="text-emerald-gradient">AI-Powered Picks.</span>
                <br />
                <span className="text-white">Quantitative Edge. </span>
                <span className="text-cyan-400">Data-Backed Results.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-10 max-w-lg text-lg leading-relaxed"
                style={{ color: "rgba(255, 255, 255, 0.55)" }}
              >
                Real-time +EV detection, predictive modeling, steam tracking, bankroll optimization, and institutional-grade sports analytics in one platform.
              </motion.p>

              {/* Single dominant CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6"
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
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm"
                style={{ color: "rgba(255, 255, 255, 0.35)" }}
              >
                Free tools available · Pro from $9.99/mo · Cancel anytime
              </motion.p>
            </div>

            {/* Right: Live Dashboard Preview */}
            <div className="hidden lg:block">
              <LiveDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS BAR ────────────────────────────────────── */}
      <section className="py-6 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(57,255,20,0.02)] to-transparent" />
        <div className="container relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#39ff14] mb-1">
                <AnimatedCounter value={126} />
              </div>
              <div className="text-sm text-white/50">Today's Bets Analyzed</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#f0b800] mb-1">
                <AnimatedCounter value={417} prefix="$" suffix="K" />
              </div>
              <div className="text-sm text-white/50">+EV Found Today</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#60a5fa] mb-1">
                +<AnimatedCounter value={18} suffix=".4%" />
              </div>
              <div className="text-sm text-white/50">Units Won (30d)</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl lg:text-4xl text-[#06b6d4] mb-1">
                +<AnimatedCounter value={5} suffix=".2%" />
              </div>
              <div className="text-sm text-white/50">Avg Closing Line Value</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE CHART ────────────────────────────────── */}
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
                Every pick is logged, timestamped, and graded automatically. No cherry-picking, no hindsight edits. Review the full history yourself on our Performance page.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sportStats.map((s) => (
                  <NeonCard key={s.label} className="p-4">
                    <div className="text-sm text-brand-gold font-bold mb-1">{s.label}</div>
                    <div className="text-xs text-white/50">{s.note}</div>
                    <div className="text-xs mt-1.5 text-brand-green font-semibold">Auto-graded</div>
                  </NeonCard>
                ))}
              </div>
              <Link href="/performance" className="inline-flex items-center gap-2 mt-6 text-sm text-[#39ff14] hover:text-[#39ff14]/80 transition-colors font-medium">
                View Full Performance <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>

            <FadeIn direction="right">
              <NeonCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/50">Model ROI — 6 Month</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card-static text-xs font-semibold text-[#39ff14]">
                    <Activity className="w-3 h-3" /> +23.1%
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39ff14" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                      itemStyle={{ color: "#39ff14" }}
                    />
                    <Area type="monotone" dataKey="roi" stroke="#39ff14" strokeWidth={2.5} fill="url(#roiGradient)" dot={{ fill: "#39ff14", r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </NeonCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
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
              The same tools used by professional bettors and sharp syndicates — now available to everyone.
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
                      style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}
                    >
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                      <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
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

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
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
              { step: "01", title: "AI Analyzes", desc: "Our model processes 50,000+ data points per game — odds, injuries, weather, sharp money, historical matchups.", color: "#39ff14" },
              { step: "02", title: "You Get Picks", desc: "Receive AI-generated picks with confidence scores, +EV edge, and optimal bet sizing via Kelly Criterion.", color: "#f0b800" },
              { step: "03", title: "Track & Win", desc: "Every pick is auto-graded against closing lines. Track your CLV, ROI, and bankroll growth in real-time.", color: "#60a5fa" },
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
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}20`, color: item.color }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF — Live Stats ────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-white/60">Trusted by Thousands</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl text-white">
              Less Hype, More <span className="text-emerald-gradient">Proof</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { value: "12,847", label: "Active Members", icon: Users, color: "#39ff14" },
              { value: "847K+", label: "Picks Generated", icon: Brain, color: "#f0b800" },
              { value: "4.9/5", label: "Member Rating", icon: Star, color: "#60a5fa" },
              { value: "24/7", label: "AI Monitoring", icon: Activity, color: "#06b6d4" },
            ].map((stat) => (
              <NeonCard key={stat.label} className="p-5 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-3" style={{ color: stat.color }} />
                <div className="font-display text-2xl text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </NeonCard>
            ))}
          </div>

          {/* Live user count */}
          <div className="text-center">
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
            Join thousands of members who use ChalkPicks to gain a real, mathematical edge over the sportsbooks.
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
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png"
                alt="ChalkPicks"
                className="h-14 w-auto mb-4"
                style={{ filter: "drop-shadow(0 0 14px rgba(245, 158, 11, 0.5)) drop-shadow(0 0 6px rgba(239, 68, 68, 0.3))" }}
              />
              <p className="text-sm text-white/40 leading-relaxed">
                Institutional-grade sports analysis and predictive modeling. Gain a mathematical edge with AI-driven player projections and market analysis.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">Platform</h4>
              <div className="space-y-2.5">
                <Link href="/picks" className="block text-sm text-white/40 hover:text-white/70 transition-colors">AI Picks</Link>
                <Link href="/ev-finder" className="block text-sm text-white/40 hover:text-white/70 transition-colors">+EV Finder</Link>
                <Link href="/tools" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Tools</Link>
                <Link href="/performance" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Performance</Link>
                <Link href="/blog" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Blog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white/70">Community</h4>
              <div className="space-y-2.5">
                <Link href="/leaderboard" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Leaderboard</Link>
                <Link href="/pricing" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Pricing</Link>
                <a href="https://discord.gg/chalkpicks" target="_blank" rel="noopener" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Discord</a>
              </div>
              {/* Social icons row */}
              <div className="flex items-center gap-3 mt-5">
                {[
                  { href: "https://facebook.com/chalkpicks", label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                  { href: "https://x.com/chalkpickspro", label: "X", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { href: "https://instagram.com/chalkpicks", label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                  { href: "https://youtube.com/@chalkpicks", label: "YouTube", d: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                  { href: "https://reddit.com/r/chalkpicks", label: "Reddit", d: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
                ].map(({ href, label, d }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white/35 hover:text-lime-400 hover:bg-lime-400/10 transition-all duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d={d} /></svg>
                  </a>
                ))}
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
              © 2026 ChalkPicks Pro. All rights reserved. Analyze responsibly.
            </div>
            <div className="text-xs text-white/25">
              Predictive sports analysis involves variance. Past performance does not guarantee future results.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
