import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, TrendingUp, Target, ChevronRight, Zap } from "lucide-react";

export interface SportPicksConfig {
  sportKey: string;
  sportName: string;
  icon: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: { title: string; desc: string }[];
}

export const SPORT_PICKS_CONFIGS: Record<string, SportPicksConfig> = {
  nfl: {
    sportKey: "nfl",
    sportName: "NFL",
    icon: "🏈",
    path: "/nfl-picks",
    title: "NFL AI Picks Today — Spreads, Totals & Props | ChalkPicks",
    description:
      "Free and premium NFL AI picks with confidence scores. Data-driven NFL spreads, totals, moneylines and player props analyzed by machine learning models.",
    h1: "NFL AI Picks",
    intro:
      "ChalkPicks' neural network analyzes years of play-by-play data, efficiency metrics, injuries, weather forecasts, and betting market movement to generate daily NFL picks. Every selection ships with a transparent confidence score, an edge rating, and a written breakdown of the key factors.",
    bullets: [
      { title: "Spreads & Totals", desc: "Point spread and over/under picks for every game, with weather and pace adjustments." },
      { title: "Player Props", desc: "QB, RB, and WR prop analysis powered by matchup-specific historical hit rates." },
      { title: "Sharp Money Signals", desc: "Steam move detection flags when professional money hits NFL lines." },
    ],
  },
  nba: {
    sportKey: "nba",
    sportName: "NBA",
    icon: "🏀",
    path: "/nba-picks",
    title: "NBA AI Picks Today — Spreads, Totals & Player Props | ChalkPicks",
    description:
      "Daily NBA AI picks backed by machine learning. Get NBA spreads, totals, and player prop picks with confidence scores and edge ratings.",
    h1: "NBA AI Picks",
    intro:
      "NBA markets move fast and reward speed. ChalkPicks models rest and travel schedules, pace, matchup-specific efficiency, usage rates, and late-breaking injury news to produce daily NBA picks with confidence scores — with a specialty in player props, the softest market on the board.",
    bullets: [
      { title: "Player Props Edge", desc: "Usage rates, defensive matchups, and historical hit rates drive our prop picks." },
      { title: "Back-to-Back Modeling", desc: "Rest and travel fatigue factors are quantified, not guessed." },
      { title: "Live Line Tracking", desc: "Catch NBA steam moves and line value before tip-off." },
    ],
  },
  mlb: {
    sportKey: "mlb",
    sportName: "MLB",
    icon: "⚾",
    path: "/mlb-picks",
    title: "MLB AI Picks Today — Moneylines, Run Lines & Totals | ChalkPicks",
    description:
      "AI-powered MLB picks updated daily. Moneyline, run line, and totals picks with pitcher analysis, confidence scores, and expected value ratings.",
    h1: "MLB AI Picks",
    intro:
      "Baseball is the modeler's sport. ChalkPicks' MLB engine weighs starting pitcher form, bullpen fatigue, park factors, weather, platoon splits, and umpire tendencies to produce daily moneyline, run line, and totals picks. Long daily slates mean more +EV opportunities than any other sport.",
    bullets: [
      { title: "Pitcher-First Analysis", desc: "Starting pitcher form and bullpen fatigue are the core of every MLB pick." },
      { title: "Park & Weather Factors", desc: "Wind, temperature, and park dimensions are priced into every total." },
      { title: "Daily +EV Volume", desc: "15-game slates create constant expected value windows across books." },
    ],
  },
  nhl: {
    sportKey: "nhl",
    sportName: "NHL",
    icon: "🏒",
    path: "/nhl-picks",
    title: "NHL AI Picks Today — Puck Lines, Totals & Moneylines | ChalkPicks",
    description:
      "Machine learning NHL picks for every slate. Puck line, moneyline, and totals picks with confidence scores, goalie analysis, and edge ratings.",
    h1: "NHL AI Picks",
    intro:
      "ChalkPicks' NHL model analyzes goaltender form, expected goals (xG) metrics, special teams efficiency, back-to-back scheduling, and line movement to generate daily NHL picks. Hockey's high variance rewards disciplined, data-driven betting more than any other sport.",
    bullets: [
      { title: "Goalie Confirmations", desc: "Picks adjust in real time when starting goalies are confirmed." },
      { title: "xG-Based Modeling", desc: "Expected goals metrics cut through hockey's shooting-percentage noise." },
      { title: "Puck Line Value", desc: "Find plus-money puck line spots backed by score-effects modeling." },
    ],
  },
};

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export default function SportPicks({ config }: { config: SportPicksConfig }) {
  const { data, isLoading } = trpc.picks.list.useQuery({
    sportKey: config.sportKey,
    tier: "all",
    limit: 12,
  });

  const picks = data?.picks ?? [];
  const otherSports = Object.values(SPORT_PICKS_CONFIGS).filter((c) => c.sportKey !== config.sportKey);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO title={config.title} description={config.description} canonicalPath={config.path} />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl mt-20">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="text-5xl mb-4">{config.icon}</div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Exo 2', sans-serif", color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.3)" }}
          >
            {config.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{config.intro}</p>
        </div>

        {/* Feature bullets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {config.bullets.map((b, i) => {
            const icons = [Brain, Target, TrendingUp];
            const Icon = icons[i % icons.length];
            const colors = ["#00ff88", "#00d4ff", "#a855f7"];
            return (
              <Card key={b.title} className="border-border" style={{ background: "rgba(12,12,28,0.8)" }}>
                <CardContent className="p-5">
                  <Icon className="w-6 h-6 mb-3" style={{ color: colors[i % colors.length] }} />
                  <h2 className="font-bold text-white mb-2" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {b.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Picks */}
        <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Latest {config.sportName} Picks
        </h2>
        {isLoading && <div className="text-center py-12 text-muted-foreground">Loading {config.sportName} picks...</div>}
        {!isLoading && picks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No active {config.sportName} picks right now — the AI engine publishes new picks every morning.{" "}
            <Link href="/picks" style={{ color: "#00ff88" }}>See all sports</Link>.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {picks.map((pick: any) => (
            <Card key={pick.id} className="border-border" style={{ background: "rgba(12,12,28,0.8)" }}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {String(pick.pickType ?? "").replace("_", "/")}
                  </span>
                  <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>
                    {formatOdds(pick.odds)}
                  </span>
                </div>
                <div className="font-bold text-white text-lg mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {pick.recommendation}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {pick.awayTeam} @ {pick.homeTeam}
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-bold" style={{ color: "#00ff88" }}>{pick.confidenceScore}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pick.confidenceScore}%`, background: "#00ff88" }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div
          className="p-8 rounded-xl text-center mb-12"
          style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}
        >
          <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Unlock Every {config.sportName} Pick with Full AI Analysis
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Premium members get the complete daily slate, confidence scores, edge ratings, the{" "}
            <Link href="/ev-finder" style={{ color: "#00ff88" }}>+EV finder</Link>, and the{" "}
            <Link href="/arbitrage" style={{ color: "#00ff88" }}>arbitrage scanner</Link>.
          </p>
          <Link href="/signup">
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
              <Zap className="w-4 h-4" /> START FREE
            </button>
          </Link>
        </div>

        {/* Cross links */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            More AI Picks
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherSports.map((s) => (
              <Link
                key={s.path}
                href={s.path}
                className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg transition-all hover:translate-y-[-1px]"
                style={{ color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}
              >
                {s.icon} {s.sportName} Picks <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
            <Link
              href="/daily-picks"
              className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg transition-all hover:translate-y-[-1px]"
              style={{ color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}
            >
              📅 Daily Picks Archive <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
