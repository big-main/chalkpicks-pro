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
import { Menu, X, Zap, ChevronDown, Bell, Crown, TrendingUp, BarChart3, Calculator, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ESPNNewsTicker from "./ESPNNewsTicker";
import RealtimeStats from "./RealtimeStats";

const navLinks = [
  { href: "/picks", label: "AI PICKS" },
  { href: "/stats", label: "LIVE STATS" },
  { href: "/ev-finder", label: "+EV FINDER" },
  { href: "/backtesting", label: "BACKTEST" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/pricing", label: "PRICING" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <>
      {/* ESPN News Ticker */}
      <ESPNNewsTicker />

      {/* Real-time Stats Bar */}
      <RealtimeStats />

      {/* Main Navbar */}
      <nav
        className="fixed top-32 left-0 right-0 z-40"
        style={{
          background: "linear-gradient(180deg, rgba(6, 8, 20, 0.95) 0%, rgba(8, 10, 25, 0.85) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #00ff88",
                  borderRadius: "8px",
                  boxShadow: "0 0 15px rgba(0,255,136,0.4), inset 0 0 10px rgba(0,255,136,0.1)",
                  transition: "all 200ms",
                }}
              >
                <Zap style={{ width: "20px", height: "20px", color: "#00ff88" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: "20px",
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    background: "linear-gradient(135deg, #d4af37 0%, #e8c547 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  CHALK
                </span>
                <span
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: "20px",
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    color: "#f0f0f0",
                  }}
                >
                  PICKS
                </span>
              </div>
              <Badge
                style={{
                  background: "rgba(0,255,136,0.12)",
                  color: "#00ff88",
                  border: "1px solid rgba(0,255,136,0.3)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "4px 8px",
                }}
              >
                PRO
              </Badge>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: "none" }} className="lg:flex" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: "0.05em",
                    color: location === link.href ? "#00ff88" : "rgba(200,200,220,0.65)",
                    background: location === link.href ? "rgba(0,255,136,0.08)" : "transparent",
                    textShadow: location === link.href ? "0 0 8px rgba(0,255,136,0.3)" : "none",
                    borderBottom: location === link.href ? "2px solid #00ff88" : "2px solid transparent",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 200ms",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Link href="/notifications">
                    <Button
                      variant="ghost"
                      size="icon"
                      style={{
                        color: "rgba(200,200,220,0.7)",
                        position: "relative",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Bell style={{ width: "18px", height: "18px" }} />
                      {notifCount && notifCount.count > 0 ? (
                        <span
                          style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            width: "18px",
                            height: "18px",
                            fontSize: "10px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            background: "#ff4d8f",
                            color: "#080814",
                          }}
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          color: "rgba(200,200,220,0.85)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Avatar style={{ width: "28px", height: "28px" }}>
                          <AvatarFallback
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "rgba(0,255,136,0.15)",
                              color: "#00ff88",
                              border: "1px solid rgba(0,255,136,0.3)",
                            }}
                          >
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown style={{ width: "16px", height: "16px" }} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      style={{
                        background: "rgba(8, 10, 25, 0.95)",
                        border: "1px solid rgba(212, 175, 55, 0.2)",
                        borderRadius: "8px",
                      }}
                    >
                      <DropdownMenuItem style={{ color: "rgba(200,200,220,0.9)" }}>
                        <Link href="/account" style={{ textDecoration: "none", color: "inherit" }}>
                          Account
                        </Link>
                      </DropdownMenuItem>
                      {isPremium && (
                        <DropdownMenuItem style={{ color: "#00ff88" }}>
                          <Crown style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                          Premium
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator style={{ background: "rgba(212, 175, 55, 0.1)" }} />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        style={{ color: "rgba(200,200,220,0.9)" }}
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
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                        color: "#d4af37",
                        padding: "6px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 200ms",
                      }}
                    >
                      SIGN IN
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      style={{
                        background: "#00ff88",
                        color: "#000000",
                        padding: "6px 16px",
                        fontSize: "13px",
                        fontWeight: 700,
                        borderRadius: "4px",
                        cursor: "pointer",
                        border: "none",
                        boxShadow: "0 0 15px rgba(0,255,136,0.3)",
                        transition: "all 200ms",
                      }}
                    >
                      JOIN NOW
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden"
                style={{
                  color: "rgba(200,200,220,0.7)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {mobileOpen ? <X style={{ width: "20px", height: "20px" }} /> : <Menu style={{ width: "20px", height: "20px" }} />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div style={{ paddingBottom: "16px", borderTop: "1px solid rgba(212, 175, 55, 0.1)" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Exo 2', sans-serif",
                    color: location === link.href ? "#00ff88" : "rgba(200,200,220,0.7)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(212, 175, 55, 0.05)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
