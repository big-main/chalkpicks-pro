import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Zap, ChevronDown, Bell, Crown, Cpu, ArrowRight,
  BarChart3, Target, TrendingUp, Calculator, Layers, Eye,
  Trophy, Users, Settings, LogOut, Star, Percent,
  Activity, BookOpen, DollarSign, GitCompare, LineChart,
  Brain, Flame, Shield, Dices, Sigma, FlaskConical, Swords
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// Logo URLs
const LOGO_FULL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-navbar-EuWyWqzZKRjh6eatJJ5Sm9.webp";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-icon-a3mVBRaWZeuoNHa3gFxuBp.webp";

function LlmStatusBadge() {
  const { data } = trpc.system.llmStatus.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  if (!data) return null;
  const providerConfig: Record<string, { label: string; color: string; title: string }> = {
    qwen: { label: "Qwen", color: "#39ff14", title: "Qwen 2.5 7B (Local — Free)" },
    "gpt-4o-mini": { label: "GPT-4o", color: "#0ea5e9", title: "GPT-4o-mini (OpenRouter)" },
    gemini: { label: "Gemini", color: "#f0b800", title: "Gemini Flash (Forge)" },
  };
  const cfg = providerConfig[data.provider] ?? providerConfig.gemini;
  return (
    <div
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
      style={{
        background: `${cfg.color}08`,
        border: `1px solid ${cfg.color}20`,
        color: cfg.color,
      }}
      title={`AI Engine: ${cfg.title}`}
    >
      <Cpu className="w-3 h-3" />
      <span>{cfg.label}</span>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-green" style={{ background: cfg.color }} />
    </div>
  );
}

// Grouped nav structure for mega dropdown
const navGroups = [
  {
    label: "Analytics",
    color: "#39ff14",
    items: [
      { href: "/picks", label: "AI Picks", icon: Brain, desc: "Daily AI-generated picks with confidence scores" },
      { href: "/ev-finder", label: "+EV Finder", icon: Percent, desc: "Find positive expected value bets in real-time" },
      { href: "/performance", label: "Performance", icon: BarChart3, desc: "Verified track record & ROI stats" },
      { href: "/stats", label: "Live Stats", icon: Activity, desc: "Real-time game data & line movement" },
      { href: "/elo-ratings", label: "Elo Power Ratings", icon: Sigma, desc: "AI team power ratings & win probability" },
    ],
  },
  {
    label: "Tools",
    color: "#f0b800",
    items: [
      { href: "/arbitrage", label: "Arbitrage", icon: GitCompare, desc: "Guaranteed profit opportunities" },
      { href: "/parlay-builder", label: "Parlay Builder", icon: Layers, desc: "AI-optimized correlated parlays" },
      { href: "/parlay-flow", label: "Visual Parlay Flow", icon: Layers, desc: "Interactive node-based parlay diagram" },
      { href: "/clv-tracker", label: "CLV Tracker", icon: TrendingUp, desc: "Track closing line value on every bet" },
      { href: "/line-movement", label: "Line Movement", icon: LineChart, desc: "Detect sharp money movements" },
      { href: "/prop-builder", label: "Prop Builder", icon: Target, desc: "Build and analyze player props" },
      { href: "/correlation-finder", label: "Correlations", icon: Eye, desc: "Find correlated bet combinations" },
      { href: "/dfs-optimizer", label: "DFS Optimizer", icon: Dices, desc: "Optimal DraftKings & FanDuel lineups" },
      { href: "/monte-carlo", label: "Monte Carlo", icon: FlaskConical, desc: "Bankroll risk & growth simulation" },
      { href: "/sharp-money", label: "Sharp Money", icon: TrendingUp, desc: "Detect sharp money vs. public action" },
      { href: "/consensus", label: "Consensus", icon: Users, desc: "Public betting % vs CP AI recommendation" },
      { href: "/api-access", label: "API Access", icon: Brain, desc: "Integrate ChalkPicks data into your tools" },
    ],
  },
  {
    label: "Calculators",
    color: "#60a5fa",
    items: [
      { href: "/tools", label: "All Tools", icon: Calculator, desc: "Full suite of betting calculators" },
      { href: "/tools/odds-calculator", label: "Odds Calculator", icon: Calculator, desc: "Convert odds formats instantly" },
      { href: "/tools/roi-calculator", label: "ROI Calculator", icon: DollarSign, desc: "Calculate return on investment" },
      { href: "/tools/bankroll-manager", label: "Bankroll Manager", icon: Shield, desc: "Manage your betting bankroll" },
      { href: "/bet-calculator", label: "Bet Calculator", icon: Calculator, desc: "Kelly Criterion & bet sizing" },
      { href: "/tools/devig-calculator", label: "Devig Calculator", icon: Sigma, desc: "Remove vig & find true odds" },
    ],
  },
  {
    label: "Sport Picks",
    color: "#f97316",
    items: [
      { href: "/nfl-picks", label: "NFL Picks", icon: Swords, desc: "AI-powered NFL predictions today" },
      { href: "/nba-picks", label: "NBA Picks", icon: Swords, desc: "AI-powered NBA predictions today" },
      { href: "/mlb-picks", label: "MLB Picks", icon: Swords, desc: "AI-powered MLB predictions today" },
      { href: "/nhl-picks", label: "NHL Picks", icon: Swords, desc: "AI-powered NHL predictions today" },
      { href: "/ncaaf-picks", label: "NCAAF Picks", icon: Swords, desc: "College football AI picks" },
      { href: "/ncaab-picks", label: "NCAAB Picks", icon: Swords, desc: "College basketball AI picks" },
      { href: "/mma-picks", label: "MMA Picks", icon: Swords, desc: "UFC & MMA fight predictions" },
      { href: "/soccer-picks", label: "Soccer Picks", icon: Swords, desc: "EPL, MLS & soccer predictions" },
    ],
  },
  {
    label: "Community",
    color: "#a855f7",
    items: [
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy, desc: "Top performers this month" },
      { href: "/backtesting", label: "Backtesting", icon: BookOpen, desc: "Test strategies on historical data" },
      { href: "/kalshi", label: "Kalshi Markets", icon: Flame, desc: "Prediction market opportunities" },
      { href: "/sportsbooks", label: "Sportsbooks", icon: Star, desc: "Best books & sign-up bonuses" },
      { href: "/odds-comparison", label: "Odds Compare", icon: GitCompare, desc: "Compare lines across books" },
      { href: "/referral", label: "Referral", icon: Users, desc: "Earn rewards by referring friends" },
    ],
  },
];

