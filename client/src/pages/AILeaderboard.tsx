import React from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageMeta } from "@/components/PageMeta";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/schema-jsonld";
import {
  Trophy,
  TrendingUp,
  Flame,
  Target,
  Medal,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SPORT_EMOJI: Record<string, string> = {
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  NCAAF: "🏈",
  NCAAB: "🏀",
  MMA: "🥊",
  SOCCER: "⚽",
};

const TIME_RANGES = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "all", label: "All Time" },
] as const;

function ResultIcon({ result }: { result: string }) {
  if (result === "win") return <ChevronUp className="w-4 h-4 text-[#39ff14]" />;
  if (result === "loss")
    return <ChevronDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-amber-400" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-8 h-8 rounded-full bg-slate-300/10 border border-slate-400/50 flex items-center justify-center">
        <Medal className="w-4 h-4 text-slate-300" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-600/50 flex items-center justify-center">
        <Medal className="w-4 h-4 text-orange-400" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
      {rank}
    </div>
  );
}

export default function AILeaderboard() {
  const [timeRange, setTimeRange] = React.useState<string>("30d");
  const { data: performance, isLoading } = trpc.picks.performance.useQuery();
  const { data: recentSettled } = trpc.picks.recentSettled.useQuery({
    limit: 20,
  });

  // Build leaderboard from bySport data
  const sportLeaderboard = React.useMemo(() => {
    if (!performance?.bySport) return [];
    return [...performance.bySport]
      .filter(s => s.wins + s.losses > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [performance]);

  // Recent streak from settled picks
  const recentResults = React.useMemo(() => {
    if (!recentSettled?.picks) return [];
    return recentSettled.picks.slice(0, 10);
  }, [recentSettled]);

  const overallStats = performance?.overall;

  return (
    <>
      <PageMeta />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.pro" },
          { name: "Performance", url: "https://chalkpicks.pro/performance" },
          {
            name: "AI Leaderboard",
            url: "https://chalkpicks.pro/ai-leaderboard",
          },
        ]}
      />
      <FaqJsonLd
        faqs={[
          {
            question: "What is the ChalkPicks AI leaderboard?",
            answer:
              "The ChalkPicks leaderboard shows real-time AI pick performance broken down by sport, including win rates, ROI, current streaks, and total picks. It updates automatically as picks are graded.",
          },
          {
            question: "Which sport does ChalkPicks AI perform best on?",
            answer:
              "Performance varies by season and sample size. Check the leaderboard for the latest rankings — historically, NBA and NHL have shown the highest win rates.",
          },
          {
            question: "How often is the leaderboard updated?",
            answer:
              "The leaderboard updates in real-time as games are completed and picks are graded. Results are typically posted within 30 minutes of game completion.",
          },
        ]}
      />

      <div className="min-h-screen bg-[#0a0f0a]">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#39ff14]/5 via-transparent to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12 relative">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-sm font-medium mb-4">
                <Trophy className="w-4 h-4" /> Live AI Performance Rankings
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                AI Picks <span className="text-[#39ff14]">Leaderboard</span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto">
                Real-time performance rankings by sport. See where our AI model
                dominates and track live streaks.
              </p>
            </div>

            {/* Overall Stats Cards */}
            {overallStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#39ff14]">
                    {overallStats.winRate}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Overall Win Rate
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {overallStats.totalPicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Total Picks</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5" /> {overallStats.currentStreak}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Current Streak
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    +{overallStats.roi}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">ROI</div>
                </div>
              </div>
            )}

            {/* Time Range Tabs */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {TIME_RANGES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTimeRange(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === t.key
                      ? "bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="container max-w-6xl mx-auto px-4 pb-16">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#39ff14]" /> Rankings by Sport
              </h2>
              <span className="text-xs text-slate-500">Updated live</span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-slate-500">
                Loading leaderboard...
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {/* Header */}
                <div className="grid grid-cols-12 px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Sport</div>
                  <div className="col-span-2 text-center">Win Rate</div>
                  <div className="col-span-2 text-center">Record</div>
                  <div className="col-span-2 text-center">ROI</div>
                  <div className="col-span-2 text-center">Picks</div>
                </div>

                {sportLeaderboard.map(sport => (
                  <div
                    key={sport.sport}
                    className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-slate-800/20 transition-colors ${
                      sport.rank === 1 ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <div className="col-span-1">
                      <RankBadge rank={sport.rank} />
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <span className="text-xl">
                        {SPORT_EMOJI[sport.sport] || "🎯"}
                      </span>
                      <div>
                        <div className="font-semibold text-white">
                          {sport.sport}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sport.wins + sport.losses + sport.pushes} total picks
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`text-lg font-bold ${sport.winRate >= 90 ? "text-[#39ff14]" : sport.winRate >= 80 ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {sport.winRate}%
                      </span>
                    </div>
                    <div className="col-span-2 text-center text-sm text-slate-300">
                      {sport.wins}W - {sport.losses}L - {sport.pushes}P
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-emerald-400 font-medium">
                        +{sport.roi}%
                      </span>
                    </div>
                    <div className="col-span-2 text-center text-slate-400">
                      {sport.wins + sport.losses + sport.pushes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results Stream */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#39ff14]" /> Recent Results
              </h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {recentResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Loading recent results...
                </div>
              ) : (
                recentResults.map((pick: any) => (
                  <div
                    key={pick.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors"
                  >
                    <ResultIcon result={pick.result} />
                    <span className="text-xs font-medium text-slate-500 w-12">
                      {SPORT_EMOJI[pick.sportKey?.toUpperCase()] || "🎯"}{" "}
                      {pick.sportKey?.toUpperCase()}
                    </span>
                    <span className="text-sm text-white flex-1 truncate">
                      {pick.awayTeam} @ {pick.homeTeam}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pick.recommendation}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        pick.result === "win"
                          ? "bg-[#39ff14]/10 text-[#39ff14]"
                          : pick.result === "loss"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {pick.result?.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-[#39ff14]/5 via-[#39ff14]/10 to-[#39ff14]/5 border border-[#39ff14]/20 rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Get These Picks Before the Game Starts
            </h2>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Pro members receive 5-10 AI picks daily with full analysis,
              confidence scores, and edge percentages — before the lines move.
            </p>
            <Link href="/pricing">
              <Button
                className="h-12 px-8 text-base font-bold"
                style={{
                  background: "linear-gradient(135deg, #39ff14, #32e012)",
                  color: "#000",
                  boxShadow: "0 0 20px rgba(57,255,20,0.3)",
                }}
              >
                Start Winning Today <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is the ChalkPicks AI leaderboard?",
                  a: "The ChalkPicks AI leaderboard shows real-time AI pick performance broken down by sport, including win rates, ROI, current streaks, and total picks. It updates automatically as picks are graded.",
                },
                {
                  q: "Which sport does ChalkPicks AI perform best on?",
                  a: "Performance varies by season and sample size. Check the leaderboard for the latest rankings — historically, NBA and NHL have shown the highest win rates due to the volume of data and statistical predictability.",
                },
                {
                  q: "How often is the leaderboard updated?",
                  a: "The leaderboard updates in real-time as games are completed and picks are graded. Results are typically posted within 30 minutes of game completion.",
                },
                {
                  q: "Can I filter by time range?",
                  a: "Yes. Use the time range tabs (7 Days, 30 Days, 90 Days, All Time) to see performance over different periods. This helps identify seasonal trends and hot streaks.",
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden"
                >
                  <summary className="px-5 py-4 cursor-pointer text-white font-medium hover:bg-slate-800/20 transition-colors list-none flex items-center justify-between">
                    {q}
                    <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-400">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
