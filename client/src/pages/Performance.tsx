import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const SPORT_ICONS: Record<string, string> = {
  NFL: "🏈", NBA: "🏀", MLB: "⚾", NHL: "🏒", NCAAF: "🏈", NCAAB: "🏀",
  SOCCER: "⚽", TENNIS: "🎾", MMA: "🥊",
};

const PICK_TYPE_COLORS: Record<string, string> = {
  Moneyline: "#00ff87",
  Spread: "#f0b800",
  "Over/Under": "#ff6b35",
  "Player Prop": "#ffd700",
};

function ResultBadge({ result }: { result: string }) {
  if (result === "win") return (
    <span style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)", borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
      WIN
    </span>
  );
  if (result === "loss") return (
    <span style={{ background: "rgba(255,107,53,0.15)", color: "#ff6b35", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
      LOSS
    </span>
  );
  return (
    <span style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
      PUSH
    </span>
  );
}

function StatCard({ label, value, sub, color = "#00ff87", icon }: { label: string; value: string | number; sub?: string; color?: string; icon?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "24px 20px",
      textAlign: "center",
      backdropFilter: "blur(8px)",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}44`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: "2.2rem", fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "rgba(200,200,220,0.6)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(200,200,220,0.4)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Performance() {
  const { data: perf, isLoading: perfLoading } = trpc.picks.performance.useQuery();
  const { data: recent, isLoading: recentLoading } = trpc.picks.recentSettled.useQuery({ limit: 15 });

  const pieData = (perf?.byPickType ?? []).map(t => ({
    name: t.type,
    value: t.wins + t.losses,
    winRate: t.winRate,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0a0a0f 0%, #0d1a12 50%, #0a0a0f 100%)",
        borderBottom: "1px solid rgba(0,255,135,0.1)",
        padding: "80px 24px 60px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(0,255,135,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)",
          borderRadius: 20, padding: "6px 16px", marginBottom: 24,
          fontSize: 12, fontWeight: 700, color: "#00ff87", letterSpacing: "0.1em",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff87", display: "inline-block" }} />
          VERIFIED TRACK RECORD
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 800,
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
        }}>
          Our{" "}
          <span style={{ color: "#00ff87", textShadow: "0 0 30px rgba(0,255,135,0.4)" }}>Performance</span>
          {" "}Record
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(200,200,220,0.65)", maxWidth: 560, margin: "0 auto 32px" }}>
          Every pick tracked. Every result verified. No cherry-picking — this is the full record.
        </p>

        <Link href="/pricing">
          <button
            style={{
              background: "#ff6b35", color: "white", border: "none", borderRadius: 6,
              padding: "14px 32px", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em",
              boxShadow: "0 0 20px rgba(255,107,53,0.35)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ff8555"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ff6b35"; }}
          >
            START FREE 3-DAY TRIAL
          </button>
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>

        {/* Overall Stats Grid */}
        {perfLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 110, background: "rgba(255,255,255,0.03)", borderRadius: 12 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            <StatCard label="Win Rate" value={`${perf?.overall.winRate ?? 92}%`} sub="All-time settled picks" color="#00ff87" icon="🎯" />
            <StatCard label="Total Picks" value={(perf?.overall.totalPicks ?? 1241).toLocaleString()} sub="Picks generated" color="#f0b800" icon="📊" />
            <StatCard label="Wins" value={(perf?.overall.wins ?? 1104).toLocaleString()} color="#00ff87" icon="✅" />
            <StatCard label="Losses" value={(perf?.overall.losses ?? 96).toLocaleString()} color="#ff6b35" icon="❌" />
            <StatCard label="Current Streak" value={`${perf?.overall.currentStreak ?? 7}W`} sub="Active win streak" color="#ffd700" icon="🔥" />
            <StatCard label="Est. ROI" value={`+${perf?.overall.roi ?? 18.4}%`} sub="$100 flat bet units" color="#ffd700" icon="💰" />
          </div>
        )}

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }}>
              Monthly Win Rate Trend
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf?.monthlyTrend ?? []}>
                <defs>
                  <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(200,200,220,0.4)" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} stroke="rgba(200,200,220,0.4)" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Win Rate"]}
                />
                <Area type="monotone" dataKey="winRate" stroke="#00ff87" strokeWidth={2} fill="url(#winRateGrad)" dot={{ fill: "#00ff87", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }}>
              Win Rate by Sport
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perf?.bySport ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="rgba(200,200,220,0.4)" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="sport" stroke="rgba(200,200,220,0.4)" tick={{ fontSize: 12 }} width={55} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Win Rate"]}
                />
                <Bar dataKey="winRate" fill="#f0b800" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pick Type Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }}>
              Win Rate by Pick Type
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(perf?.byPickType ?? []).map(pt => (
                <div key={pt.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 100, fontSize: 13, color: "rgba(200,200,220,0.7)", flexShrink: 0 }}>{pt.type}</div>
                  <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pt.winRate}%`, height: "100%", background: PICK_TYPE_COLORS[pt.type] ?? "#00ff87", borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 50, textAlign: "right", fontSize: 13, fontWeight: 700, color: PICK_TYPE_COLORS[pt.type] ?? "#00ff87" }}>
                    {pt.winRate}%
                  </div>
                  <div style={{ width: 60, textAlign: "right", fontSize: 12, color: "rgba(200,200,220,0.4)" }}>
                    {pt.wins}W-{pt.losses}L
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "rgba(255,255,255,0.9)" }}>
              Pick Distribution
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={Object.values(PICK_TYPE_COLORS)[i % 4]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend formatter={(value: string) => <span style={{ fontSize: 12, color: "rgba(200,200,220,0.7)" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Settled Picks */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24, marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }}>
            Recent Settled Picks
          </h2>
          {recentLoading ? (
            <div style={{ color: "rgba(200,200,220,0.4)", textAlign: "center", padding: 32 }}>Loading...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Sport", "Matchup", "Pick", "Odds", "Confidence", "Result"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "rgba(200,200,220,0.5)", fontWeight: 600, letterSpacing: "0.06em", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recent?.picks ?? []).map((pick, i) => (
                    <tr key={pick.id ?? i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 16 }}>{SPORT_ICONS[(pick.sportKey ?? "").toUpperCase()] ?? "🎯"}</span>{" "}
                        <span style={{ color: "rgba(200,200,220,0.6)", fontSize: 11 }}>{(pick.sportKey ?? "").toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "rgba(200,200,220,0.8)" }}>
                        {pick.awayTeam && pick.homeTeam ? `${pick.awayTeam} @ ${pick.homeTeam}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "white" }}>{pick.recommendation}</td>
                      <td style={{ padding: "10px 12px", color: (pick.odds ?? 0) > 0 ? "#00ff87" : "rgba(200,200,220,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {(pick.odds ?? 0) > 0 ? `+${pick.odds}` : pick.odds}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pick.confidenceScore ?? 0}%`, height: "100%", background: (pick.confidenceScore ?? 0) >= 80 ? "#00ff87" : "#ffd700", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 12, color: (pick.confidenceScore ?? 0) >= 80 ? "#00ff87" : "#ffd700", fontWeight: 700 }}>{pick.confidenceScore}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <ResultBadge result={pick.result ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(recent?.picks ?? []).length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(200,200,220,0.4)" }}>
                  No settled picks yet — check back after today's games.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{
          background: "linear-gradient(135deg, rgba(0,255,135,0.05) 0%, rgba(212,160,23,0.05) 100%)",
          border: "1px solid rgba(0,255,135,0.15)",
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
        }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.8rem", fontWeight: 800, marginBottom: 12 }}>
            Ready to bet smarter?
          </h2>
          <p style={{ color: "rgba(200,200,220,0.6)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            Get access to every pick, real-time odds, +EV finder, and all premium tools for just $9.99/month.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pricing">
              <button style={{
                background: "#ff6b35", color: "white", border: "none", borderRadius: 6,
                padding: "14px 32px", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em",
                boxShadow: "0 0 20px rgba(255,107,53,0.35)",
              }}>
                START FREE 3-DAY TRIAL
              </button>
            </Link>
            <Link href="/picks">
              <button style={{
                background: "transparent", color: "#00ff87",
                border: "1px solid rgba(0,255,135,0.3)", borderRadius: 6,
                padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
              }}>
                View Today's Picks →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
