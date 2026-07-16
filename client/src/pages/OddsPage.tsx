import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { FAQPageJsonLd, SportsEventJsonLd } from "@/components/SportsEventJsonLd";
import { TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Paywall } from "@/components/Paywall";

interface OddsSportConfig {
  key: string;
  name: string;
  fullName: string;
  slug: string;
  description: string;
}

const ODDS_CONFIGS: Record<string, OddsSportConfig> = {
  nfl: { key: "americanfootball_nfl", name: "NFL", fullName: "National Football League", slug: "nfl", description: "Compare NFL odds across DraftKings, FanDuel, BetMGM, Caesars, and more. Find the best moneyline, spread, and total odds for every NFL game." },
  nba: { key: "basketball_nba", name: "NBA", fullName: "National Basketball Association", slug: "nba", description: "Real-time NBA odds comparison across 15+ sportsbooks. Find the best lines for moneyline, spread, and over/under bets." },
  mlb: { key: "baseball_mlb", name: "MLB", fullName: "Major League Baseball", slug: "mlb", description: "Compare MLB odds across all major sportsbooks. Find the best moneyline and run line odds for today's baseball games." },
  nhl: { key: "icehockey_nhl", name: "NHL", fullName: "National Hockey League", slug: "nhl", description: "NHL odds comparison across DraftKings, FanDuel, BetMGM, and more. Find the best puck line and moneyline odds." },
};

const ODDS_FAQS = [
  { question: "How often are odds updated?", answer: "Odds are refreshed every 60 seconds from The Odds API, pulling real-time data from 15+ US-legal sportsbooks including DraftKings, FanDuel, BetMGM, Caesars, PointsBet, and BetRivers." },
  { question: "What is the devig (no-vig) line?", answer: "The devig line removes the bookmaker's margin (vig/juice) using proportional normalization. We use the sharpest book (lowest hold) as the reference to calculate fair (no-vig) probabilities." },
  { question: "How do I find +EV bets?", answer: "Our +EV Finder compares each sportsbook's offered odds against the devigged fair line. Any bet where the offered odds are better than the fair odds has positive expected value (+EV)." },
  { question: "What does 'hold' mean?", answer: "Hold (or vig/juice) is the bookmaker's built-in margin. For example, -110/-110 has a 4.76% hold. Lower hold means fairer odds. Pinnacle typically has the lowest hold." },
];

export default function OddsPage() {
  const [, params] = useRoute("/odds/:sport");
  const sport = params?.sport || "";
  const config = ODDS_CONFIGS[sport];
  const { isAuthenticated } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const hasPremiumAccess = subscription?.isActive;

  useEffect(() => {
    if (config) {
      document.title = `${config.name} Odds Today | Compare Lines Across Sportsbooks | ChalkPicks`;
    }
  }, [config]);

  const { data, isLoading, refetch } = trpc.odds.getLiveOdds.useQuery(
    { sport: config?.key || "" },
    { enabled: !!config && !!hasPremiumAccess, refetchInterval: 60000 }
  );

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold">Sport Not Found</h1>
          <Link href="/odds-comparison" className="text-primary mt-4 inline-block">View All Odds →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FAQPageJsonLd faqs={ODDS_FAQS} pageId={`odds-${config.slug}`} />

      {/* Hero */}
      <section className="border-b border-border/50">
        <div className="container py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {config.name} Odds Comparison
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            {config.description}
          </p>
          <div className="flex gap-3">
            <Link href={`/${config.slug}-picks`} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
              {config.name} Picks <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/ev-finder" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
              +EV Finder <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Odds Table */}
      <section className="container py-8">
        {!hasPremiumAccess ? (
          <Paywall
            tier="monthly"
            title={`${config.name} Live Odds`}
            description="Get real-time odds comparison across 15+ sportsbooks with our Pro plan."
          />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl p-6 border border-border">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : data?.games && data.games.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {data.games.length} games • Updated {new Date(data.updatedAt).toLocaleTimeString()}
              </p>
              <button onClick={() => refetch()} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {data.games.map((game: any, i: number) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border">
                <SportsEventJsonLd
                  name={`${game.awayTeam} at ${game.homeTeam}`}
                  homeTeam={game.homeTeam}
                  awayTeam={game.awayTeam}
                  startDate={game.commenceTime}
                  sport={config.fullName}
                  odds={{ home: game.bestHomeOdds, away: game.bestAwayOdds, book: game.bestHomeBook }}
                />
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{game.awayTeam} @ {game.homeTeam}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(game.commenceTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Best Home</span>
                    <p className="font-mono font-semibold text-green-500">{game.bestHomeOdds > 0 ? "+" : ""}{game.bestHomeOdds}</p>
                    <p className="text-xs text-muted-foreground">{game.bestHomeBook}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Best Away</span>
                    <p className="font-mono font-semibold text-green-500">{game.bestAwayOdds > 0 ? "+" : ""}{game.bestAwayOdds}</p>
                    <p className="text-xs text-muted-foreground">{game.bestAwayBook}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Fair Home</span>
                    <p className="font-mono">{game.fairHomeOdds > 0 ? "+" : ""}{game.fairHomeOdds}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Fair Away</span>
                    <p className="font-mono">{game.fairAwayOdds > 0 ? "+" : ""}{game.fairAwayOdds}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Hold: {game.hold}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <p className="text-muted-foreground">No {config.name} games with odds available right now.</p>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="container py-12 border-t border-border/50">
        <h2 className="text-2xl font-bold mb-6">Odds Comparison FAQ</h2>
        <div className="max-w-3xl space-y-4">
          {ODDS_FAQS.map((faq, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border">
              <h3 className="font-semibold mb-1">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
