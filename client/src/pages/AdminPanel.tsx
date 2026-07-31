import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import {
  Users,
  Shield,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Settings,
  Eye,
  Ban,
  CheckCircle2,
  AlertCircle,
  Crown,
  Calendar,
  Search,
  RefreshCw,
  Bell,
  Send,
  Megaphone,
  Gauge,
  Database,
} from "lucide-react";
import { useState as useLocalState } from "react";
import { toast } from "sonner";

const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png";

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
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "subscriptions"
    | "picks"
    | "notifications"
    | "performance"
    | "directories"
    | "cache"
  >("overview");
  const [psUrl, setPsUrl] = useState("https://www.chalkpicks.live");
  const [psResult, setPsResult] = useState<null | {
    mobile: ReturnType<typeof Object.create>;
    desktop: ReturnType<typeof Object.create>;
  }>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastUrl, setBroadcastUrl] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementType, setAnnouncementType] = useState<
    "info" | "warning" | "success" | "promo"
  >("info");
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 25;

  // Fetch platform stats
  const { data: leaderboardData } = trpc.leaderboard.list.useQuery({
    limit: 10,
  });
  const { data: picksData } = trpc.picks.list.useQuery({
    limit: 5,
    tier: "all",
  });

  // Fetch real users from DB
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = trpc.admin.getUsers.useQuery(
    { limit: PAGE_SIZE, offset: userPage * PAGE_SIZE },
    { enabled: activeTab === "users" }
  );

  const updateTierMutation = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => {
      toast.success("User tier updated");
      refetchUsers();
    },
    onError: err => toast.error(err.message || "Failed to update tier"),
  });

  const elevateMutation = trpc.auth.elevateToAdmin.useMutation({
    onSuccess: () => {
      toast.success(`Admin privileges granted to ${elevateEmail}`);
      setElevateEmail("");
    },
    onError: err => toast.error(err.message || "Failed to elevate user"),
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
          <button className="mt-6 btn-premium">Go Home</button>
        </Link>
      </div>
    );
  }

  // Notifications mutations
  const broadcastPush = trpc.notifications.broadcastPush.useMutation({
    onSuccess: d => toast.success(`Push sent to ${d.pushCount} subscribers`),
    onError: () => toast.error("Broadcast failed"),
  });
  const emailBlast = trpc.notifications.emailBlast.useMutation({
    onSuccess: d =>
      toast.success(`Email sent to ${d.sent} subscribers (${d.errors} errors)`),
    onError: () => toast.error("Email blast failed"),
  });
  const createAnnouncement = trpc.notifications.createAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement created");
      setAnnouncementTitle("");
      setAnnouncementBody("");
    },
    onError: () => toast.error("Failed to create announcement"),
  });
  const { data: announcementsList, refetch: refetchAnnouncements } =
    trpc.notifications.listAnnouncements.useQuery(undefined, {
      enabled: activeTab === "notifications",
    });
  const deleteAnnouncement = trpc.notifications.deleteAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Deleted");
      refetchAnnouncements();
    },
  });

  const psAudit = trpc.pageSpeed.auditBoth.useMutation({
    onSuccess: d => {
      setPsResult(d as never);
    },
    onError: e => toast.error(e.message || "PageSpeed audit failed"),
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: Crown },
    { id: "picks", label: "Picks Engine", icon: Activity },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "performance", label: "PageSpeed", icon: Gauge },
    { id: "directories", label: "Directories", icon: Eye },
    { id: "cache", label: "API Cache", icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src={LOGO_URL}
              alt="ChalkPicks"
              className="h-12 w-auto"
              style={{
                filter:
                  "drop-shadow(0 0 14px rgba(245, 158, 11, 0.55)) drop-shadow(0 0 6px rgba(239, 68, 68, 0.35))",
              }}
            />
            <div>
              <h1
                style={{
                  fontWeight: 700,
                  fontSize: "1.75rem",
                  textTransform: "uppercase",
                  color: "white",
                }}
              >
                Admin Panel
              </h1>
              <p
                style={{
                  color: "rgba(57,255,20,0.8)",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                ChalkPicks Control Center
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              background: "rgba(57,255,20,0.1)",
              border: "1px solid rgba(57,255,20,0.3)",
              borderRadius: "6px",
            }}
          >
            <Shield className="w-4 h-4" style={{ color: "#39ff14" }} />
            <span
              style={{ color: "#39ff14", fontSize: "0.8rem", fontWeight: 700 }}
            >
              ADMIN: {user?.name || user?.email}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-8 p-1"
          style={{
            background: "rgba(0,0,0,0.4)",
            borderRadius: "8px",
            width: "fit-content",
          }}
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(57,255,20,0.15)" : "transparent",
                  border: active
                    ? "1px solid rgba(57,255,20,0.3)"
                    : "1px solid transparent",
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
                {
                  label: "Total Users",
                  value: "—",
                  sub: "Registered accounts",
                  color: "#39ff14",
                  icon: Users,
                },
                {
                  label: "Active Subs",
                  value: "—",
                  sub: "Paying subscribers",
                  color: "#f0b800",
                  icon: Crown,
                },
                {
                  label: "Picks Today",
                  value: picksData?.picks?.length ?? "—",
                  sub: "AI picks generated",
                  color: "#d4a017",
                  icon: Activity,
                },
                {
                  label: "Revenue MTD",
                  value: "—",
                  sub: "Month to date",
                  color: "#fbbf24",
                  icon: DollarSign,
                },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} style={statCard(stat.color)}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        style={{
                          color: "rgba(180,180,210,0.7)",
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {stat.label}
                      </span>
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "2rem",
                        color: stat.color,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        color: "rgba(140,140,170,0.7)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {stat.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Elevate to Admin */}
              <div style={cardStyle}>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#39ff14",
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Elevate User to Admin
                </h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={elevateEmail}
                    onChange={e => setElevateEmail(e.target.value)}
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
                <p
                  style={{
                    color: "rgba(140,140,170,0.6)",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Grants admin role + yearly subscription to the specified
                  email.
                </p>
              </div>

              {/* Platform Links */}
              <div style={cardStyle}>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#f0b800",
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    marginBottom: "1rem",
                  }}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Stripe Dashboard",
                      href: "https://dashboard.stripe.com",
                      color: "#d4a017",
                    },
                    {
                      label: "Admin Promos",
                      href: "/admin/promos",
                      color: "#39ff14",
                    },
                    {
                      label: "Feedback Analytics",
                      href: "/feedback-analytics",
                      color: "#f0b800",
                    },
                    {
                      label: "Subscription Mgmt",
                      href: "/subscription-management",
                      color: "#fbbf24",
                    },
                  ].map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
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
              <h3
                style={{
                  fontWeight: 700,
                  color: "#d4a017",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Recent AI Picks
              </h3>
              {picksData?.picks?.length ? (
                <div className="space-y-2">
                  {picksData.picks.map(pick => (
                    <div
                      key={pick.id}
                      className="flex items-center justify-between p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div>
                        <div
                          className="font-medium text-sm"
                          style={{ color: "white" }}
                        >
                          {pick.recommendation}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "rgba(140,140,170,0.7)" }}
                        >
                          {pick.sportKey} · {pick.pickType} · {pick.odds}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="px-2 py-0.5 text-xs font-bold"
                          style={{
                            background:
                              (pick.confidenceScore ?? 0) >= 75
                                ? "rgba(57,255,20,0.15)"
                                : "rgba(251,191,36,0.15)",
                            border: `1px solid ${(pick.confidenceScore ?? 0) >= 75 ? "rgba(57,255,20,0.3)" : "rgba(251,191,36,0.3)"}`,
                            borderRadius: "4px",
                            color:
                              (pick.confidenceScore ?? 0) >= 75
                                ? "#39ff14"
                                : "#fbbf24",
                          }}
                        >
                          {pick.confidenceScore}% CONF
                        </div>
                        <div
                          className="px-2 py-0.5 text-xs font-bold"
                          style={{
                            background:
                              pick.tier === "free"
                                ? "rgba(140,140,170,0.1)"
                                : "rgba(212,160,23,0.15)",
                            border: `1px solid ${pick.tier === "free" ? "rgba(140,140,170,0.2)" : "rgba(212,160,23,0.3)"}`,
                            borderRadius: "4px",
                            color:
                              pick.tier === "free"
                                ? "rgba(180,180,210,0.7)"
                                : "#d4a017",
                          }}
                        >
                          {pick.tier?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "rgba(140,140,170,0.6)",
                    fontSize: "0.875rem",
                  }}
                >
                  No picks found.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3
                style={{
                  fontWeight: 700,
                  color: "#39ff14",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                }}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Members ({usersData?.total ?? "…"})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchUsers()}
                  className="p-1.5 rounded"
                  style={{
                    background: "rgba(57,255,20,0.1)",
                    border: "1px solid rgba(57,255,20,0.2)",
                    color: "#39ff14",
                    cursor: "pointer",
                  }}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Search
                  className="w-4 h-4"
                  style={{ color: "rgba(140,140,170,0.6)" }}
                />
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
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
              <div
                className="p-8 text-center"
                style={{ color: "rgba(140,140,170,0.6)" }}
              >
                <RefreshCw
                  className="w-6 h-6 mx-auto mb-2 animate-spin"
                  style={{ color: "#39ff14" }}
                />
                Loading members...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(57,255,20,0.15)",
                        }}
                      >
                        {[
                          "Name",
                          "Email",
                          "Tier",
                          "Role",
                          "Bets",
                          "Joined",
                          "Actions",
                        ].map(h => (
                          <th
                            key={h}
                            className="text-left py-2 px-3"
                            style={{
                              color: "rgba(140,140,170,0.7)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(usersData?.users ?? [])
                        .filter(
                          u =>
                            !searchEmail ||
                            u.email
                              ?.toLowerCase()
                              .includes(searchEmail.toLowerCase())
                        )
                        .map(u => (
                          <tr
                            key={u.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                            className="hover:bg-white/[0.02]"
                          >
                            <td
                              className="py-2 px-3"
                              style={{ color: "white", fontWeight: 500 }}
                            >
                              {u.name || "—"}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(180,180,210,0.8)" }}
                            >
                              {u.email}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                defaultValue={u.subscriptionTier || "free"}
                                onChange={e =>
                                  updateTierMutation.mutate({
                                    userId: u.id,
                                    subscriptionTier: e.target.value as any,
                                  })
                                }
                                className="text-xs px-2 py-0.5"
                                style={{
                                  background: "rgba(57,255,20,0.1)",
                                  border: "1px solid rgba(57,255,20,0.25)",
                                  borderRadius: "4px",
                                  color: "#39ff14",
                                  cursor: "pointer",
                                }}
                              >
                                {[
                                  "free",
                                  "trial",
                                  "daily",
                                  "monthly",
                                  "yearly",
                                ].map(t => (
                                  <option
                                    key={t}
                                    value={t}
                                    style={{
                                      background: "#0c0c16",
                                      color: "white",
                                    }}
                                  >
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className="text-xs px-2 py-0.5"
                                style={{
                                  background:
                                    u.role === "admin"
                                      ? "rgba(212,160,23,0.15)"
                                      : "rgba(255,255,255,0.05)",
                                  border: `1px solid ${u.role === "admin" ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.1)"}`,
                                  borderRadius: "4px",
                                  color:
                                    u.role === "admin"
                                      ? "#d4a017"
                                      : "rgba(180,180,210,0.7)",
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,140,170,0.7)" }}
                            >
                              {u.totalBets ?? 0}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{
                                color: "rgba(140,140,170,0.6)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => {
                                  setElevateEmail(u.email || "");
                                  setActiveTab("overview");
                                }}
                                className="text-xs px-2 py-0.5"
                                style={{
                                  background: "rgba(57,255,20,0.08)",
                                  border: "1px solid rgba(57,255,20,0.2)",
                                  borderRadius: "4px",
                                  color: "#39ff14",
                                  cursor: "pointer",
                                }}
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
                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span
                      style={{
                        color: "rgba(140,140,170,0.6)",
                        fontSize: "0.8rem",
                      }}
                    >
                      Showing {userPage * PAGE_SIZE + 1}–
                      {Math.min(
                        (userPage + 1) * PAGE_SIZE,
                        usersData?.total ?? 0
                      )}{" "}
                      of {usersData?.total} members
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserPage(p => Math.max(0, p - 1))}
                        disabled={userPage === 0}
                        className="px-3 py-1 text-xs"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "4px",
                          color: "white",
                          cursor: userPage === 0 ? "not-allowed" : "pointer",
                          opacity: userPage === 0 ? 0.4 : 1,
                        }}
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setUserPage(p => p + 1)}
                        disabled={
                          (userPage + 1) * PAGE_SIZE >= (usersData?.total ?? 0)
                        }
                        className="px-3 py-1 text-xs"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "4px",
                          color: "white",
                          cursor:
                            (userPage + 1) * PAGE_SIZE >=
                            (usersData?.total ?? 0)
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            (userPage + 1) * PAGE_SIZE >=
                            (usersData?.total ?? 0)
                              ? 0.4
                              : 1,
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Stripe link remains */}
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                style={{
                  color: "rgba(140,140,170,0.5)",
                  fontSize: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                For payment history and subscription management:
              </p>
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
              <h3
                style={{
                  fontWeight: 700,
                  color: "#f0b800",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                <Crown className="w-4 h-4 inline mr-2" />
                Subscription Tiers
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    tier: "Basic",
                    price: "$9.99/mo",
                    color: "#f0b800",
                    features: ["All AI picks", "Basic tools", "Live scores"],
                  },
                  {
                    tier: "Pro",
                    price: "$19.99/mo",
                    color: "#39ff14",
                    features: [
                      "All Basic features",
                      "+EV Finder",
                      "Arbitrage",
                      "Parlay Builder",
                      "CLV Tracker",
                      "Bankroll Tracker",
                    ],
                  },
                  {
                    tier: "Elite",
                    price: "$59.99/yr",
                    color: "#d4a017",
                    features: [
                      "All Pro features",
                      "Priority support",
                      "Best value",
                    ],
                  },
                ].map(plan => (
                  <div
                    key={plan.tier}
                    className="p-4"
                    style={{
                      background: `${plan.color}08`,
                      border: `1px solid ${plan.color}25`,
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: plan.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {plan.tier}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.5rem",
                        color: "white",
                        margin: "0.5rem 0",
                      }}
                    >
                      {plan.price}
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map(f => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "rgba(180,180,210,0.8)" }}
                        >
                          <CheckCircle2
                            className="w-3 h-3 flex-shrink-0"
                            style={{ color: plan.color }}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3
                style={{
                  fontWeight: 700,
                  color: "#fbbf24",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Stripe Management
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    label: "View All Subscriptions",
                    href: "https://dashboard.stripe.com/subscriptions",
                    desc: "Active, canceled, and past due",
                  },
                  {
                    label: "View Payments",
                    href: "https://dashboard.stripe.com/payments",
                    desc: "All payment history",
                  },
                  {
                    label: "Manage Products",
                    href: "https://dashboard.stripe.com/products",
                    desc: "Edit prices and plans",
                  },
                  {
                    label: "Webhook Logs",
                    href: "https://dashboard.stripe.com/webhooks",
                    desc: "Monitor webhook delivery",
                  },
                ].map(link => (
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
                    <TrendingUp
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#fbbf24" }}
                    />
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "#fbbf24" }}
                      >
                        {link.label}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(140,140,170,0.6)" }}
                      >
                        {link.desc}
                      </div>
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
              <h3
                style={{
                  fontWeight: 700,
                  color: "#d4a017",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                }}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                AI Picks Engine
              </h3>
              <div
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold"
                style={{
                  background: "rgba(57,255,20,0.1)",
                  border: "1px solid rgba(57,255,20,0.3)",
                  borderRadius: "4px",
                  color: "#39ff14",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                SCHEDULER ACTIVE
              </div>
            </div>
            <div className="space-y-3">
              <div
                className="p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="text-sm font-medium mb-1"
                  style={{ color: "white" }}
                >
                  Daily Picks Generation
                </div>
                <p
                  style={{
                    color: "rgba(140,140,170,0.7)",
                    fontSize: "0.8rem",
                    lineHeight: 1.6,
                  }}
                >
                  Picks are auto-generated daily at 6:00 AM PT via the
                  scheduler. Uses Claude for deep qualitative analysis and
                  OpenAI for concise summaries. Weather data from Open-Meteo is
                  factored in for NFL and MLB games.
                </p>
              </div>
              <div
                className="p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="text-sm font-medium mb-1"
                  style={{ color: "white" }}
                >
                  Supported Sports
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "NFL",
                    "NBA",
                    "MLB",
                    "NHL",
                    "NCAAF",
                    "NCAAB",
                    "MMA/UFC",
                    "Soccer",
                  ].map(sport => (
                    <span
                      key={sport}
                      className="px-2 py-0.5 text-xs font-bold"
                      style={{
                        background: "rgba(212,160,23,0.15)",
                        border: "1px solid rgba(212,160,23,0.3)",
                        borderRadius: "4px",
                        color: "#d4a017",
                      }}
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "white" }}
                >
                  Recent Picks
                </div>
                {picksData?.picks?.slice(0, 5).map(pick => (
                  <div
                    key={pick.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="text-sm"
                      style={{ color: "rgba(200,200,220,0.8)" }}
                    >
                      {pick.recommendation}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#39ff14" }}>
                        {pick.confidenceScore}%
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "rgba(140,140,170,0.6)" }}
                      >
                        {pick.sportKey}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Broadcast Push */}
            <div style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" style={{ color: "#39ff14" }} />
                <h3 style={{ fontWeight: 700, color: "white" }}>
                  Broadcast Push
                </h3>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Title (e.g. 🔥 Breaking: Injury alert)"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                />
                <textarea
                  placeholder="Message body"
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30 resize-none"
                />
                <input
                  placeholder="URL (optional, e.g. /picks)"
                  value={broadcastUrl}
                  onChange={e => setBroadcastUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                />
                <button
                  onClick={() =>
                    broadcastPush.mutate({
                      title: broadcastTitle,
                      body: broadcastBody,
                      url: broadcastUrl || undefined,
                      saveAsAlert: true,
                    })
                  }
                  disabled={
                    broadcastPush.isPending || !broadcastTitle || !broadcastBody
                  }
                  className="w-full py-2 text-sm font-bold rounded flex items-center justify-center gap-2"
                  style={{
                    background: broadcastPush.isPending
                      ? "rgba(57,255,20,0.2)"
                      : "rgba(57,255,20,0.15)",
                    border: "1px solid rgba(57,255,20,0.4)",
                    color: "#39ff14",
                  }}
                >
                  <Send className="w-4 h-4" />{" "}
                  {broadcastPush.isPending ? "Sending..." : "Send Push to All"}
                </button>
              </div>
            </div>

            {/* Email Blast */}
            <div style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5" style={{ color: "#d4a017" }} />
                <h3 style={{ fontWeight: 700, color: "white" }}>Email Blast</h3>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Subject line"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                />
                <textarea
                  placeholder="HTML body (paste full HTML or plain text)"
                  value={emailHtml}
                  onChange={e => setEmailHtml(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30 resize-none font-mono text-xs"
                />
                <button
                  onClick={() =>
                    emailBlast.mutate({
                      subject: emailSubject,
                      htmlBody: emailHtml,
                    })
                  }
                  disabled={emailBlast.isPending || !emailSubject || !emailHtml}
                  className="w-full py-2 text-sm font-bold rounded flex items-center justify-center gap-2"
                  style={{
                    background: emailBlast.isPending
                      ? "rgba(212,160,23,0.2)"
                      : "rgba(212,160,23,0.15)",
                    border: "1px solid rgba(212,160,23,0.4)",
                    color: "#d4a017",
                  }}
                >
                  <Send className="w-4 h-4" />{" "}
                  {emailBlast.isPending
                    ? "Sending..."
                    : "Send Email to All Subscribers"}
                </button>
              </div>
            </div>

            {/* Announcement Bar */}
            <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5" style={{ color: "#a78bfa" }} />
                <h3 style={{ fontWeight: 700, color: "white" }}>
                  Site Announcement Bar
                </h3>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="space-y-3">
                  <input
                    placeholder="Announcement title"
                    value={announcementTitle}
                    onChange={e => setAnnouncementTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                  />
                  <input
                    placeholder="Body (optional)"
                    value={announcementBody}
                    onChange={e => setAnnouncementBody(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white placeholder:text-white/30"
                  />
                  <select
                    value={announcementType}
                    onChange={e =>
                      setAnnouncementType(
                        e.target.value as typeof announcementType
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-white/10 text-white"
                  >
                    <option value="info">Info (blue)</option>
                    <option value="success">Success (green)</option>
                    <option value="warning">Warning (amber)</option>
                    <option value="promo">Promo (purple gradient)</option>
                  </select>
                  <button
                    onClick={() =>
                      createAnnouncement.mutate({
                        title: announcementTitle,
                        body: announcementBody,
                        type: announcementType,
                      })
                    }
                    disabled={
                      createAnnouncement.isPending || !announcementTitle
                    }
                    className="w-full py-2 text-sm font-bold rounded flex items-center justify-center gap-2"
                    style={{
                      background: "rgba(167,139,250,0.15)",
                      border: "1px solid rgba(167,139,250,0.4)",
                      color: "#a78bfa",
                    }}
                  >
                    <Megaphone className="w-4 h-4" />{" "}
                    {createAnnouncement.isPending
                      ? "Creating..."
                      : "Post Announcement"}
                  </button>
                </div>
                <div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: "rgba(140,140,170,0.7)" }}
                  >
                    Active announcements:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(announcementsList ?? []).length === 0 ? (
                      <p
                        className="text-xs"
                        style={{ color: "rgba(140,140,170,0.4)" }}
                      >
                        None
                      </p>
                    ) : (
                      (announcementsList ?? []).map(a => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 p-2 rounded"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {a.title}
                            </p>
                            <p
                              className="text-xs"
                              style={{
                                color: a.isActive
                                  ? "#39ff14"
                                  : "rgba(140,140,170,0.5)",
                              }}
                            >
                              {a.isActive ? "Active" : "Inactive"} · {a.type}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              deleteAnnouncement.mutate({ id: a.id })
                            }
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: "rgba(255,59,48,0.15)",
                              border: "1px solid rgba(255,59,48,0.3)",
                              color: "#ff3b30",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* PageSpeed Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div style={cardStyle}>
              <h3
                style={{
                  color: "#39ff14",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                Google PageSpeed Insights
              </h3>
              <div className="flex gap-3 mb-4">
                <input
                  value={psUrl}
                  onChange={e => setPsUrl(e.target.value)}
                  placeholder="https://www.chalkpicks.live"
                  className="flex-1 px-3 py-2 rounded text-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                  }}
                />
                <button
                  onClick={() => psAudit.mutate({ url: psUrl })}
                  disabled={psAudit.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded transition-all"
                  style={{
                    background: psAudit.isPending
                      ? "rgba(57,255,20,0.3)"
                      : "rgba(57,255,20,0.15)",
                    border: "1px solid rgba(57,255,20,0.4)",
                    color: "#39ff14",
                    cursor: psAudit.isPending ? "wait" : "pointer",
                  }}
                >
                  {psAudit.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Running...
                    </>
                  ) : (
                    <>
                      <Gauge className="w-4 h-4" /> Run Audit
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>
                Runs both mobile and desktop Lighthouse audits via Google's API.
                Takes ~15-30 seconds.
              </p>
            </div>

            {psResult &&
              (() => {
                const r = psResult as {
                  mobile: {
                    scores: Record<string, number>;
                    cwv: Record<string, string | null>;
                    failingAudits: {
                      id: string;
                      title: string;
                      score: number | null;
                      displayValue: string | null;
                    }[];
                    fetchTime: string;
                  };
                  desktop: {
                    scores: Record<string, number>;
                    cwv: Record<string, string | null>;
                    failingAudits: {
                      id: string;
                      title: string;
                      score: number | null;
                      displayValue: string | null;
                    }[];
                    fetchTime: string;
                  };
                };
                const scoreColor = (s: number) =>
                  s >= 90 ? "#39ff14" : s >= 50 ? "#f0b800" : "#ff4444";
                const scoreLabel = (s: number) =>
                  s >= 90 ? "Good" : s >= 50 ? "Needs Improvement" : "Poor";
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {(["mobile", "desktop"] as const).map(strat => {
                      const d = r[strat];
                      return (
                        <div key={strat} style={cardStyle}>
                          <h4
                            style={{
                              color: "rgba(200,200,220,0.9)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              fontSize: "0.85rem",
                              marginBottom: "1rem",
                            }}
                          >
                            {strat === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
                            {d.fetchTime && (
                              <span
                                style={{
                                  color: "rgba(140,140,170,0.5)",
                                  fontSize: "0.7rem",
                                  marginLeft: "0.5rem",
                                }}
                              >
                                {new Date(d.fetchTime).toLocaleTimeString()}
                              </span>
                            )}
                          </h4>
                          {/* Score grid */}
                          <div className="grid grid-cols-2 gap-3 mb-5">
                            {Object.entries(d.scores).map(([k, v]) => (
                              <div
                                key={k}
                                className="text-center p-3 rounded-lg"
                                style={{
                                  background: "rgba(0,0,0,0.3)",
                                  border: `1px solid ${scoreColor(v as number)}30`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "2rem",
                                    fontWeight: 800,
                                    color: scoreColor(v as number),
                                  }}
                                >
                                  {v}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "rgba(180,180,210,0.7)",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {k.replace(/([A-Z])/g, " $1")}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.65rem",
                                    color: scoreColor(v as number),
                                  }}
                                >
                                  {scoreLabel(v as number)}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Core Web Vitals */}
                          <div className="mb-4">
                            <p
                              style={{
                                color: "rgba(140,140,170,0.7)",
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Core Web Vitals
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(d.cwv)
                                .filter(([, v]) => v)
                                .map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="p-2 rounded text-center"
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      border:
                                        "1px solid rgba(255,255,255,0.06)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "0.85rem",
                                        fontWeight: 700,
                                        color: "white",
                                      }}
                                    >
                                      {v}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.65rem",
                                        color: "rgba(140,140,170,0.6)",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {k.toUpperCase()}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                          {/* Top failing audits */}
                          {d.failingAudits.length > 0 && (
                            <div>
                              <p
                                style={{
                                  color: "rgba(140,140,170,0.7)",
                                  fontSize: "0.75rem",
                                  textTransform: "uppercase",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Top Issues
                              </p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {d.failingAudits.map(a => (
                                  <div
                                    key={a.id}
                                    className="flex items-center justify-between gap-2 p-2 rounded"
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      border:
                                        "1px solid rgba(255,255,255,0.05)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "rgba(200,200,220,0.8)",
                                      }}
                                    >
                                      {a.title}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        color: scoreColor(
                                          Math.round((a.score ?? 0) * 100)
                                        ),
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {a.displayValue ??
                                        `${Math.round((a.score ?? 0) * 100)}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
          </div>
        )}

        {/* ─── Directories Tab ─── */}
        {activeTab === "directories" && <DirectoriesTab />}

        {/* ─── API Cache Tab ─── */}
        {activeTab === "cache" && <CacheTab />}
      </div>
    </div>
  );
}

/* ─── Directories Tab Component ─── */
function DirectoriesTab() {
  const [tierFilter, setTierFilter] = useLocalState("all");
  const [addOpen, setAddOpen] = useLocalState(false);
  const [newName, setNewName] = useLocalState("");
  const [newUrl, setNewUrl] = useLocalState("");
  const [newTier, setNewTier] = useLocalState("tier1");
  const [newDa, setNewDa] = useLocalState("");
  const [newNotes, setNewNotes] = useLocalState("");

  const utils = trpc.useUtils();
  const { data: submissions, isLoading } = trpc.directoryTracker.list.useQuery(
    tierFilter === "all" ? undefined : { tier: tierFilter as any }
  );
  const { data: stats } = trpc.directoryTracker.stats.useQuery();
  const updateStatus = trpc.directoryTracker.updateStatus.useMutation({
    onSuccess: () => {
      utils.directoryTracker.list.invalidate();
      utils.directoryTracker.stats.invalidate();
      toast.success("Status updated");
    },
  });
  const addSubmission = trpc.directoryTracker.add.useMutation({
    onSuccess: () => {
      utils.directoryTracker.list.invalidate();
      utils.directoryTracker.stats.invalidate();
      setAddOpen(false);
      setNewName("");
      setNewUrl("");
      setNewNotes("");
      toast.success("Directory added");
    },
  });
  const removeSubmission = trpc.directoryTracker.remove.useMutation({
    onSuccess: () => {
      utils.directoryTracker.list.invalidate();
      utils.directoryTracker.stats.invalidate();
      toast.success("Removed");
    },
  });

  const tierLabels: Record<string, string> = {
    tier1: "Tier 1 — High DA",
    tier2: "Tier 2 — AI Dirs",
    tier3: "Tier 3 — Startup",
    tier4: "Tier 4 — Niche",
    reddit: "Reddit",
    guest_post: "Guest Posts",
  };
  const statusColors: Record<string, string> = {
    not_started: "#6b7280",
    in_progress: "#f59e0b",
    submitted: "#3b82f6",
    verified: "#39ff14",
    rejected: "#ef4444",
  };

  const cardStyle = {
    background: "rgba(12,12,22,0.9)",
    border: "1px solid rgba(57,255,20,0.15)",
    borderRadius: "8px",
    padding: "1.5rem",
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          "not_started",
          "in_progress",
          "submitted",
          "verified",
          "rejected",
        ].map(s => (
          <div
            key={s}
            style={{
              ...cardStyle,
              borderColor: `${statusColors[s]}40`,
              padding: "1rem",
            }}
          >
            <div
              style={{
                color: statusColors[s],
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            >
              {stats?.byStatus[s] ?? 0}
            </div>
            <div
              style={{
                color: "rgba(200,200,220,0.6)",
                fontSize: "0.75rem",
                textTransform: "capitalize",
              }}
            >
              {s.replace("_", " ")}
            </div>
          </div>
        ))}
      </div>

      {/* Positioning Copy */}
      <div style={{ ...cardStyle, borderColor: "rgba(245,158,11,0.3)" }}>
        <h4
          style={{ color: "#f59e0b", fontWeight: 700, marginBottom: "0.5rem" }}
        >
          Positioning Copy
        </h4>
        <p
          style={{
            color: "rgba(200,200,220,0.8)",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          <strong style={{ color: "white" }}>Tagline:</strong> AI-Powered Sports
          Betting Analytics with Cryptographically Verified Picks — +EV Finder,
          CLV Tracker, Steam Move Alerts
        </p>
        <p
          style={{
            color: "rgba(200,200,220,0.8)",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          <strong style={{ color: "white" }}>Short (150 chars):</strong> AI
          sports betting analytics with cryptographically verified picks. +EV
          finder, CLV tracker, steam move alerts. Free tier available.
        </p>
        <p style={{ color: "rgba(200,200,220,0.8)", fontSize: "0.85rem" }}>
          <strong style={{ color: "white" }}>Pricing:</strong> Basic $9.99/mo ·
          Pro $19.99/mo · Elite $59.99/yr
        </p>
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(57,255,20,0.2)",
            borderRadius: "6px",
            color: "white",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
          }}
        >
          <option value="all">All Tiers</option>
          {Object.entries(tierLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAddOpen(!addOpen)}
          style={{
            background: "rgba(57,255,20,0.15)",
            border: "1px solid rgba(57,255,20,0.3)",
            borderRadius: "6px",
            color: "#39ff14",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          + Add Directory
        </button>
      </div>

      {/* Add Form */}
      {addOpen && (
        <div
          style={cardStyle}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            placeholder="Directory Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.5rem",
              color: "white",
              fontSize: "0.85rem",
            }}
          />
          <input
            placeholder="URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.5rem",
              color: "white",
              fontSize: "0.85rem",
            }}
          />
          <select
            value={newTier}
            onChange={e => setNewTier(e.target.value)}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.5rem",
              color: "white",
              fontSize: "0.85rem",
            }}
          >
            {Object.entries(tierLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            placeholder="DA (optional)"
            value={newDa}
            onChange={e => setNewDa(e.target.value)}
            type="number"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.5rem",
              color: "white",
              fontSize: "0.85rem",
            }}
          />
          <input
            placeholder="Notes"
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            className="sm:col-span-2"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.5rem",
              color: "white",
              fontSize: "0.85rem",
            }}
          />
          <button
            onClick={() => {
              if (!newName || !newUrl)
                return toast.error("Name and URL required");
              addSubmission.mutate({
                name: newName,
                url: newUrl,
                tier: newTier as any,
                domainAuthority: newDa ? parseInt(newDa) : null,
                notes: newNotes || undefined,
              });
            }}
            style={{
              background: "rgba(57,255,20,0.2)",
              border: "1px solid rgba(57,255,20,0.4)",
              borderRadius: "6px",
              color: "#39ff14",
              padding: "0.5rem 1.5rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {addSubmission.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {/* Submissions Table */}
      {isLoading ? (
        <div
          style={{
            color: "rgba(200,200,220,0.6)",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          Loading...
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: "0", overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(57,255,20,0.1)" }}>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Directory
                </th>
                <th
                  style={{
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  DA
                </th>
                <th
                  style={{
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Tier
                </th>
                <th
                  style={{
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Notes
                </th>
                <th
                  style={{
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    color: "rgba(200,200,220,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(submissions ?? []).map(sub => (
                <tr
                  key={sub.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td style={{ padding: "0.6rem 1rem" }}>
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", textDecoration: "none" }}
                    >
                      {sub.name}
                    </a>
                  </td>
                  <td
                    style={{
                      padding: "0.6rem 0.5rem",
                      textAlign: "center",
                      color: sub.domainAuthority
                        ? "#f59e0b"
                        : "rgba(200,200,220,0.3)",
                    }}
                  >
                    {sub.domainAuthority ?? "—"}
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", textAlign: "center" }}>
                    <span
                      style={{
                        background: "rgba(57,255,20,0.1)",
                        border: "1px solid rgba(57,255,20,0.2)",
                        borderRadius: "4px",
                        padding: "0.15rem 0.5rem",
                        fontSize: "0.75rem",
                        color: "#39ff14",
                      }}
                    >
                      {sub.tier.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", textAlign: "center" }}>
                    <select
                      value={sub.status}
                      onChange={e =>
                        updateStatus.mutate({
                          id: sub.id,
                          status: e.target.value as any,
                        })
                      }
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: `1px solid ${statusColors[sub.status]}50`,
                        borderRadius: "4px",
                        color: statusColors[sub.status],
                        padding: "0.2rem 0.4rem",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td
                    style={{
                      padding: "0.6rem 1rem",
                      color: "rgba(200,200,220,0.6)",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub.notes || "—"}
                  </td>
                  <td style={{ padding: "0.6rem 0.5rem", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${sub.name}?`))
                          removeSubmission.mutate({ id: sub.id });
                      }}
                      style={{
                        color: "#ef4444",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        fontSize: "0.8rem",
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── API Cache Tab Component ─── */
function CacheTab() {
  const { data: stats, refetch } = trpc.admin.getCacheStats.useQuery(
    undefined,
    {
      refetchInterval: 10_000,
    }
  );
  const purgeAll = trpc.admin.purgeAllCache.useMutation({
    onSuccess: () => {
      toast.success("All cache purged");
      refetch();
    },
  });
  const purgeSport = trpc.admin.purgeSportCache.useMutation({
    onSuccess: d => {
      toast.success(d.message);
      refetch();
    },
  });
  const resetQuota = trpc.admin.resetQuota.useMutation({
    onSuccess: () => {
      toast.success("Quota counter reset");
      refetch();
    },
  });

  if (!stats)
    return <div className="text-muted-foreground">Loading cache stats...</div>;

  const hitRate =
    stats.hitRate.total > 0
      ? Math.round(
          ((stats.hitRate.l1Hits + stats.hitRate.l2Hits) /
            stats.hitRate.total) *
            100
        )
      : 0;

  const quotaPct =
    stats.quotaLimit > 0
      ? Math.round((stats.quotaUsed / stats.quotaLimit) * 100)
      : 0;

  const sports = [
    "americanfootball_nfl",
    "basketball_nba",
    "baseball_mlb",
    "icehockey_nhl",
    "soccer_epl",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Odds API Cache</h2>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
          <button
            onClick={() => purgeAll.mutate()}
            disabled={purgeAll.isPending}
            className="px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-900 text-sm text-red-300"
          >
            Purge All
          </button>
          <button
            onClick={() => resetQuota.mutate()}
            disabled={resetQuota.isPending}
            className="px-3 py-1.5 rounded bg-amber-900/50 hover:bg-amber-900 text-sm text-amber-300"
          >
            Reset Quota
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
          <div className="text-2xl font-bold text-green-400">{hitRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            L1: {stats.hitRate.l1Hits} | L2: {stats.hitRate.l2Hits} | Miss:{" "}
            {stats.hitRate.misses}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Quota Used</div>
          <div
            className={`text-2xl font-bold ${quotaPct > 80 ? "text-red-400" : quotaPct > 50 ? "text-amber-400" : "text-green-400"}`}
          >
            {stats.quotaUsed}/{stats.quotaLimit}
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${quotaPct > 80 ? "bg-red-500" : quotaPct > 50 ? "bg-amber-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(quotaPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Memory Entries</div>
          <div className="text-2xl font-bold">{stats.memoryEntries}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Max: {stats.maxMemoryEntries}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Mode</div>
          <div
            className={`text-2xl font-bold ${stats.conservationMode ? "text-amber-400" : "text-green-400"}`}
          >
            {stats.conservationMode ? "Conservation" : "Normal"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            TTL: {Math.round(stats.currentTtlMs / 1000 / 60)}min | Deduped:{" "}
            {stats.deduplicatedRequests}
          </div>
        </div>
      </div>

      {/* Conservation Mode Alert */}
      {stats.conservationMode && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-amber-300">
              Conservation Mode Active
            </div>
            <div className="text-sm text-amber-200/70 mt-1">
              Quota is below 20% remaining. Cache TTL has been extended to 30
              minutes to preserve remaining API calls. Stale data will be served
              when possible.
            </div>
          </div>
        </div>
      )}

      {/* Sport-level Purge */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Purge by Sport</h3>
        <div className="flex flex-wrap gap-2">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => purgeSport.mutate({ sport })}
              disabled={purgeSport.isPending}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              {sport.split("_").pop()?.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
        <h3 className="font-semibold text-foreground">How it works</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>L1 (Memory):</strong> In-process cache, fastest. Cleared on
            restart.
          </li>
          <li>
            <strong>L2 (Database):</strong> Persistent cache, survives restarts.
            Shared across instances.
          </li>
          <li>
            <strong>Stale-While-Revalidate:</strong> Serves stale data instantly
            while refreshing in background (up to 60min stale).
          </li>
          <li>
            <strong>Request Deduplication:</strong> Concurrent identical
            requests coalesce into a single API call.
          </li>
          <li>
            <strong>Conservation Mode:</strong> Activates at &lt;20% quota
            remaining. Extends TTL from 5min to 30min.
          </li>
          <li>
            <strong>Circuit Breaker:</strong> At 0 remaining quota, only stale
            data is served (no new API calls).
          </li>
        </ul>
        {stats.lastApiCall && (
          <p className="mt-2">
            Last API call: {new Date(stats.lastApiCall).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
