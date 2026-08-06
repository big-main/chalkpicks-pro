import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { useAuth } from "@/_core/hooks/useAuth";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { RefreshCw, TrendingDown, Filter } from "lucide-react";
import { getSportBadgeClass } from "@/lib/badges";
import { PageMeta } from "@/components/PageMeta";
import { FaqJsonLd } from "@/components/seo/schema-jsonld";

const SPORTS = [
  { key: undefined, label: "ALL" },
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
];

const FAQ_ITEMS = [
  {
    question: "What is a low hold line?",
    answer:
      "A low hold line is a market where the sportsbook's built-in margin (hold/vig) is unusually small, giving bettors better value regardless of which side they choose.",
  },
  {
    question: "Why do low hold lines matter?",
    answer:
      "Lower hold means closer to true fair odds. Betting low hold lines consistently reduces the house edge and improves long-term expected value.",
  },
  {
    question: "How is hold calculated?",
    answer:
      "Hold = sum of implied probabilities across all sides minus 100%. A typical market has 4-8% hold; low hold lines are under 2%.",
  },
  {
    question: "Which sportsbooks offer the best hold?",
    answer:
      "Sharp books like Pinnacle, 1xBet, and Betfair typically have the lowest hold. Exchanges like Polymarket and Kalshi can approach 0% hold.",
  },
  {
    question: "Can I combine low hold lines with +EV betting?",
    answer:
      "Yes — low hold lines are often the same markets with +EV opportunities. Use both tools together for maximum edge.",
  },
];

export default function LowHoldLines() {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [sport, setSport] = useState<string | undefined>(undefined);
  const hasProAccess =
    subscription?.isActive &&
    (subscription?.tier === "monthly" || subscription?.tier === "yearly");

  const { data, isLoading, refetch } =
    trpc.sharpOpportunities.getLowHoldLines.useQuery(
      { sport, limit: 100 },
      { refetchInterval: 60000, enabled: hasProAccess }
    );

  const lines = useMemo(() => data?.lines ?? [], [data]);

  if (!hasProAccess) {
    return (
      <Paywall
        tier="monthly"
        title="Low Hold Lines"
        description="Find markets with minimal sportsbook edge for maximum value"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta pathname="/tools/low-hold" />
      <FaqJsonLd faqs={FAQ_ITEMS} />
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-bold tracking-widest rounded-full bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.2)] text-[#39ff14]">
            <span className="live-dot" /> SHARP PLAN DATA
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">
            <span className="text-emerald-gradient">Low Hold</span> Lines
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Markets with minimal sportsbook margin — closer to true fair odds.
            Lower hold = better value for bettors.
          </p>
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {SPORTS.map(s => (
            <button
              key={s.label}
              onClick={() => setSport(s.key)}
              className="px-3 py-1.5 text-xs font-bold tracking-wider transition-all rounded"
              style={{
                background:
                  sport === s.key ? "#39ff14" : "rgba(57,255,20,0.06)",
                color: sport === s.key ? "#080814" : "rgba(57,255,20,0.8)",
                border: `1px solid ${sport === s.key ? "#39ff14" : "rgba(57,255,20,0.2)"}`,
              }}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded bg-[rgba(212,160,23,0.08)] text-[var(--gold)] border border-[rgba(212,160,23,0.25)]"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
            />
            REFRESH
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Lines Found",
                value: lines.length.toString(),
                color: "#39ff14",
              },
              {
                label: "Avg Hold",
                value:
                  lines.length > 0
                    ? `${(lines.reduce((s, l) => s + l.holdPercent, 0) / lines.length).toFixed(1)}%`
                    : "—",
                color: "#f0b800",
              },
              {
                label: "Best Hold",
                value:
                  lines.length > 0
                    ? `${Math.min(...lines.map(l => l.holdPercent)).toFixed(1)}%`
                    : "—",
                color: "#39ff14",
              },
            ].map(s => (
              <PremiumCard key={s.label} className="p-4 text-center">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
                <div className="text-xs mt-0.5 text-muted-foreground">
                  {s.label}
                </div>
              </PremiumCard>
            ))}
          </div>
        )}

        {/* Lines list */}
        {isLoading ? (
          <PremiumCard className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#39ff14]" />
            <p className="text-muted-foreground">
              Scanning 25+ sportsbooks for low hold markets...
            </p>
          </PremiumCard>
        ) : lines.length === 0 ? (
          <PremiumCard className="p-12 text-center">
            <TrendingDown className="w-10 h-10 mx-auto mb-4 text-[rgba(57,255,20,0.3)]" />
            <p className="font-bold text-xl mb-2">
              No Low Hold Lines Right Now
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon or try a different sport filter.
            </p>
          </PremiumCard>
        ) : (
          <div className="space-y-3">
            {lines.map((line, i) => (
              <PremiumCard key={line.id || i} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold tracking-widest rounded-full ${getSportBadgeClass(line.league)}`}
                      >
                        {(line.leagueLabel || line.league || "").toUpperCase()}
                      </span>
                      {line.isLive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg">{line.eventName}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {line.marketType}
                      {line.line !== null &&
                        ` (${line.line > 0 ? `+${line.line}` : line.line})`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {line.books.slice(0, 3).map((b, bi) => (
                      <div key={bi} className="text-center">
                        <div className="text-xs text-muted-foreground mb-0.5">
                          {b.sportsbook}
                        </div>
                        <div className="font-bold text-lg">
                          {b.oddsAmerican > 0
                            ? `+${b.oddsAmerican}`
                            : b.oddsAmerican}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {b.selection}
                        </div>
                      </div>
                    ))}
                    <div
                      className="px-4 py-2 text-center rounded-lg"
                      style={{
                        background: "rgba(57,255,20,0.08)",
                        border: "1px solid rgba(57,255,20,0.25)",
                        minWidth: "80px",
                      }}
                    >
                      <div className="font-bold text-2xl text-[#39ff14]">
                        {line.holdPercent.toFixed(1)}%
                      </div>
                      <div className="text-[10px] font-bold tracking-wider text-muted-foreground">
                        HOLD
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <PremiumCard key={i} className="p-5">
                <h3 className="font-bold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
