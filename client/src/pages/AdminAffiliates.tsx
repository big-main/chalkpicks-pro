import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, DollarSign, MousePointerClick, BarChart3, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPORTSBOOKS } from "../../../shared/sportsbooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

const BOOK_COLORS: Record<string, string> = {
  draftkings: "#f0b800",
  fanduel: "#39ff14",
  betmgm: "#d4a017",
  caesars: "#fbbf24",
  espnbet: "#ef4444",
  bet365: "#00b04f",
  pointsbet: "#9333ea",
  betrivers: "#3b82f6",
  bovada: "#f97316",
  mybookie: "#e91e63",
  betonline: "#8b0000",
};

function getBookName(id: string): string {
  const book = SPORTSBOOKS.find((b) => b.id === id);
  return book?.shortName ?? id;
}

function getBookColor(id: string): string {
  return BOOK_COLORS[id] ?? "#39ff14";
}

export default function AdminAffiliates() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading } = trpc.affiliateClicks.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container pt-24 pb-16 max-w-6xl mx-auto">
        {/* Back */}
        <Link href="/admin">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">Affiliate Analytics</h1>
          <p className="text-sm text-muted-foreground">Track sportsbook affiliate clicks, estimated conversions, and revenue projections.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: MousePointerClick,
                  label: "Total Clicks",
                  value: (stats?.total ?? 0).toLocaleString(),
                  color: "#39ff14",
                },
                {
                  icon: DollarSign,
                  label: "Est. Revenue",
                  value: `$${(stats?.totalEstimatedRevenue ?? 0).toLocaleString()}`,
                  color: "#f0b800",
                  sub: "~2% conversion rate",
                },
                {
                  icon: BarChart3,
                  label: "Books Clicked",
                  value: (stats?.byBook?.length ?? 0).toString(),
                  color: "#3b82f6",
                },
                {
                  icon: TrendingUp,
                  label: "Top Book",
                  value: stats?.byBook?.[0] ? getBookName(stats.byBook[0].sportsbookId) : "—",
                  color: "#d4a017",
                  sub: stats?.byBook?.[0] ? `${stats.byBook[0].clicks} clicks` : "",
                },
              ].map((kpi) => (
                <Card key={kpi.label} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                      <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    </div>
                    <div className="font-display text-2xl font-bold text-white">{kpi.value}</div>
                    {kpi.sub && <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Clicks by Sportsbook Bar Chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Clicks by Sportsbook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.byBook?.length ?? 0) === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                      No click data yet. Clicks will appear here as users interact with Place Bet buttons.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats?.byBook?.map((b) => ({ name: getBookName(b.sportsbookId), clicks: b.clicks, id: b.sportsbookId }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "rgba(180,180,210,0.6)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "rgba(180,180,210,0.6)", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "#0c0c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                          labelStyle={{ color: "white" }}
                          itemStyle={{ color: "#39ff14" }}
                        />
                        <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                          {stats?.byBook?.map((b) => (
                            <Cell key={b.sportsbookId} fill={getBookColor(b.sportsbookId)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Daily Trend Line Chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" /> 30-Day Click Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.daily?.length ?? 0) === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                      No trend data yet. Data will populate over the next 30 days.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={stats?.daily?.map((d) => ({ date: String(d.date).slice(5), clicks: d.clicks }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: "rgba(180,180,210,0.6)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(180,180,210,0.6)", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "#0c0c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                          labelStyle={{ color: "white" }}
                          itemStyle={{ color: "#39ff14" }}
                        />
                        <Line type="monotone" dataKey="clicks" stroke="#39ff14" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Estimate Table */}
            <Card className="bg-card border-border mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" /> Revenue Estimates by Sportsbook
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.byBook?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No data yet. Revenue estimates appear as users click Place Bet buttons.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Sportsbook</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Clicks</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Est. CPA</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Conv. Rate</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Est. Revenue</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Affiliate Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.byBook?.map((b) => {
                          const book = SPORTSBOOKS.find((sb) => sb.id === b.sportsbookId);
                          return (
                            <tr key={b.sportsbookId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: getBookColor(b.sportsbookId) }}
                                  />
                                  <span className="font-medium text-foreground">{getBookName(b.sportsbookId)}</span>
                                </div>
                              </td>
                              <td className="text-right py-2.5 text-foreground">{b.clicks.toLocaleString()}</td>
                              <td className="text-right py-2.5 text-foreground">${b.estimatedCpa}</td>
                              <td className="text-right py-2.5 text-muted-foreground">~2%</td>
                              <td className="text-right py-2.5 font-semibold" style={{ color: "#39ff14" }}>
                                ${b.estimatedRevenue.toLocaleString()}
                              </td>
                              <td className="text-right py-2.5">
                                {book && (
                                  <a
                                    href={book.affiliateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    Affiliate <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals row */}
                        <tr className="border-t-2 border-border">
                          <td className="py-2.5 font-bold text-foreground">TOTAL</td>
                          <td className="text-right py-2.5 font-bold text-foreground">
                            {(stats?.total ?? 0).toLocaleString()}
                          </td>
                          <td className="text-right py-2.5 text-muted-foreground">—</td>
                          <td className="text-right py-2.5 text-muted-foreground">—</td>
                          <td className="text-right py-2.5 font-bold" style={{ color: "#f0b800" }}>
                            ${(stats?.totalEstimatedRevenue ?? 0).toLocaleString()}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Clicks by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.bySource?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats?.bySource?.map((s) => (
                        <div key={s.source} className="flex items-center justify-between">
                          <span className="text-sm text-foreground capitalize">{s.source.replace(/_/g, " ")}</span>
                          <span className="text-sm font-semibold text-primary">{s.clicks.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Clicks by Sport</CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.bySport?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats?.bySport?.map((s) => (
                        <div key={s.sportKey} className="flex items-center justify-between">
                          <span className="text-sm text-foreground uppercase">{s.sportKey.replace(/_/g, " ")}</span>
                          <span className="text-sm font-semibold text-accent">{s.clicks.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground mt-8 text-center max-w-2xl mx-auto">
              Revenue estimates assume a ~2% click-to-deposit conversion rate and standard CPA rates per sportsbook. Actual revenue depends on your affiliate agreements. Replace placeholder affiliate URLs in <code className="bg-secondary px-1 rounded">shared/sportsbooks.ts</code> with your real tracking links to activate attribution.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
