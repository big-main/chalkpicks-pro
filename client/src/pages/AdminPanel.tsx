import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import {
  Users, Shield, TrendingUp, DollarSign, Activity,
  BarChart3, Settings, Eye, Ban, CheckCircle2,
  AlertCircle, Crown, Calendar, Search, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-dark-v2-Ey5FDp5iZKArkMRM3n8FwX.webp";

const cardStyle = {
  background: "rgba(12,12,22,0.9)",
  border: "1px solid rgba(57,255,20,0.15)",
  borderRadius: "8px",
  padding: "1.5rem",
};

const statCard = (color: string) => ({
  background: `rgba(12,12,22,0.9)`,
  border: `1px solid ${color}30`,
  borderRadius: "8px",
  padding: "1.25rem",
});

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [elevateEmail, setElevateEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "subscriptions" | "picks">("overview");
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 25;

  // Fetch platform stats
  const { data: leaderboardData } = trpc.leaderboard.list.useQuery({ limit: 10 });
  const { data: picksData } = trpc.picks.list.useQuery({ limit: 5, tier: "all" });

  // Fetch real users from DB
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery(
    { limit: PAGE_SIZE, offset: userPage * PAGE_SIZE },
    { enabled: activeTab === "users" }
  );

  const updateTierMutation = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => { toast.success("User tier updated"); refetchUsers(); },
    onError: (err) => toast.error(err.message || "Failed to update tier"),
  });

  const elevateMutation = trpc.auth.elevateToAdmin.useMutation({
    onSuccess: () => {
      toast.success(`Admin privileges granted to ${elevateEmail}`);
      setElevateEmail("");
    },
    onError: (err) => toast.error(err.message || "Failed to elevate user"),
  });

  // Redirect non-admins
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Shield className="w-16 h-16 mb-4" style={{ color: "#ff4444" }} />
        <h1 style={{ fontWeight: 700, fontSize: "2rem", color: "white" }}>
          Access Denied
        </h1>
        <p style={{ color: "rgba(200,200,220,0.6)", marginTop: "0.5rem" }}>
          Admin privileges required.
        </p>
        <Link href="/">
          <button
            className="mt-6 btn-premium"
          >
            Go Home
          </button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: Crown },
    { id: "picks", label: "Picks Engine", icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="ChalkPicks" className="h-10 w-auto" style={{ filter: "drop-shadow(0 0 8px rgba(57,255,20,0.4))" }} />
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "1.75rem", textTransform: "uppercase", color: "white" }}>
                Admin Panel
              </h1>
              <p style={{ color: "rgba(57,255,20,0.8)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                ChalkPicks Control Center
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", borderRadius: "6px" }}
          >
            <Shield className="w-4 h-4" style={{ color: "#39ff14" }} />
            <span style={{ color: "#39ff14", fontSize: "0.8rem", fontWeight: 700 }}>
              ADMIN: {user?.name || user?.email}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 p-1" style={{ background: "rgba(0,0,0,0.4)", borderRadius: "8px", width: "fit-content" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(57,255,20,0.15)" : "transparent",
                  border: active ? "1px solid rgba(57,255,20,0.3)" : "1px solid transparent",
                  borderRadius: "6px",
                  color: active ? "#39ff14" : "rgba(200,200,220,0.6)",
                  cursor: "pointer",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: "—", sub: "Registered accounts", color: "#39ff14", icon: Users },
                { label: "Active Subs", value: "—", sub: "Paying subscribers", color: "#f0b800", icon: Crown },
                { label: "Picks Today", value: picksData?.picks?.length ?? "—", sub: "AI picks generated", color: "#d4a017", icon: Activity },
                { label: "Revenue MTD", value: "—", sub: "Month to date", color: "#fbbf24", icon: DollarSign },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} style={statCard(stat.color)}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: "rgba(180,180,210,0.7)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        {stat.label}
                      </span>
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "2rem", color: stat.color }}>
                      {stat.value}
                    </div>
                    <div style={{ color: "rgba(140,140,170,0.7)", fontSize: "0.75rem" }}>{stat.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Elevate to Admin */}
              <div style={cardStyle}>
                <h3 style={{ fontWeight: 700, color: "#39ff14", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                  <Shield className="w-4 h-4 inline mr-2" />
                  Elevate User to Admin
                </h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={elevateEmail}
                    onChange={(e) => setElevateEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(57,255,20,0.2)",
                      borderRadius: "6px",
                      color: "white",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!elevateEmail) return toast.error("Enter an email");
                      elevateMutation.mutate({ email: elevateEmail });
                    }}
                    disabled={elevateMutation.isPending}
                    className="px-4 py-2 text-sm font-bold"
                    style={{
                      background: "#39ff14",
                      color: "#080814",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {elevateMutation.isPending ? "..." : "Grant Admin"}
                  </button>
                </div>
                <p style={{ color: "rgba(140,140,170,0.6)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                  Grants admin role + yearly subscription to the specified email.
                </p>
              </div>

              {/* Platform Links */}
              <div style={cardStyle}>
                <h3 style={{ fontWeight: 700, color: "#f0b800", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                  <Settings className="w-4 h-4 inline mr-2" />
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Stripe Dashboard", href: "https://dashboard.stripe.com", color: "#d4a017" },
                    { label: "Admin Promos", href: "/admin/promos", color: "#39ff14" },
                    { label: "Feedback Analytics", href: "/feedback-analytics", color: "#f0b800" },
                    { label: "Subscription Mgmt", href: "/subscription-management", color: "#fbbf24" },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        background: `${link.color}15`,
                        border: `1px solid ${link.color}30`,
                        borderRadius: "6px",
                        color: link.color,
                        textDecoration: "none",
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Picks */}
            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, color: "#d4a017", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                <Activity className="w-4 h-4 inline mr-2" />
                Recent AI Picks
              </h3>
              {picksData?.picks?.length ? (
                <div className="space-y-2">
                  {picksData.picks.map((pick) => (
                    <div
                      key={pick.id}
                      className="flex items-center justify-between p-3"
                      style={{ background: "rgba(255,255,255,0.03)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div>
                        <div className="font-medium text-sm" style={{ color: "white" }}>{pick.recommendation}</div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.7)" }}>
                          {pick.sportKey} · {pick.pickType} · {pick.odds}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: (pick.confidenceScore ?? 0) >= 75 ? "rgba(57,255,20,0.15)" : "rgba(251,191,36,0.15)",
                            border: `1px solid ${(pick.confidenceScore ?? 0) >= 75 ? "rgba(57,255,20,0.3)" : "rgba(251,191,36,0.3)"}`,
                            borderRadius: "4px",
                            color: (pick.confidenceScore ?? 0) >= 75 ? "#39ff14" : "#fbbf24",
                          }}
                        >
                          {pick.confidenceScore}% CONF
                        </div>
                        <div
                          className="px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: pick.tier === "free" ? "rgba(140,140,170,0.1)" : "rgba(212,160,23,0.15)",
                            border: `1px solid ${pick.tier === "free" ? "rgba(140,140,170,0.2)" : "rgba(212,160,23,0.3)"}`,
                            borderRadius: "4px",
                            color: pick.tier === "free" ? "rgba(180,180,210,0.7)" : "#d4a017",
                          }}
                        >
                          {pick.tier?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "rgba(140,140,170,0.6)", fontSize: "0.875rem" }}>No picks found.</p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, color: "#39ff14", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                <Users className="w-4 h-4 inline mr-2" />
                Members ({usersData?.total ?? "…"})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchUsers()}
                  className="p-1.5 rounded"
                  style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)", color: "#39ff14", cursor: "pointer" }}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Search className="w-4 h-4" style={{ color: "rgba(140,140,170,0.6)" }} />
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="px-3 py-1.5 text-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(57,255,20,0.2)",
                    borderRadius: "6px",
                    color: "white",
                    outline: "none",
                    width: "220px",
                  }}
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="p-8 text-center" style={{ color: "rgba(140,140,170,0.6)" }}>
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#39ff14" }} />
                Loading members...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(57,255,20,0.15)" }}>
                        {["Name", "Email", "Tier", "Role", "Bets", "Joined", "Actions"].map((h) => (
                          <th key={h} className="text-left py-2 px-3" style={{ color: "rgba(140,140,170,0.7)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(usersData?.users ?? []).filter(u =>
                        !searchEmail || u.email?.toLowerCase().includes(searchEmail.toLowerCase())
                      ).map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3" style={{ color: "white", fontWeight: 500 }}>{u.name || "—"}</td>
                          <td className="py-2 px-3" style={{ color: "rgba(180,180,210,0.8)" }}>{u.email}</td>
                          <td className="py-2 px-3">
                            <select
                              defaultValue={u.subscriptionTier || "free"}
                              onChange={(e) => updateTierMutation.mutate({ userId: u.id, subscriptionTier: e.target.value as any })}
                              className="text-xs px-2 py-0.5"
                              style={{
                                background: "rgba(57,255,20,0.1)",
                                border: "1px solid rgba(57,255,20,0.25)",
                                borderRadius: "4px",
                                color: "#39ff14",
                                cursor: "pointer",
                              }}
                            >
                              {["free", "trial", "daily", "monthly", "yearly"].map((t) => (
                                <option key={t} value={t} style={{ background: "#0c0c16", color: "white" }}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-xs px-2 py-0.5" style={{
                              background: u.role === "admin" ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${u.role === "admin" ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.1)"}`,
                              borderRadius: "4px",
                              color: u.role === "admin" ? "#d4a017" : "rgba(180,180,210,0.7)",
                            }}>{u.role}</span>
                          </td>
                          <td className="py-2 px-3" style={{ color: "rgba(140,140,170,0.7)" }}>{u.totalBets ?? 0}</td>
                          <td className="py-2 px-3" style={{ color: "rgba(140,140,170,0.6)", fontSize: "0.75rem" }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => { setElevateEmail(u.email || ""); setActiveTab("overview"); }}
                              className="text-xs px-2 py-0.5"
                              style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: "4px", color: "#39ff14", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {(usersData?.total ?? 0) > PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(140,140,170,0.6)", fontSize: "0.8rem" }}>
                      Showing {userPage * PAGE_SIZE + 1}–{Math.min((userPage + 1) * PAGE_SIZE, usersData?.total ?? 0)} of {usersData?.total} members
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setUserPage(p => Math.max(0, p - 1))} disabled={userPage === 0}
                        className="px-3 py-1 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "white", cursor: userPage === 0 ? "not-allowed" : "pointer", opacity: userPage === 0 ? 0.4 : 1 }}>
                        ← Prev
                      </button>
                      <button onClick={() => setUserPage(p => p + 1)} disabled={(userPage + 1) * PAGE_SIZE >= (usersData?.total ?? 0)}
                        className="px-3 py-1 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "white", cursor: (userPage + 1) * PAGE_SIZE >= (usersData?.total ?? 0) ? "not-allowed" : "pointer", opacity: (userPage + 1) * PAGE_SIZE >= (usersData?.total ?? 0) ? 0.4 : 1 }}>
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Stripe link remains */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(140,140,170,0.5)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>For payment history and subscription management:</p>
              <a
                href="https://dashboard.stripe.com/customers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-bold"
                style={{
                  background: "rgba(212,160,23,0.15)",
                  border: "1px solid rgba(212,160,23,0.3)",
                  borderRadius: "6px",
                  color: "#d4a017",
                  textDecoration: "none",
                }}
              >
                <Eye className="w-4 h-4" />
                View in Stripe Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, color: "#f0b800", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                <Crown className="w-4 h-4 inline mr-2" />
                Subscription Tiers
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { tier: "Basic", price: "$9.99/mo", color: "#f0b800", features: ["All AI picks", "Basic tools", "Live scores"] },
                  { tier: "Pro", price: "$19.99/mo", color: "#39ff14", features: ["All Basic features", "+EV Finder", "Arbitrage", "Parlay Builder", "CLV Tracker", "Bankroll Tracker"] },
                  { tier: "Elite", price: "$59.99/yr", color: "#d4a017", features: ["All Pro features", "Priority support", "Best value"] },
                ].map((plan) => (
                  <div
                    key={plan.tier}
                    className="p-4"
                    style={{ background: `${plan.color}08`, border: `1px solid ${plan.color}25`, borderRadius: "8px" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: plan.color, textTransform: "uppercase" }}>
                      {plan.tier}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "white", margin: "0.5rem 0" }}>
                      {plan.price}
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(180,180,210,0.8)" }}>
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: plan.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                <DollarSign className="w-4 h-4 inline mr-2" />
                Stripe Management
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "View All Subscriptions", href: "https://dashboard.stripe.com/subscriptions", desc: "Active, canceled, and past due" },
                  { label: "View Payments", href: "https://dashboard.stripe.com/payments", desc: "All payment history" },
                  { label: "Manage Products", href: "https://dashboard.stripe.com/products", desc: "Edit prices and plans" },
                  { label: "Webhook Logs", href: "https://dashboard.stripe.com/webhooks", desc: "Monitor webhook delivery" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 transition-all hover:opacity-80"
                    style={{
                      background: "rgba(251,191,36,0.06)",
                      border: "1px solid rgba(251,191,36,0.15)",
                      borderRadius: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#fbbf24" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#fbbf24" }}>{link.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>{link.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Picks Engine Tab */}
        {activeTab === "picks" && (
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, color: "#d4a017", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                <Activity className="w-4 h-4 inline mr-2" />
                AI Picks Engine
              </h3>
              <div
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold"
                style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", borderRadius: "4px", color: "#39ff14" }}
              >
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                SCHEDULER ACTIVE
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-medium mb-1" style={{ color: "white" }}>Daily Picks Generation</div>
                <p style={{ color: "rgba(140,140,170,0.7)", fontSize: "0.8rem", lineHeight: 1.6 }}>
                  Picks are auto-generated daily at 6:00 AM PT via the scheduler. Uses Claude for deep qualitative analysis and OpenAI for concise summaries. Weather data from Open-Meteo is factored in for NFL and MLB games.
                </p>
              </div>
              <div className="p-4" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-medium mb-1" style={{ color: "white" }}>Supported Sports</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "MMA/UFC", "Soccer"].map((sport) => (
                    <span
                      key={sport}
                      className="px-2 py-0.5 text-xs font-bold"
                      style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: "4px", color: "#d4a017" }}
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-medium mb-2" style={{ color: "white" }}>Recent Picks</div>
                {picksData?.picks?.slice(0, 5).map((pick) => (
                  <div key={pick.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="text-sm" style={{ color: "rgba(200,200,220,0.8)" }}>{pick.recommendation}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#39ff14" }}>{pick.confidenceScore}%</span>
                      <span className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{pick.sportKey}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
