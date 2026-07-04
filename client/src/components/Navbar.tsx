import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, Zap, ChevronDown, Bell, Crown, Activity, Shield, Cpu } from "lucide-react";
import { trpc } from "@/lib/trpc";

function LiveScoresTicker() {
  const { data: games } = trpc.stats.allGames.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const liveGames = (games ?? []).filter((g: any) => g.status === 'in_progress' || g.status === 'live').slice(0, 5);
  if (!liveGames.length) return null;
  return (
    <div className="hidden lg:flex items-center gap-4 overflow-x-auto px-6 py-1.5 text-[11px] border-b border-white/[0.04]">
      <div className="flex items-center gap-1.5 flex-shrink-0 text-brand-green">
        <Activity className="w-3 h-3 animate-pulse" />
        <span className="font-bold tracking-[0.2em] text-[10px]" style={{ fontFamily: "'Exo 2', sans-serif" }}>LIVE</span>
      </div>
      {liveGames.map((g: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 flex-shrink-0 text-white/60">
          <span className="font-semibold text-white/90">{g.awayTeam}</span>
          <span className="text-brand-green font-bold">{g.awayScore ?? 0}</span>
          <span className="text-white/20">@</span>
          <span className="font-semibold text-white/90">{g.homeTeam}</span>
          <span className="text-brand-green font-bold">{g.homeScore ?? 0}</span>
          {g.period && <span className="text-[10px] text-white/30">{g.period}</span>}
          {i < liveGames.length - 1 && <span className="ml-2 text-brand-green/20">|</span>}
        </div>
      ))}
    </div>
  );
}

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
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{
        background: `${cfg.color}10`,
        border: `1px solid ${cfg.color}30`,
        color: cfg.color,
      }}
      title={`AI Engine: ${cfg.title}`}
    >
      <Cpu className="w-3 h-3" />
      <span>{cfg.label}</span>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
    </div>
  );
}

const navLinks = [
  { href: "/picks", label: "Picks" },
  { href: "/performance", label: "Performance" },
  { href: "/stats", label: "Live Stats" },
  { href: "/ev-finder", label: "+EV Finder" },
  { href: "/backtesting", label: "Backtest" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/kalshi", label: "Kalshi" },
  { href: "/clv-tracker", label: "CLV" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/arbitrage-opportunities", label: "Arb Opps" },
  { href: "/prop-builder", label: "Props" },
  { href: "/line-movement", label: "Lines" },
  { href: "/correlation-finder", label: "Corr" },
  { href: "/sportsbooks", label: "Sportsbooks" },
  { href: "/odds-comparison", label: "Odds" },
  { href: "/bet-calculator", label: "Calc" },
  { href: "/story-generator", label: "📸 Stories" },
  { href: "/story-history", label: "📚 History" },
  { href: "/tools", label: "Tools" },
  { href: "/referral", label: "Referral" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8, 8, 20, 0.97)" : "rgba(8, 8, 20, 0.85)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: scrolled ? "1px solid rgba(57,255,20,0.08)" : "none",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <LiveScoresTicker />
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo — CP icon on mobile, full horizontal on md+ */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            {/* Mobile: CP icon only */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-icon-a3mVBRaWZeuoNHa3gFxuBp.webp"
              alt="ChalkPicks"
              className="md:hidden h-10 w-10 transition-all duration-300 group-hover:scale-[1.05]"
              style={{ filter: "drop-shadow(0 0 10px rgba(57,255,20,0.4))" }}
            />
            {/* Desktop: full horizontal logo */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-navbar-EuWyWqzZKRjh6eatJJ5Sm9.webp"
              alt="ChalkPicks"
              className="hidden md:block h-12 w-auto max-w-[220px] transition-all duration-300 group-hover:scale-[1.03]"
              style={{ filter: "drop-shadow(0 0 12px rgba(57,255,20,0.25)) drop-shadow(0 0 4px rgba(57,255,20,0.15))" }}
            />
          </Link>

          {/* Desktop Nav — pill-style links with smooth hover */}
          <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-hide mx-4">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 whitespace-nowrap"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.02em",
                    color: isActive ? "#39ff14" : "rgba(200,200,220,0.65)",
                    background: isActive ? "rgba(57,255,20,0.08)" : "transparent",
                    textShadow: isActive ? "0 0 12px rgba(57,255,20,0.5)" : "none",
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                      style={{ background: "#39ff14", boxShadow: "0 0 8px rgba(57,255,20,0.6)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side — clean, rounded elements */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <LlmStatusBadge />
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-9 h-9 hover:bg-white/5"
                    style={{ color: "rgba(200,200,220,0.6)" }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifCount && notifCount.count > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold bg-brand-red text-white">
                        {notifCount.count > 9 ? "9+" : notifCount.count}
                      </span>
                    ) : null}
                  </Button>
                </Link>

                {/* User menu — rounded pill */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-white/5 transition-all"
                    >
                      <Avatar className="w-8 h-8 ring-1 ring-brand-green/20">
                        <AvatarFallback
                          className="text-xs font-bold bg-brand-green/10 text-brand-green"
                        >
                          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-24 truncate text-white/80">
                        {user?.name ?? "User"}
                      </span>
                      {isPremium && <Crown className="w-3.5 h-3.5 hidden sm:block text-brand-gold" />}
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 rounded-xl border-white/10 bg-[#0c0c1c]/98 shadow-2xl"
                  >
                    <div className="px-3 py-2.5">
                      <p className="text-xs text-white/40">Signed in as</p>
                      <p className="text-sm font-medium truncate text-white/90">{user?.email ?? user?.name}</p>
                      <Badge className="mt-1.5 text-[10px] capitalize badge-premium border-0 rounded-full">
                        {user?.subscriptionTier ?? "free"}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/dashboard">My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/subscription-dashboard">Subscription</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/credits" className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-brand-green" />
                        Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/account-settings">Account Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/tools">Power Tools</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg mx-1">
                      <Link href="/pricing">Upgrade Plan</Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem asChild className="rounded-lg mx-1">
                          <Link href="/admin" className="flex items-center gap-2 text-brand-green">
                            <Shield className="w-3 h-3" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive focus:text-destructive rounded-lg mx-1"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex rounded-full text-white/60 hover:text-white hover:bg-white/5"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <button
                    className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold tracking-wider rounded-full transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg, #39ff14 0%, #2dd40e 100%)",
                      color: "#080814",
                      fontFamily: "'Exo 2', sans-serif",
                      boxShadow: "0 0 20px rgba(57,255,20,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(57,255,20,0.45), 0 0 60px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px) scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(57,255,20,0.25), inset 0 1px 0 rgba(255,255,255,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0) scale(1)";
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    LAUNCH APP
                  </button>
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full w-9 h-9 hover:bg-white/5"
              style={{ color: "rgba(200,200,220,0.7)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu — slide-in panel */}
        {mobileOpen && (
          <div className="lg:hidden py-4 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-green/20 to-transparent mb-3" />
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{
                    color: isActive ? "#39ff14" : "rgba(200,200,220,0.7)",
                    background: isActive ? "rgba(57,255,20,0.06)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <div className="pt-3 mt-2 border-t border-white/5">
                <button
                  className="w-full py-3 text-sm font-bold tracking-wider rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #39ff14 0%, #2dd40e 100%)",
                    color: "#080814",
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                  onClick={() => { setMobileOpen(false); window.location.href = "/signup"; }}
                >
                  <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                  LAUNCH APP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
