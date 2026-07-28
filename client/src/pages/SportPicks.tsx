import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { FAQPageJsonLd, SportsEventJsonLd } from "@/components/SportsEventJsonLd";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { TrendingUp, Calendar, Target, BarChart3, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface SportConfig {
  key: string;
  name: string;
  fullName: string;
  slug: string;
  description: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const SPORT_PICKS_CONFIGS = {
  nfl: "nfl-picks",
  nba: "nba-picks",
  mlb: "mlb-picks",
  nhl: "nhl-picks",
  ncaaf: "ncaaf-picks",
  ncaab: "ncaab-picks",
  mma: "mma-picks",
  soccer: "soccer-picks",
} as const;

const SPORT_CONFIGS: Record<string, SportConfig> = {
  "nfl-picks": {
    key: "americanfootball_nfl",
    name: "NFL",
    fullName: "National Football League",
    slug: "nfl-picks",
    description: "AI-powered NFL picks with confidence scores, spread analysis, and moneyline recommendations. Get expert NFL predictions backed by machine learning models analyzing 50+ statistical factors.",
    faqs: [
      { question: "How accurate are ChalkPicks NFL picks?", answer: "Our AI model has maintained a 73%+ win rate on NFL moneyline picks over the past 2 seasons, verified on our transparent performance page. We track every pick publicly." },
      { question: "What data does ChalkPicks use for NFL predictions?", answer: "We analyze 50+ factors including team efficiency ratings (DVOA), injury reports, weather data, historical matchup trends, line movement from 15+ sportsbooks, and closing line value (CLV) patterns." },
      { question: "When are NFL picks released?", answer: "NFL picks are released Tuesday-Wednesday for the upcoming week's games, with final updates by Friday. Primetime game picks (TNF, SNF, MNF) get dedicated analysis." },
      { question: "Does ChalkPicks offer NFL prop picks?", answer: "Yes. Our Prop Optimizer analyzes player props (passing yards, rushing yards, receptions, TDs) using correlation data and identifies +EV opportunities across sportsbooks." },
    ],
  },
  "nba-picks": {
    key: "basketball_nba",
    name: "NBA",
    fullName: "National Basketball Association",
    slug: "nba-picks",
    description: "AI-generated NBA picks with real-time odds comparison, player prop analysis, and +EV identification. Our models analyze pace, efficiency, rest days, and back-to-back performance.",
    faqs: [
      { question: "How does ChalkPicks generate NBA picks?", answer: "Our AI analyzes team efficiency ratings, pace of play, rest advantages, travel distance, injury impact, and real-time line movement across 15+ sportsbooks to identify +EV opportunities." },
      { question: "Are NBA totals included?", answer: "Yes. We provide over/under picks with pace-adjusted projections. Our totals model factors in pace, defensive rating, rest days, and altitude effects." },
      { question: "What is the NBA pick win rate?", answer: "Our NBA moneyline picks have maintained a 71%+ win rate this season. All results are tracked transparently on our performance dashboard." },
      { question: "Do you cover NBA player props?", answer: "Yes. Our Prop Optimizer covers points, rebounds, assists, threes, and combo props with correlation-aware analysis and +EV identification." },
    ],
  },
  "mlb-picks": {
    key: "baseball_mlb",
    name: "MLB",
    fullName: "Major League Baseball",
    slug: "mlb-picks",
    description: "Data-driven MLB picks using starting pitcher analysis, bullpen usage, park factors, and platoon splits. AI-powered baseball predictions with moneyline, run line, and totals.",
    faqs: [
      { question: "What factors drive ChalkPicks MLB picks?", answer: "Starting pitcher matchups (ERA, FIP, xFIP, K%), bullpen availability, park factors, platoon splits, weather (wind/humidity), and umpire tendencies all feed into our MLB model." },
      { question: "How often are MLB picks updated?", answer: "MLB picks are generated daily by 10am ET with lineup-confirmed updates by 5pm ET. We adjust for late scratches and lineup changes." },
      { question: "Does ChalkPicks cover MLB run lines?", answer: "Yes. We provide moneyline, run line (-1.5), and totals picks for every MLB game with confidence scores and recommended bet sizing." },
      { question: "What is the MLB pick accuracy?", answer: "Our MLB model targets 57%+ on moneyline picks (profitable at standard -110 juice) with a focus on +EV identification rather than raw win rate." },
    ],
  },
  "nhl-picks": {
    key: "icehockey_nhl",
    name: "NHL",
    fullName: "National Hockey League",
    slug: "nhl-picks",
    description: "AI-powered NHL picks analyzing Corsi, expected goals (xG), goaltender matchups, and back-to-back fatigue. Get puck line, moneyline, and totals predictions.",
    faqs: [
      { question: "What analytics does ChalkPicks use for NHL?", answer: "We analyze Corsi/Fenwick possession metrics, expected goals (xG), goaltender save percentage trends, power play efficiency, and back-to-back fatigue factors." },
      { question: "Are NHL puck line picks available?", answer: "Yes. We provide moneyline, puck line (-1.5/+1.5), and totals picks for every NHL game with confidence scores and Kelly-based bet sizing." },
      { question: "How does goaltender analysis work?", answer: "Our model tracks goaltender form (last 10 games save %), workload, rest days, and historical performance against specific opponents and shot volume." },
      { question: "When are NHL picks posted?", answer: "NHL picks are released by 12pm ET on game days with final updates by 4pm ET after goaltender confirmations." },
    ],
  },
  "ncaaf-picks": {
    key: "americanfootball_ncaaf",
    name: "NCAAF",
    fullName: "NCAA Football",
    slug: "ncaaf-picks",
    description: "College football picks powered by SP+ ratings, recruiting rankings, transfer portal impact, and conference strength analysis. AI predictions for every FBS game.",
    faqs: [
      { question: "How does ChalkPicks handle college football?", answer: "We use SP+ efficiency ratings, recruiting composite rankings, transfer portal impact scores, returning production metrics, and conference strength adjustments for NCAAF predictions." },
      { question: "Are bowl game and playoff picks included?", answer: "Yes. We provide enhanced analysis for bowl games and CFP matchups with additional factors like motivation, travel, and preparation time." },
      { question: "What about early season NCAAF picks?", answer: "Early season picks weight returning production, recruiting rankings, and coaching changes more heavily until sufficient 2026 game data is available." },
      { question: "Do you cover NCAAF player props?", answer: "Player props are available for marquee games where sportsbooks offer markets. Coverage expands as the season progresses." },
    ],
  },
  "ncaab-picks": {
    key: "basketball_ncaab",
    name: "NCAAB",
    fullName: "NCAA Basketball",
    slug: "ncaab-picks",
    description: "College basketball picks using KenPom ratings, tempo analysis, and tournament projections. AI-powered NCAAB predictions for regular season and March Madness.",
    faqs: [
      { question: "What metrics drive NCAAB picks?", answer: "We use KenPom-style efficiency ratings, tempo adjustments, strength of schedule, home court advantage (worth ~3.5 points in college), and conference tournament form." },
      { question: "Does ChalkPicks cover March Madness?", answer: "Yes. We provide bracket predictions, game-by-game picks, and upset probability analysis for the entire NCAA Tournament with enhanced modeling." },
      { question: "How accurate are college basketball picks?", answer: "Our NCAAB model targets ATS (against the spread) profitability with a focus on identifying mispriced lines in mid-major and conference games." },
      { question: "When do NCAAB picks go live?", answer: "College basketball picks are released daily by 11am ET during the season, with March Madness picks available as soon as matchups are set." },
    ],
  },
  "mma-picks": {
    key: "mma_mixed_martial_arts",
    name: "MMA",
    fullName: "Mixed Martial Arts (UFC)",
    slug: "mma-picks",
    description: "UFC and MMA picks using striking differentials, grappling metrics, reach advantages, and fight style matchup analysis. AI predictions for every UFC card.",
    faqs: [
      { question: "What data does ChalkPicks use for MMA picks?", answer: "We analyze striking accuracy, takedown defense, submission rates, reach differentials, cardio patterns (round-by-round stats), and historical style matchup data." },
      { question: "Are UFC prop picks available?", answer: "Yes. We cover method of victory (KO/TKO, submission, decision), round totals, and fight-to-go-the-distance markets for main card fights." },
      { question: "How early are UFC picks released?", answer: "UFC picks are released Monday of fight week with updates after weigh-ins (Friday). We adjust for late replacements and weight-miss situations." },
      { question: "Does ChalkPicks cover non-UFC MMA?", answer: "Primary focus is UFC, but we cover major Bellator and PFL events when sportsbook markets are available." },
    ],
  },
  "soccer-picks": {
    key: "soccer_epl",
    name: "Soccer",
    fullName: "Soccer (EPL, MLS, La Liga)",
    slug: "soccer-picks",
    description: "AI soccer predictions for Premier League, MLS, La Liga, and Champions League. Analysis includes xG models, form ratings, and Asian handicap recommendations.",
    faqs: [
      { question: "What soccer leagues does ChalkPicks cover?", answer: "We cover English Premier League (EPL), MLS, La Liga, Champions League, and Europa League with full moneyline, spread (Asian handicap), and totals analysis." },
      { question: "How does the soccer model work?", answer: "We use expected goals (xG) models, team form ratings (last 5/10 games), home/away splits, injury impact, and historical head-to-head data for predictions." },
      { question: "Are draw predictions included?", answer: "Yes. Our three-way model provides win/draw/loss probabilities. We identify +EV draw opportunities which are often mispriced by US sportsbooks." },
      { question: "Do you cover in-play soccer betting?", answer: "Our pre-match analysis includes expected goal timings and momentum indicators, but we don't currently provide live in-play recommendations." },
    ],
  },
};

export default function SportPicks(props: any) {
  const configSlug = props?.config as string | undefined;
  const routeParams = props?.params as Record<string, string> | undefined;
  const [, hookParams] = useRoute("/:slug");
  const slug = configSlug || routeParams?.slug || hookParams?.slug || "";
  const config = SPORT_CONFIGS[slug];

  useEffect(() => {
    if (config) {
      document.title = `${config.name} Picks Today | AI ${config.fullName} Predictions | ChalkPicks`;
    }
  }, [config]);

  const { data, isLoading } = trpc.picks.list.useQuery(
    { sportKey: config?.key || undefined, tier: "all", limit: 10 },
    { enabled: !!config }
  );
  const picks = data?.picks;

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold">Sport Not Found</h1>
          <p className="text-muted-foreground mt-4">The requested sport page doesn't exist.</p>
          <Link href="/picks" className="text-primary mt-4 inline-block">View All Picks →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FAQPageJsonLd faqs={config.faqs} pageId={config.slug} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {config.name} Picks
              </span>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                Updated Daily
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              AI-Powered {config.name} Picks & Predictions
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {config.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Get Pro Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/performance" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors">
                View Win Rate <BarChart3 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Picks Preview */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold mb-6">Today's {config.name} Picks</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl p-6 border border-border">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : picks && picks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {picks.slice(0, 6).map((pick: any, i: number) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
                <SportsEventJsonLd
                  name={`${pick.awayTeam || pick.team} at ${pick.homeTeam || pick.opponent}`}
                  homeTeam={pick.homeTeam || pick.opponent || ""}
                  awayTeam={pick.awayTeam || pick.team || ""}
                  startDate={pick.gameTime || new Date().toISOString()}
                  sport={config.fullName}
                />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{config.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pick.confidence >= 80 ? "bg-green-500/10 text-green-500" : pick.confidence >= 70 ? "bg-yellow-500/10 text-yellow-500" : "bg-muted text-muted-foreground"}`}>
                    {pick.confidence}% conf
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{pick.team || pick.pick}</h3>
                <p className="text-sm text-muted-foreground mb-3">{pick.matchup || `${pick.awayTeam} @ ${pick.homeTeam}`}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pick.odds > 0 ? "+" : ""}{pick.odds}</span>
                  <span className="text-xs text-muted-foreground">{pick.betType || "moneyline"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {config.name} games scheduled today. Check back on game day.</p>
          </div>
        )}

        {picks && picks.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/picks" className="text-primary hover:underline inline-flex items-center gap-1">
              View all picks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="container py-12 border-t border-border/50">
        <h2 className="text-2xl font-bold mb-8">What's Included in {config.name} Analysis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <TrendingUp className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">+EV Finder</h3>
            <p className="text-sm text-muted-foreground">Real-time positive expected value bets across 15+ sportsbooks with devigged fair odds.</p>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <Target className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Prop Optimizer</h3>
            <p className="text-sm text-muted-foreground">AI-powered player prop recommendations with correlation analysis and edge scoring.</p>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <Zap className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Steam Moves</h3>
            <p className="text-sm text-muted-foreground">Sharp money alerts and reverse line movement detection for {config.name} games.</p>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <BarChart3 className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">CLV Tracking</h3>
            <p className="text-sm text-muted-foreground">Track your closing line value to measure betting sharpness over time.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-12 border-t border-border/50">
        <h2 className="text-2xl font-bold mb-8">{config.name} Picks FAQ</h2>
        <div className="max-w-3xl space-y-6">
          {config.faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Start Getting {config.name} Picks Today</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of bettors using AI-powered analytics to find +EV opportunities in {config.fullName}.
        </p>
        <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:bg-primary/90 transition-colors">
          Get Started — $19.99/mo <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
      <ComplianceFooter />
    </div>
  );
}
