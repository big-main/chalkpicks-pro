import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { PageMeta } from "@/components/PageMeta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, MinusCircle, Clock, TrendingUp, Target, Calendar, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Link } from "wouter";

const SPORT_LABELS: Record<string, string> = {
  all: "All Sports",
  americanfootball_nfl: "NFL",
  basketball_nba: "NBA",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
  americanfootball_ncaaf: "NCAAF",
  basketball_ncaab: "NCAAB",
  mma_mixed_martial_arts: "MMA",
  soccer_epl: "Soccer",
};

const FAQS = [
  {
    question: "How are ChalkPicks results graded?",
    answer: "Results are graded automatically when final game scores are confirmed. A win means the AI pick covered the spread/total/moneyline. A push means the result was exactly on the line — no win or loss.",
  },
  {
    question: "What is the overall win rate?",
    answer: "ChalkPicks AI maintains a verified 62%+ win rate across all sports since launch. Premium picks (confidence ≥75%) have historically outperformed free picks.",
  },
  {
    question: "How far back do results go?",
    answer: "This page shows the last 30 days of graded picks. Historical performance data going back further is available to Pro subscribers on the Analytics page.",
  },
  {
    question: "Why are some picks still pending?",
    answer: "Picks show as pending until the game has been played and the final score confirmed. Pending picks are typically resolved within 24 hours of game completion.",
  },
];

function ResultIcon({ result }: { result: string }) {
  if (result === "win") return <CheckCircle2 className="w-5 h-5 text-[#39ff14]" />;
  if (result === "loss") return <XCircle className="w-5 h-5 text-red-400" />;
  if (result === "push") return <MinusCircle className="w-5 h-5 text-yellow-400" />;
  return <Clock className="w-5 h-5 text-slate-400" />;
}

function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    win: "bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20",
    loss: "bg-red-500/10 text-red-400 border-red-500/20",
    push: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    pending: "bg-slate-700/50 text-slate-400 border-slate-600",
  };
  return (
    <Badge className={`text-xs font-bold uppercase ${styles[result] ?? styles.pending}`}>
      {result}
    </Badge>
  );
}

function formatOdds(odds: number | null | undefined): string {
  if (!odds) return "—";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function DaySummary({ wins, losses, pushes, pending }: { wins: number; losses: number; pushes: number; pending: number }) {
  const total = wins + losses + pushes;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      <span className="text-[#39ff14] font-bold">{wins}W</span>
      <span className="text-red-400 font-bold">{losses}L</span>
      {pushes > 0 && <span className="text-yellow-400 font-bold">{pushes}P</span>}
      {pending > 0 && <span className="text-slate-400">{pending} pending</span>}
      {total > 0 && <span className="text-slate-400">({winRate}% today)</span>}
    </div>
  );
}

