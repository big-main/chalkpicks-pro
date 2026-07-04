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
import { Menu, X, Zap, ChevronDown, Bell, Crown, Cpu, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

// Streamlined nav — primary links visible, secondary in "More" dropdown
const primaryLinks = [
  { href: "/picks", label: "Picks" },
  { href: "/performance", label: "Performance" },
  { href: "/ev-finder", label: "+EV Finder" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/stats", label: "Live Stats" },
  { href: "/pricing", label: "Pricing" },
];

const moreLinks = [
  { href: "/backtesting", label: "Backtest" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/kalshi", label: "Kalshi" },
  { href: "/clv-tracker", label: "CLV Tracker" },
  { href: "/arbitrage-opportunities", label: "Arb Opportunities" },
  { href: "/prop-builder", label: "Prop Builder" },
  { href: "/line-movement", label: "Line Movement" },
  { href: "/correlation-finder", label: "Correlations" },
  { href: "/sportsbooks", label: "Sportsbooks" },
  { href: "/odds-comparison", label: "Odds Compare" },
  { href: "/bet-calculator", label: "Bet Calculator" },
  { href: "/tools/odds-calculator", label: "Odds Calculator" },
  { href: "/tools/roi-calculator", label: "ROI Calculator" },
  { href: "/tools/bankroll-manager", label: "Bankroll Manager" },
  { href: "/community-automation", label: "Community" },
  { href: "/story-generator", label: "Story Generator" },
  { href: "/story-history", label: "Story History" },
  { href: "/referral", label: "Referral" },
];

const allLinks = [...primaryLinks, ...moreLinks];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(8, 8, 15, 0.92)"
          : "rgba(8, 8, 15, 0.6)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        borderBottom: scrolled
          ? "1px solid rgba(255, 255, 255, 0.06)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 4px 30px rgba(0, 0, 0, 0.4)"
          : "none",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo — larger, premium feel */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            {/* Mobile: CP icon */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-icon-a3mVBRaWZeuoNHa3gFxuBp.webp"
              alt="ChalkPicks"
              className="md:hidden h-11 w-11 transition-all duration-300 group-hover:scale-105"
              style={{ filter: "drop-shadow(0 0 12px rgba(57, 255, 20, 0.35))" }}
            />
            {/* Desktop: full logo — LARGER */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/cp-logo-navbar-EuWyWqzZKRjh6eatJJ5Sm9.webp"
              alt="ChalkPicks"
              className="hidden md:block h-14 w-auto max-w-[240px] transition-all duration-300 group-hover:scale-[1.03]"
              style={{ filter: "drop-shadow(0 0 16px rgba(57, 255, 20, 0.2))" }}
            />
          </Link>

          {/* Desktop Nav — clean, minimal, with "More" dropdown */}
          <div className="hidden lg:flex items-center gap-1 mx-6">
            {primaryLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200"
                  style={{
                    color: isActive ? "#39ff14" : "rgba(255, 255, 255, 0.6)",
                    background: isActive ? "rgba(57, 255, 20, 0.06)" : "transparent",
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                      style={{ background: "#39ff14", boxShadow: "0 0 8px rgba(57, 255, 20, 0.6)" }}
                    />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 text-white/50 hover:text-white/80 hover:bg-white/5"
                >
                  More
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-56 rounded-xl border-white/10 bg-[#0c0c18]/98 shadow-2xl backdrop-blur-xl max-h-[70vh] overflow-y-auto"
              >
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild className="rounded-lg mx-1">
                    <Link
                      href={link.href}
                      className="w-full"
                      style={{
                        color: location === link.href ? "#39ff14" : undefined,
                      }}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side */}
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

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-white/5 transition-all"
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
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 rounded-xl border-white/10 bg-[#0c0c18]/98 shadow-2xl backdrop-blur-xl"
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden py-4 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
            {allLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{
                    color: isActive ? "#39ff14" : "rgba(255, 255, 255, 0.65)",
                    background: isActive ? "rgba(57, 255, 20, 0.06)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
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
        )}
      </div>
    </nav>
  );
}
