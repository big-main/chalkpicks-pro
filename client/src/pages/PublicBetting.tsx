import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { PageMeta } from "@/components/PageMeta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  Zap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const FAQS = [
  {
    question: "What is public betting percentage?",
    answer:
      "Public betting percentage shows what percentage of bets placed are on each side of a game. When 70%+ of bets are on one side, that team is considered the 'public favorite'. Sharp bettors often fade heavy public sides.",
  },
  {
    question: "What is the difference between bet % and money %?",
    answer:
      "Bet % counts the number of individual bets on each side. Money % counts the total dollar amount wagered. When money % diverges from bet % — e.g., 40% of bets but 65% of money on one side — it indicates sharp (professional) money on that side.",
  },
  {
    question: "Should I always fade the public?",
    answer:
      "Not always. Fading the public is most effective when combined with other signals: line movement against the public, sharp money indicators, and a strong +EV edge. Use public betting data as one signal among many, not as a standalone strategy.",
  },
];

interface Game {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeBetPct: number;
  awayBetPct: number;
  homeMoneyPct: number;
  awayMoneyPct: number;
  lineMovement: "up" | "down" | "flat";
  spread: string;
  total: string;
}

const MOCK_GAMES: Game[] = [
  {
    id: 1,
    sport: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    gameTime: "Sun 4:25 PM ET",
    homeBetPct: 62,
    awayBetPct: 38,
    homeMoneyPct: 45,
    awayMoneyPct: 55,
    lineMovement: "down",
    spread: "-3.5",
    total: "47.5",
  },
  {
    id: 2,
    sport: "NFL",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Philadelphia Eagles",
    gameTime: "Sun 8:20 PM ET",
    homeBetPct: 71,
    awayBetPct: 29,
    homeMoneyPct: 42,
    awayMoneyPct: 58,
    lineMovement: "down",
    spread: "-1.5",
    total: "44.5",
  },
  {
    id: 3,
    sport: "NBA",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Golden State Warriors",
    gameTime: "Tue 10:00 PM ET",
    homeBetPct: 55,
    awayBetPct: 45,
    homeMoneyPct: 61,
    awayMoneyPct: 39,
    lineMovement: "up",
    spread: "-2.5",
    total: "228.5",
  },
  {
    id: 4,
    sport: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Miami Heat",
    gameTime: "Wed 7:30 PM ET",
    homeBetPct: 78,
    awayBetPct: 22,
    homeMoneyPct: 55,
    awayMoneyPct: 45,
    lineMovement: "flat",
    spread: "-7.5",
    total: "215.5",
  },
  {
    id: 5,
    sport: "MLB",
    homeTeam: "New York Yankees",
    awayTeam: "Boston Red Sox",
    gameTime: "Mon 7:05 PM ET",
    homeBetPct: 65,
    awayBetPct: 35,
    homeMoneyPct: 70,
    awayMoneyPct: 30,
    lineMovement: "up",
    spread: "-1.5",
    total: "9.5",
  },
  {
    id: 6,
    sport: "NHL",
    homeTeam: "Colorado Avalanche",
    awayTeam: "Vegas Golden Knights",
    gameTime: "Thu 9:00 PM ET",
    homeBetPct: 48,
    awayBetPct: 52,
    homeMoneyPct: 38,
    awayMoneyPct: 62,
    lineMovement: "down",
    spread: "+1.5",
    total: "6.5",
  },
];

function isSharpAction(game: Game, side: "home" | "away"): boolean {
  const betPct = side === "home" ? game.homeBetPct : game.awayBetPct;
  const moneyPct = side === "home" ? game.homeMoneyPct : game.awayMoneyPct;
  return Math.abs(betPct - moneyPct) > 15 && moneyPct > betPct;
}

function PercentBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