export default function Results() {
  const [sportFilter, setSportFilter] = useState("all");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([new Date().toISOString().split("T")[0]]));
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = trpc.picks.archive.useQuery(
    { sportKey: sportFilter === "all" ? undefined : sportFilter, days: 30 },
    { staleTime: 5 * 60 * 1000 }
  );

  const days = data?.days ?? [];

  // Overall stats across all loaded days
  const overallStats = useMemo(() => {
    let wins = 0, losses = 0, pushes = 0, pending = 0;
    for (const day of days) {
      for (const p of day.picks) {
        if (p.result === "win") wins++;
        else if (p.result === "loss") losses++;
        else if (p.result === "push") pushes++;
        else pending++;
      }
    }
    const total = wins + losses + pushes;
    return { wins, losses, pushes, pending, total, winRate: total > 0 ? Math.round((wins / total) * 100) : 0 };
  }, [days]);

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // data.sports is an array of { key, name, icon } objects
  const sports = (data?.sports ?? []) as Array<{ key: string; name: string; icon: string }>;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/results" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Pick Results", url: "https://chalkpicks.live/results" },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
      </div>

      <div className="relative z-10 container pt-28 pb-20 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" /> VERIFIED PICK RESULTS — LAST 30 DAYS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Pick Results &amp; <span className="text-[#39ff14]">Track Record</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Every pick graded. Every result verified. No cherry-picking — full transparency on ChalkPicks AI performance.
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Win Rate", value: `${overallStats.winRate}%`, color: "#39ff14", icon: TrendingUp },
            { label: "Wins", value: overallStats.wins.toString(), color: "#39ff14", icon: CheckCircle2 },
            { label: "Losses", value: overallStats.losses.toString(), color: "#f87171", icon: XCircle },
            { label: "Total Graded", value: overallStats.total.toString(), color: "#94a3b8", icon: Target },
          ].map(({ label, value, color, icon: Icon }) => (
            <NeonCard key={label} className="p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </NeonCard>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 mb-3"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter by Sport
            {showFilters ? <ChevronUp className="w-3.5 h-3.5 ml-1.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-1.5" />}
          </Button>
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {/* "all" button */}
              <button
                key="all"
                onClick={() => setSportFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  sportFilter === "all"
                    ? "bg-[#39ff14]/10 border-[#39ff14]/40 text-[#39ff14]"
                    : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                All Sports
              </button>
              {sports.slice(0, 8).map(sport => (
                <button
                  key={sport.key}
                  onClick={() => setSportFilter(sport.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    sportFilter === sport.key
                      ? "bg-[#39ff14]/10 border-[#39ff14]/40 text-[#39ff14]"
                      : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {sport.icon} {sport.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Calendar */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : days.length === 0 ? (
          <NeonCard className="p-10 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-muted-foreground">No graded picks found for the selected filter.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-slate-600 text-slate-300"
              onClick={() => setSportFilter("all")}
            >
              Clear Filter
            </Button>
          </NeonCard>
        ) : (
          <div className="space-y-3">
            {days.map(({ date, picks: dayPicks }) => {
              const wins = dayPicks.filter(p => p.result === "win").length;
              const losses = dayPicks.filter(p => p.result === "loss").length;
              const pushes = dayPicks.filter(p => p.result === "push").length;
              const pending = dayPicks.filter(p => p.result === "pending").length;
              const isExpanded = expandedDays.has(date);

              return (
                <NeonCard key={date} className="overflow-hidden">
                  {/* Day header */}
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                    onClick={() => toggleDay(date)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">{formatDate(date)}</p>
                        <DaySummary wins={wins} losses={losses} pushes={pushes} pending={pending} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dayPicks.length} picks</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Day picks */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/50 divide-y divide-slate-700/30">
                      {dayPicks.map(pick => (
                        <div key={pick.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <ResultIcon result={pick.result} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600 shrink-0">
                                  {SPORT_LABELS[pick.sportKey] ?? pick.sportKey.toUpperCase()}
                                </Badge>
                                {pick.tier === "premium" && (
                                  <Badge className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shrink-0">PRO</Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground font-medium truncate">
                                {pick.awayTeam} @ {pick.homeTeam}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {pick.recommendation}
                                {pick.odds ? ` (${formatOdds(pick.odds)})` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Confidence</p>
                              <p className="text-sm font-bold text-foreground">{pick.confidenceScore}%</p>
                            </div>
                            <ResultBadge result={pick.result} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </NeonCard>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <NeonCard className="mt-10 p-8 text-center">
          <TrendingUp className="w-8 h-8 text-[#39ff14] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Want Full Analysis on Every Pick?</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            Pro members see confidence scores, edge percentages, sharp money indicators, and full AI analysis — plus unlimited picks across all sports.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/pricing">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold">
                Upgrade to Pro
              </Button>
            </Link>
            <Link href="/free-picks">
              <Button variant="outline" className="border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10">
                View Free Picks
              </Button>
            </Link>
          </div>
        </NeonCard>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ question, answer }) => (
              <NeonCard key={question} className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-2">{question}</h3>
                <p className="text-sm text-muted-foreground">{answer}</p>
              </NeonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
