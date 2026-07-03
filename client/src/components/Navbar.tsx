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
import { useState } from "react";
import { Menu, X, Zap, ChevronDown, Bell, Crown, TrendingUp, BarChart3, Calculator, Layers, Activity, Shield, Cpu } from "lucide-react";
import { trpc } from "@/lib/trpc";

function LiveScoresMini() {
  const { data: games } = trpc.stats.allGames.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const liveGames = (games ?? []).filter((g: any) => g.status === 'in_progress' || g.status === 'live').slice(0, 5);
  if (!liveGames.length) return null;
  return (
    <div
      className="hidden lg:flex items-center gap-4 overflow-x-auto px-4 py-1 text-[11px]"
      style={{ background: 'rgba(57,255,20,0.04)', borderBottom: '1px solid rgba(57,255,20,0.08)' }}
    >
      <div className="flex items-center gap-1 flex-shrink-0" style={{ color: '#39ff14' }}>
        <Activity className="w-3 h-3 animate-pulse" />
        <span className="font-bold tracking-widest" style={{ fontFamily: "'Exo 2', sans-serif" }}>LIVE</span>
      </div>
      {liveGames.map((g: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'rgba(200,200,220,0.75)' }}>
          <span className="font-bold" style={{ color: 'white' }}>{g.awayTeam}</span>
          <span style={{ color: '#39ff14', fontWeight: 700 }}>{g.awayScore ?? 0}</span>
          <span style={{ color: 'rgba(140,140,170,0.4)' }}>@</span>
          <span className="font-bold" style={{ color: 'white' }}>{g.homeTeam}</span>
          <span style={{ color: '#39ff14', fontWeight: 700 }}>{g.homeScore ?? 0}</span>
          {g.period && <span className="text-[10px]" style={{ color: 'rgba(140,140,170,0.5)' }}>{g.period}</span>}
          {i < liveGames.length - 1 && <span className="ml-2" style={{ color: 'rgba(57,255,20,0.2)' }}>|</span>}
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
  const isQwen = data.provider === "qwen";
  return (
    <div
      className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase"
      style={{
        background: isQwen ? "rgba(57,255,20,0.08)" : "rgba(255,180,0,0.08)",
        border: `1px solid ${isQwen ? "rgba(57,255,20,0.25)" : "rgba(255,180,0,0.25)"}`,
        color: isQwen ? "#39ff14" : "#ffb400",
      }}
      title={`AI Engine: ${isQwen ? "Qwen 2.5 7B (Local)" : "Gemini Flash (Cloud)"}`}
    >
      <Cpu className="w-3 h-3" />
      <span>{isQwen ? "Qwen" : "Gemini"}</span>
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: isQwen ? "#39ff14" : "#ffb400" }}
      />
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
  { href: "/tools", label: "Tools" },
  { href: "/referral", label: "Referral" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8, 8, 20, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 255, 136, 0.12)",
      }}
    >
      <LiveScoresMini />
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-dark-v2-Ey5FDp5iZKArkMRM3n8FwX.webp"
              alt="ChalkPicks"
              className="h-12 w-auto transition-all group-hover:scale-105"
              style={{ filter: "drop-shadow(0 0 12px rgba(57,255,20,0.5))" }}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium rounded transition-all"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  color: location === link.href ? "#39ff14" : "rgba(200,200,220,0.75)",
                  background: location === link.href ? "rgba(57,255,20,0.08)" : "transparent",
                  textShadow: location === link.href ? "0 0 8px rgba(57,255,20,0.4)" : "none",
                  borderBottom: location === link.href ? "1px solid rgba(57,255,20,0.4)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* LLM Status Badge */}
            <LlmStatusBadge />
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    style={{ color: "rgba(200,200,220,0.7)" }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifCount && notifCount.count > 0 ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold"
                        style={{ background: "#ff4d8f", color: "#080814" }}
                      >
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
                      className="flex items-center gap-2 px-2"
                      style={{ color: "rgba(200,200,220,0.85)" }}
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback
                          className="text-xs font-bold"
                          style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.3)" }}
                        >
                          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                        {user?.name ?? "User"}
                      </span>
                      {isPremium && <Crown className="w-3 h-3 hidden sm:block" style={{ color: "#39ff14" }} />}
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48"
                    style={{ background: "rgba(12,12,28,0.98)", border: "1px solid rgba(57,255,20,0.2)" }}
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email ?? user?.name}</p>
                      <Badge className="mt-1 text-[10px] capitalize badge-premium border-0">
                        {user?.subscriptionTier ?? "free"}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator style={{ borderColor: "rgba(57,255,20,0.1)" }} />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription-dashboard">Subscription</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/credits" className="flex items-center gap-2">
                        <Zap className="w-3 h-3" style={{ color: "#39ff14" }} />
                        Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account-settings">Account Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tools">Power Tools</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">Upgrade Plan</Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator style={{ borderColor: "rgba(57,255,20,0.1)" }} />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2" style={{ color: "#39ff14" }}>
                            <Shield className="w-3 h-3" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator style={{ borderColor: "rgba(57,255,20,0.1)" }} />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive focus:text-destructive"
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
                    className="hidden sm:flex"
                    style={{ color: "rgba(200,200,220,0.7)" }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <button
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold tracking-wider transition-all"
                    style={{
                      background: "#39ff14",
                      color: "#080814",
                      borderRadius: "4px",
                      fontFamily: "'Exo 2', sans-serif",
                      boxShadow: "0 0 15px rgba(57,255,20,0.3)",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 25px rgba(57,255,20,0.5), 0 0 50px rgba(57,255,20,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 15px rgba(57,255,20,0.3)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
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
              className="lg:hidden"
              style={{ color: "rgba(200,200,220,0.7)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lg:hidden py-3 space-y-1"
            style={{ borderTop: "1px solid rgba(57,255,20,0.12)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded transition-all"
                style={{
                  color: location === link.href ? "#39ff14" : "rgba(200,200,220,0.75)",
                  background: location === link.href ? "rgba(57,255,20,0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-2" style={{ borderTop: "1px solid rgba(57,255,20,0.12)" }}>
                <button
                  className="w-full py-2.5 text-sm font-bold tracking-wider"
                  style={{
                    background: "#39ff14",
                    color: "#080814",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => (window.location.href = "/signup")}
                >
                  LAUNCH APP FREE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
