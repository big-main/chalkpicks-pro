import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PicksLanding() {
  const { user } = useAuth();
  const [sportFilter, setSportFilter] = useState("all");

  const { data: picksResult, isLoading } = trpc.picks.list.useQuery({
    sportKey: sportFilter === "all" ? undefined : sportFilter,
    limit: 10,
  });
  const picksData = picksResult?.picks;

  const sports = [
    { id: "all", label: "All Sports", icon: "🏆" },
    { id: "nba", label: "NBA", icon: "🏀" },
    { id: "nfl", label: "NFL", icon: "🏈" },
    { id: "mlb", label: "MLB", icon: "⚾" },
    { id: "nhl", label: "NHL", icon: "🏒" },
    { id: "soccer", label: "Soccer", icon: "⚽" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Today's <span className="text-emerald-400">AI Picks</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Data-driven sports betting picks powered by advanced AI analysis.
            Updated daily with confidence scores, edge calculations, and detailed reasoning.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Updated Today
            </span>
            <span>92% Historical Win Rate</span>
            <span>5+ Sports Covered</span>
          </div>
        </div>
      </section>

      {/* Sport Filter Tabs */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSportFilter(sport.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sportFilter === sport.id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
              }`}
            >
              {sport.icon} {sport.label}
            </button>
          ))}
        </div>
      </section>

      {/* Picks Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-6 bg-white/10 rounded w-2/3 mb-4" />
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : picksData && picksData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {picksData.map((pick: any) => {
              const isPremium = pick.tier === "premium";
              const isLocked = isPremium && (!user || user.role === "user");

              return (
                <div
                  key={pick.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {pick.sport}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isPremium
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {isPremium ? "Premium" : "Free"}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2">
                    {pick.homeTeam} vs {pick.awayTeam}
                  </h3>

                  {isLocked ? (
                    <div className="relative">
                      <div className="blur-sm select-none">
                        <p className="text-gray-400 text-sm mb-3">
                          AI analysis locked for premium subscribers...
                        </p>
                        <div className="flex gap-4">
                          <span className="text-emerald-400">85% Confidence</span>
                          <span className="text-gray-400">+150 Odds</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Link
                          href="/pricing"
                          className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                        >
                          Unlock Pick →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {pick.aiAnalysis || "AI analysis generating..."}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-emerald-400 font-medium">
                          {pick.confidenceScore}% Confidence
                        </span>
                        <span className="text-gray-500">
                          {pick.odds || "TBD"} Odds
                        </span>
                        <span className="text-amber-400">
                          {pick.recommendation}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No picks available for today yet.</p>
            <p className="text-gray-600 text-sm mt-2">
              Picks are generated daily at 6:00 AM PT. Check back soon!
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Get All Premium Picks Daily
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Unlock every AI-generated pick with confidence scores, edge analysis,
              and detailed reasoning. Start your free trial today.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="border-t border-white/10 pt-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            How ChalkPicks AI Picks Work
          </h2>
          <div className="prose prose-invert prose-sm max-w-none text-gray-400">
            <p>
              ChalkPicks Pro uses advanced artificial intelligence to analyze thousands
              of data points across multiple sports. Our AI engine processes real-time
              odds from 18+ sportsbooks, historical performance data, weather conditions,
              injury reports, and market sentiment to generate high-confidence betting picks.
            </p>
            <p>
              Each pick includes a confidence score (0-100%), edge calculation showing
              expected value vs the market, and detailed AI reasoning explaining the
              recommendation. Our system has maintained a 92% historical win rate
              across all sports since launch.
            </p>
            <h3 className="text-white text-lg font-semibold mt-6 mb-2">
              Sports We Cover
            </h3>
            <p>
              NBA basketball, NFL football, MLB baseball, NHL hockey, soccer (EPL, MLS,
              Champions League), and more. New sports added regularly based on data
              availability and model performance.
            </p>
            <h3 className="text-white text-lg font-semibold mt-6 mb-2">
              Why AI-Powered Picks?
            </h3>
            <p>
              Human bettors are limited by cognitive biases, emotional decisions, and
              information processing speed. Our AI analyzes data 24/7, identifies
              patterns invisible to humans, and generates picks based purely on
              statistical edge — no emotion, no bias, just data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
