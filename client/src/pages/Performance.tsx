import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowRight, Trophy, Target, TrendingUp, Flame, Shield, CheckCircle2 } from "lucide-react";
import ConfidenceBar from "@/components/ConfidenceBar";

const SPORT_ICONS: Record<string, string> = {
  NFL: "🏈", NBA: "🏀", MLB: "⚾", NHL: "🏒", NCAAF: "🏈", NCAAB: "🏀",
  SOCCER: "⚽", TENNIS: "🎾", MMA: "🥊",
};

const PICK_TYPE_COLORS: Record<string, string> = {
  Moneyline: "#39ff14",
  Spread: "#f0b800",
  "Over/Under": "#60a5fa",
  "Player Prop": "#a855f7",
};

function ResultBadge({ result }: { result: string }) {
  if (result === "win") return (
    <span className="badge-win px-2.5 py-0.5 text-[11px] font-bold tracking-wider">WIN</span>
  );
  if (result === "loss") return (
    <span className="badge-loss px-2.5 py-0.5 text-[11px] font-bold tracking-wider">LOSS</span>
  );
  return (
    <span className="badge-push px-2.5 py-0.5 text-[11px] font-bold tracking-wider">PUSH</span>
  );
}

function StatCard({ label, value, sub, color = "#39ff14", icon: Icon }: { label: string; value: string | number; sub?: string; color?: string; icon: React.ElementType }) {
  return (
    <NeonCard className="p-6 text-center">
      <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-xl" style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="font-display text-3xl mb-1" style={{ color }}>{value}</div>
      <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </NeonCard>
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[radial-gradient(ellipse,rgba(57,255,20,0.05)_0%,transparent_60%)]" />
        </div>
        <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full glass-card-static text-xs font-semibold">
            <span className="live-dot" />
            <span className="text-white/60">Verified Track Record</span>
          </div>

          <h1 className="font-display text-white mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
            Our{" "}
            <span className="text-emerald-gradient">Performance</span>
            {" "}Record
          </h1>
          <p className="text-lg text-white/45 max-w-xl mx-auto mb-8">
            Every pick tracked. Every result verified. No cherry-picking — this is the full record.
          </p>

          <Link href="/pricing">
            <button className="btn-premium">
              Start Free 3-Day Trial <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      <div className="container pb-20">

        {/* Overall Stats Grid */}
        {perfLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[130px] skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <StatCard label="Win Rate" value={`${perf?.overall.winRate ?? 0}%`} sub="All-time settled" color="#39ff14" icon={Target} />
            <StatCard label="Total Picks" value={(perf?.overall.totalPicks ?? 0).toLocaleString()} sub="Generated" color="#f0b800" icon={TrendingUp} />
            <StatCard label="Wins" value={(perf?.overall.wins ?? 0).toLocaleString()} color="#39ff14" icon={Trophy} />
            <StatCard label="Losses" value={(perf?.overall.losses ?? 0).toLocaleString()} color="#ff3b3b" icon={Target} />
            <StatCard label="Streak" value={`${perf?.overall.currentStreak ?? 0}W`} sub="Active" color="#f0b800" icon={Flame} />
            <StatCard
              label="ROI"
              value={`${(perf?.overall.roi ?? 0) >= 0 ? "+" : ""}${perf?.overall.roi ?? 0}%`}
              sub="$100 flat bet"
              color="#a855f7"
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <NeonCard className="p-6" interactive={false}>
            <h2 className="font-display text-lg text-white mb-5">Monthly Win Rate Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf?.monthlyTrend ?? []}>
                <defs>
                  <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39ff14" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,10,15,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, backdropFilter: "blur(10px)" }}
                  formatter={(v: number) => [`${v}%`, "Win Rate"]}
                />
                <Area type="monotone" dataKey="winRate" stroke="#39ff14" strokeWidth={2} fill="url(#winRateGrad)" dot={{ fill: "#39ff14", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </NeonCard>

          <NeonCard className="p-6" interactive={false}>
            <h2 className="font-display text-lg text-white mb-5">Win Rate by Sport</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perf?.bySport ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="sport" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} width={55} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,10,15,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, backdropFilter: "blur(10px)" }}
                  formatter={(v: number) => [`${v}%`, "Win Rate"]}
                />
                <Bar dataKey="winRate" fill="#f0b800" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </NeonCard>
        </div>

        {/* Pick Type Breakdown */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          <NeonCard className="p-6" interactive={false}>
            <h2 className="font-display text-lg text-white mb-5">Win Rate by Pick Type</h2>
            <div className="space-y-4">
              {(perf?.byPickType ?? []).map(pt => (
                <div key={pt.type} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-white/60 flex-shrink-0">{pt.type}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${pt.winRate}%`, background: PICK_TYPE_COLORS[pt.type] ?? "#39ff14" }} />
                  </div>
                  <div className="w-12 text-right text-sm font-bold" style={{ color: PICK_TYPE_COLORS[pt.type] ?? "#39ff14" }}>
                    {pt.winRate}%
                  </div>
                  <div className="w-14 text-right text-xs text-white/35">
                    {pt.wins}W-{pt.losses}L
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>

          <NeonCard className="p-6" interactive={false}>
            <h2 className="font-display text-lg text-white mb-4">Pick Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={Object.values(PICK_TYPE_COLORS)[i % 4]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "rgba(10,10,15,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                />
                <Legend formatter={(value: string) => <span className="text-xs text-white/60">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </NeonCard>
        </div>

        {/* Recent Settled Picks */}
        <NeonCard className="p-6 mb-12" interactive={false}>
          <h2 className="font-display text-lg text-white mb-5">Recent Settled Picks</h2>
          {recentLoading ? (
            <div className="text-center py-8 text-white/30">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Sport", "Matchup", "Pick", "Odds", "Confidence", "Result"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase text-white/35">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recent?.picks ?? []).map((pick, i) => (
                    <tr
                      key={pick.id ?? i}
                      className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                      style={{
                        background: pick.result === "win" ? "rgba(57,255,20,0.02)" : pick.result === "loss" ? "rgba(255,59,59,0.02)" : "transparent",
                      }}
                    >
                      <td className="px-3 py-3">
                        <span className="text-base mr-1">{SPORT_ICONS[(pick.sportKey ?? "").toUpperCase()] ?? "🎯"}</span>
                        <span className="text-xs text-white/40">{(pick.sportKey ?? "").toUpperCase()}</span>
                      </td>
                      <td className="px-3 py-3 text-white/70">
                        {pick.awayTeam && pick.homeTeam ? `${pick.awayTeam} @ ${pick.homeTeam}` : "—"}
                      </td>
                      <td className="px-3 py-3 font-semibold text-white">{pick.recommendation}</td>
                      <td className="px-3 py-3 data-table" style={{ color: (pick.odds ?? 0) > 0 ? "var(--accent-mint)" : "rgba(255,255,255,0.5)" }}>
                        {(pick.odds ?? 0) > 0 ? `+${pick.odds}` : pick.odds}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ConfidenceBar score={pick.confidenceScore ?? 0} showLabel={false} height="h-1.5" className="w-10" />
                          <span className="data-table text-xs font-bold" style={{ color: (pick.confidenceScore ?? 0) >= 80 ? "var(--accent-cyan)" : "#f0b800" }}>{pick.confidenceScore}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <ResultBadge result={pick.result ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(recent?.picks ?? []).length === 0 && (
                <div className="text-center py-8 text-white/30">
                  No settled picks yet — check back after today's games.
                </div>
              )}
            </div>
          )}
        </NeonCard>

        {/* Methodology Section */}
        <div className="mb-12">
          <NeonCard className="p-8" interactive={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)' }}>
                <Shield className="w-5 h-5 text-[#39ff14]" />
              </div>
              <h2 className="font-display text-2xl text-white">How We Grade Picks</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Grading Rules</h3>
                <ul className="space-y-2.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" /> Picks are logged with a timestamp before game start — no retroactive edits</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" /> Results are auto-graded against the closing line from the originating sportsbook</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" /> Pushes count as no-action (excluded from W/L record)</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" /> ROI calculated on flat 1-unit sizing unless Kelly is specified</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Transparency Guarantees</h3>
                <ul className="space-y-2.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#60a5fa] mt-0.5 flex-shrink-0" /> Full pick history available to all members (free and paid)</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#60a5fa] mt-0.5 flex-shrink-0" /> CLV (Closing Line Value) tracked on every bet — the #1 predictor of long-term edge</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#60a5fa] mt-0.5 flex-shrink-0" /> Sport-by-sport breakdown with separate W/L records per sport and bet type</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#60a5fa] mt-0.5 flex-shrink-0" /> No cherry-picked timeframes — lifetime record shown by default</li>
                </ul>
              </div>
            </div>
          </NeonCard>
        </div>

        {/* Bottom CTA */}
        <NeonCard className="p-12 text-center" variant="premium" interactive={false}>
          <h2 className="font-display text-3xl text-white mb-4">
            Ready to Bet <span className="text-emerald-gradient">Smarter?</span>
          </h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto">
            Get access to every pick, real-time odds, +EV finder, and all premium tools.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/pricing">
              <button className="btn-premium">
                Start Free 3-Day Trial <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/picks">
              <button className="btn-outline-premium">
                View Today's Picks <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
