import { useState } from "react";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { getSportBadgeClass } from "@/lib/badges";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, ChevronRight } from "lucide-react";

const RESULT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  win: { label: "WIN", color: "#00ff88", bg: "rgba(0,255,136,0.12)" },
  loss: { label: "LOSS", color: "#ff4d8f", bg: "rgba(255,77,143,0.12)" },
  push: { label: "PUSH", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  pending: { label: "PENDING", color: "#00d4ff", bg: "rgba(0,212,255,0.12)" },
};

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DailyPicks() {
  const [sportKey, setSportKey] = useState<string | undefined>(undefined);
  const { data, isLoading } = trpc.picks.archive.useQuery({ sportKey, days: 30 });

  const sports = data?.sports ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Daily AI Picks Archive — Past Results by Date | ChalkPicks"
        description="Browse the complete archive of ChalkPicks AI sports betting picks by date. Full transparency on wins, losses, and performance for NFL, NBA, MLB & NHL."
        canonicalPath="/daily-picks"
      />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl mt-20">
        <div className="mb-10 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Exo 2', sans-serif", color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.3)" }}
          >
            Daily Picks <span className="text-white">Archive</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every AI pick we've published, by date — wins, losses, and all. Full transparency, no cherry-picking.
          </p>
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setSportKey(undefined)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              background: !sportKey ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)",
              color: !sportKey ? "#00ff88" : "rgba(200,200,220,0.7)",
              border: `1px solid ${!sportKey ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
              cursor: "pointer",
            }}
          >
            All Sports
          </button>
          {sports.map((s) => (
            <button
              key={s.key}
              onClick={() => setSportKey(s.key)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                background: sportKey === s.key ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)",
                color: sportKey === s.key ? "#00ff88" : "rgba(200,200,220,0.7)",
                border: `1px solid ${sportKey === s.key ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                cursor: "pointer",
              }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-20 text-muted-foreground">Loading picks archive...</div>
        )}

        {!isLoading && (!data || data.days.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            No picks found for this filter. Check out <Link href="/picks" style={{ color: "#00ff88" }}>today's picks</Link>.
          </div>
        )}

        <div className="space-y-10">
          {data?.days.map((day) => {
            const wins = day.picks.filter((p) => p.result === "win").length;
            const losses = day.picks.filter((p) => p.result === "loss").length;
            return (
              <section key={day.date}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2
                    className="text-xl font-bold text-white flex items-center gap-2"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: "#00d4ff" }} />
                    {formatDate(day.date)}
                  </h2>
                  {(wins > 0 || losses > 0) && (
                    <Badge
                      style={{
                        background: "rgba(0,255,136,0.1)",
                        color: "#00ff88",
                        border: "1px solid rgba(0,255,136,0.25)",
                      }}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" /> {wins}-{losses} Record
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {day.picks.map((pick) => {
                    const rs = RESULT_STYLES[pick.result ?? "pending"] ?? RESULT_STYLES.pending;
                    return (
                      <Card
                        key={pick.id}
                        className="border-border"
                        style={{ background: "rgba(12,12,28,0.8)" }}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded-full ${getSportBadgeClass(pick.sportKey)}`}>{(pick.sportKey ?? "").replace(/americanfootball_|basketball_|baseball_|icehockey_/i, "").toUpperCase()}</span> · {pick.pickType?.replace("_", "/")}
                            </span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{ background: rs.bg, color: rs.color }}
                            >
                              {rs.label}
                            </span>
                          </div>
                          <div className="font-bold text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                            {pick.recommendation}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {pick.awayTeam} @ {pick.homeTeam}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: "#00d4ff" }}>Odds: {formatOdds(pick.odds ?? 0)}</span>
                            <span style={{ color: "#00ff88" }}>Confidence: {pick.confidenceScore}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Internal links + CTA */}
        <div className="mt-16 mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link href="/nfl-picks" className="text-sm px-4 py-2 rounded-lg" style={{ color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}>NFL Picks</Link>
            <Link href="/nba-picks" className="text-sm px-4 py-2 rounded-lg" style={{ color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}>NBA Picks</Link>
            <Link href="/mlb-picks" className="text-sm px-4 py-2 rounded-lg" style={{ color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}>MLB Picks</Link>
            <Link href="/nhl-picks" className="text-sm px-4 py-2 rounded-lg" style={{ color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}>NHL Picks</Link>
          </div>
          <div
            className="p-8 rounded-xl text-center"
            style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}
          >
            <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              Get Today's Picks Before They Lock
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Premium members see every pick with full AI analysis, confidence scores, and edge ratings — updated daily.
            </p>
            <Link href="/pricing">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 font-bold rounded-lg"
                style={{
                  background: "#00ff88",
                  color: "#080814",
                  fontFamily: "'Exo 2', sans-serif",
                  boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                VIEW PLANS <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </main>
      <ComplianceFooter />
    </div>
  );
}