export default function PublicBetting() {
  const [sportFilter, setSportFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const sports = ["All", "NFL", "NBA", "MLB", "NHL"];
  const filtered =
    sportFilter === "All"
      ? MOCK_GAMES
      : MOCK_GAMES.filter(g => g.sport === sportFilter);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/public-betting" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.pro" },
          {
            name: "Public Betting",
            url: "https://chalkpicks.pro/public-betting",
          },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
      </div>

      <div className="relative z-10 container pt-28 pb-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <Users className="w-3.5 h-3.5" /> PUBLIC MONEY TRACKER
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Public Betting Percentages
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See where the public money is going across all sports. Identify
            sharp vs. public splits to find betting edges.
          </p>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="p-3 rounded-xl bg-card/50 border border-border/50 text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bet %</p>
            <p className="text-xs text-foreground font-medium mt-0.5">
              Number of bets
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card/50 border border-border/50 text-center">
            <DollarSign className="w-5 h-5 text-[#39ff14] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Money %</p>
            <p className="text-xs text-foreground font-medium mt-0.5">
              Dollar amount wagered
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-amber-400 font-semibold">Sharp Action</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Money % diverges from Bet %
            </p>
          </div>
        </div>

        {/* Filters + Refresh */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {sports.map(s => (
              <Button
                key={s}
                variant={sportFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setSportFilter(s)}
                className={
                  sportFilter === s
                    ? "bg-[#39ff14] text-black font-bold"
                    : "border-border/50 text-muted-foreground"
                }
              >
                {s}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-border/50 text-muted-foreground"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Games */}
        <div className="space-y-4 mb-12">
          {filtered.map(game => {
            const homeSharp = isSharpAction(game, "home");
            const awaySharp = isSharpAction(game, "away");
            return (
              <NeonCard key={game.id} className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                        {game.sport}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {game.gameTime}
                      </span>
                      {game.lineMovement !== "flat" && (
                        <span
                          className={`flex items-center gap-0.5 text-xs ${game.lineMovement === "up" ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {game.lineMovement === "up" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          Line moving
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {game.awayTeam}{" "}
                      <span className="text-muted-foreground font-normal">
                        @
                      </span>{" "}
                      {game.homeTeam}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Spread: {game.spread} · Total: {game.total}
                    </p>
                  </div>
                  {(homeSharp || awaySharp) && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                      <Zap className="w-3 h-3 mr-1" /> Sharp Action
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Away Team */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {game.awayTeam}
                      </span>
                      {awaySharp && (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Sharp
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Bet %
                        </span>
                      </div>
                      <PercentBar pct={game.awayBetPct} color="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Money %
                        </span>
                      </div>
                      <PercentBar
                        pct={game.awayMoneyPct}
                        color="bg-[#39ff14]"
                      />
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {game.homeTeam}
                      </span>
                      {homeSharp && (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Sharp
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Bet %
                        </span>
                      </div>
                      <PercentBar pct={game.homeBetPct} color="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Money %
                        </span>
                      </div>
                      <PercentBar
                        pct={game.homeMoneyPct}
                        color="bg-[#39ff14]"
                      />
                    </div>
                  </div>
                </div>
              </NeonCard>
            );
          })}
        </div>

        {/* Educational */}
        <NeonCard className="p-6 mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#39ff14]" /> How to Use Public
            Betting Data
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              {
                title: "Fade Heavy Public Sides",
                desc: "When 70%+ of bets are on one side but the line isn't moving, sportsbooks are comfortable taking the other side. Consider fading the public.",
                color: "text-blue-400",
              },
              {
                title: "Follow Sharp Money",
                desc: "When money % is significantly higher than bet % on one side, professional bettors (sharps) are loading up on that side. This is a bullish signal.",
                color: "text-[#39ff14]",
              },
              {
                title: "Watch Line Movement",
                desc: "If a team is getting 70% of bets but the line moves against them, that's a strong reverse line movement signal — sharps are on the other side.",
                color: "text-amber-400",
              },
            ].map(({ title, desc, color }) => (
              <div
                key={title}
                className="p-4 rounded-lg bg-card/50 border border-border/50"
              >
                <p className={`font-semibold ${color} mb-2`}>{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </NeonCard>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <NeonCard key={faq.question} className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </NeonCard>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: "rgba(57,255,20,0.04)",
            border: "1px solid rgba(57,255,20,0.12)",
          }}
        >
          <h2 className="text-xl font-bold text-foreground mb-2">
            Get Real-Time Public Betting Data
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">
            Upgrade to Pro for live public betting percentages, sharp money
            alerts, and AI-powered picks that combine all signals.
          </p>
          <Link href="/pricing">
            <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
              Upgrade to Pro →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