const primaryLinks = [
  { href: "/picks", label: "Picks" },
  { href: "/performance", label: "Performance" },
  { href: "/ev-finder", label: "+EV Finder" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(6, 6, 12, 0.95)"
          : "rgba(6, 6, 12, 0.7)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: scrolled
          ? "1px solid rgba(255, 255, 255, 0.07)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 4px 40px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(57, 255, 20, 0.04)"
          : "none",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-[76px]">

          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-0 group flex-shrink-0">
            {/* Mobile: icon only */}
            <div className="md:hidden relative w-14 h-14 overflow-hidden flex items-center justify-center">
              <img
                src={LOGO_ICON}
                alt="ChalkPicks"
                className="w-[68px] h-[68px] object-contain transition-all duration-300 group-hover:scale-105"
                style={{
                  mixBlendMode: "screen",
                  filter: "brightness(1.1) drop-shadow(0 0 14px rgba(57, 255, 20, 0.5))",
                }}
              />
            </div>
            {/* Desktop: full logo */}
            <div className="hidden md:flex items-center relative overflow-hidden" style={{ width: 220, height: 76 }}>
              <img
                src={LOGO_FULL}
                alt="ChalkPicks"
                className="absolute transition-all duration-300 group-hover:scale-[1.04]"
                style={{
                  mixBlendMode: "screen",
                  filter: "brightness(1.15) drop-shadow(0 0 18px rgba(57, 255, 20, 0.45))",
                  width: "100%",
                  height: "auto",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  maxWidth: 260,
                }}
              />
            </div>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div className="hidden lg:flex items-center gap-0.5 mx-4">
            {primaryLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200"
                  style={{
                    color: isActive ? "#39ff14" : "rgba(255, 255, 255, 0.58)",
                    background: isActive ? "rgba(57, 255, 20, 0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.58)";
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                      style={{ background: "#39ff14", boxShadow: "0 0 8px rgba(57, 255, 20, 0.7)" }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Mega "Tools" dropdown trigger */}
            <div ref={megaRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200"
                style={{ color: megaOpen ? "#39ff14" : "rgba(255, 255, 255, 0.58)" }}
                onMouseEnter={() => setMegaOpen(true)}
                onClick={() => setMegaOpen(!megaOpen)}
              >
                Tools & More
                <motion.div animate={{ rotate: megaOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {megaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[980px] rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(8, 8, 16, 0.97)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(57, 255, 20, 0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
                      backdropFilter: "blur(24px)",
                    }}
                    onMouseLeave={() => setMegaOpen(false)}
                  >
                    {/* Top accent line */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[rgba(57,255,20,0.3)] to-transparent" />

                    <div className="p-5 grid grid-cols-5 gap-4">
                      {navGroups.map((group) => (
                        <div key={group.label}>
                          {/* Group header */}
                          <div
                            className="flex items-center gap-1.5 mb-3 pb-2"
                            style={{ borderBottom: `1px solid ${group.color}15` }}
                          >
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase"
                              style={{ color: group.color }}
                            >
                              {group.label}
                            </span>
                          </div>

                          {/* Group items */}
                          <div className="space-y-0.5">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = location === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMegaOpen(false)}
                                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 group/item"
                                  style={{
                                    background: isActive ? `${group.color}08` : "transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = `${group.color}08`;
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = isActive ? `${group.color}08` : "transparent";
                                  }}
                                >
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                      background: `${group.color}10`,
                                      border: `1px solid ${group.color}18`,
                                    }}
                                  >
                                    <Icon className="w-3.5 h-3.5" style={{ color: group.color }} />
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      className="text-[12.5px] font-semibold leading-tight"
                                      style={{ color: isActive ? group.color : "rgba(255,255,255,0.85)" }}
                                    >
                                      {item.label}
                                    </div>
                                    <div className="text-[11px] text-white/35 leading-tight mt-0.5 truncate">
                                      {item.desc}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom CTA bar */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{
                        background: "rgba(57, 255, 20, 0.03)",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span className="text-xs text-white/35">
                        🔥 New: AI Parlay Optimizer now live
                      </span>
                      <Link
                        href="/pricing"
                        onClick={() => setMegaOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-white transition-colors"
                      >
                        Unlock all tools <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LlmStatusBadge />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-9 h-9 hover:bg-white/5"
                    style={{ color: "rgba(255, 255, 255, 0.5)" }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifCount && notifCount.count > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold bg-brand-red text-white">
                        {notifCount.count > 9 ? "9+" : notifCount.count}
                      </span>
                    ) : null}
                  </Button>
                </Link>

                {/* User menu — custom premium dropdown */}
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5"
                  >
                    <Avatar className="w-8 h-8 ring-1 ring-white/10">
                      <AvatarFallback className="text-xs font-bold bg-brand-green/10 text-brand-green">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-24 truncate text-white/80">
                      {user?.name ?? "User"}
                    </span>
                    {isPremium && <Crown className="w-3.5 h-3.5 hidden sm:block text-brand-gold" />}
                    <motion.div animate={{ rotate: userMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
                        className="absolute top-full right-0 mt-2 w-64 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(8, 8, 16, 0.97)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
                          backdropFilter: "blur(24px)",
                        }}
                      >
                        {/* Top accent */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[rgba(57,255,20,0.3)] to-transparent" />

                        {/* User info header */}
                        <div className="px-4 py-4 flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-brand-green/20">
                            <AvatarFallback className="text-sm font-bold bg-brand-green/10 text-brand-green">
                              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-white/90">{user?.name ?? "User"}</p>
                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                            <Badge className="mt-1 text-[10px] capitalize badge-premium border-0 rounded-full">
                              {user?.subscriptionTier ?? "free"}
                            </Badge>
                          </div>
                        </div>

                        <div className="h-px bg-white/5 mx-3" />

                        {/* Menu items */}
                        <div className="p-2 space-y-0.5">
                          {[
                            { href: "/dashboard", label: "My Dashboard", icon: BarChart3 },
                            { href: "/subscription-dashboard", label: "Subscription", icon: Crown },
                            { href: "/credits", label: "Credits", icon: Zap, color: "#39ff14" },
                            { href: "/account-settings", label: "Account Settings", icon: Settings },
                            { href: "/tools", label: "Power Tools", icon: Calculator },
                            { href: "/pricing", label: "Upgrade Plan", icon: Star, color: "#f0b800" },
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm text-white/70 hover:text-white hover:bg-white/5"
                              >
                                <Icon className="w-4 h-4" style={{ color: item.color ?? "rgba(255,255,255,0.4)" }} />
                                {item.label}
                              </Link>
                            );
                          })}

                          {user?.role === "admin" && (
                            <>
                              <div className="h-px bg-white/5 my-1" />
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm text-brand-green hover:bg-brand-green/5"
                              >
                                <Shield className="w-4 h-4" />
                                Admin Panel
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="h-px bg-white/5 mx-3" />

                        <div className="p-2">
                          <button
                            onClick={() => { setUserMenuOpen(false); logout(); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all duration-150 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex rounded-full text-white/60 hover:text-white hover:bg-white/5 text-sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <button className="hidden sm:flex btn-premium text-sm py-2.5 px-5">
                    <Zap className="w-3.5 h-3.5" />
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full w-9 h-9 hover:bg-white/5"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

                {navGroups.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div
                      className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: group.color }}
                    >
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                            style={{
                              color: isActive ? group.color : "rgba(255, 255, 255, 0.65)",
                              background: isActive ? `${group.color}08` : "transparent",
                            }}
                          >
                            <Icon className="w-4 h-4 opacity-60" style={{ color: isActive ? group.color : undefined }} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!isAuthenticated && (
                  <div className="pt-3 mt-2 border-t border-white/5">
                    <button
                      className="w-full btn-premium justify-center"
                      onClick={() => { setMobileOpen(false); window.location.href = "/signup"; }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Get Started Free
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
