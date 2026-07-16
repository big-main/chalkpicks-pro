import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Zap, AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const SPORT_LABELS: Record<string, string> = {
  americanfootball_nfl: "NFL",
  basketball_nba: "NBA",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
};

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function PublicPercentBar({ homePct, awayPct, homeTeam, awayTeam }: {
  homePct: number;
  awayPct: number;
  homeTeam: string;
  awayTeam: string;
}) {
  const homeShort = homeTeam.split(" ").pop() ?? homeTeam;
  const awayShort = awayTeam.split(" ").pop() ?? awayTeam;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{awayShort} {awayPct}%</span>
        <span>{homeShort} {homePct}%</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${awayPct}%` }}
        />
        <div
          className="bg-amber-500 transition-all duration-500"
          style={{ width: `${homePct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-blue-400">Away</span>
        <span className="text-amber-400">Home</span>
      </div>
    </div>
  );
}

function ContrarianBadge({ signal }: { signal: "strong" | "moderate" | "none" }) {
  if (signal === "none") return null;
  return (
    <Badge
      className={signal === "strong"
        ? "bg-red-900/60 text-red-300 border border-red-700 text-xs"
        : "bg-yellow-900/60 text-yellow-300 border border-yellow-700 text-xs"
      }
    >
      {signal === "strong" ? "⚡ Strong Contrarian" : "~ Moderate Contrarian"}
    </Badge>
  );
}

function GameCard({ game }: { game: {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  homeOdds: number;
  awayOdds: number;
  homeSpread: number | null;
  awaySpread: number | null;
  publicPctHome: number;
  publicPctAway: number;
  bookCount: number;
  cpPick: string | null;
  cpConfidence: number | null;
  contrarianSignal: "strong" | "moderate" | "none";
  homeImpliedProb: number;
  awayImpliedProb: number;
}}) {
  const [showInsight, setShowInsight] = useState(false);
  const { data: insightData, isLoading: insightLoading } = trpc.consensus.getInsight.useQuery(
    {
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      publicPctHome: game.publicPctHome,
      publicPctAway: game.publicPctAway,
      homeOdds: game.homeOdds,
      awayOdds: game.awayOdds,
      cpPick: game.cpPick,
      cpConfidence: game.cpConfidence,
    },
    { enabled: showInsight }
  );

  const gameTime = new Date(game.commenceTime);
  const isToday = gameTime.toDateString() === new Date().toDateString();

  return (
    <Card className="border border-border hover:border-primary/40 transition-colors">
      <CardContent className="pt-4 pb-4">
        {/* Header: Teams + Time */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">{game.awayTeam}</span>
              <span className="text-muted-foreground text-xs">@</span>
              <span className="font-semibold text-sm text-foreground">{game.homeTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isToday ? "Today" : gameTime.toLocaleDateString()} · {gameTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {game.bookCount > 0 && (
                <span className="text-xs text-muted-foreground">· {game.bookCount} books</span>
              )}
            </div>
          </div>
          <ContrarianBadge signal={game.contrarianSignal} />
        </div>

        {/* Odds Row */}
        <div className="flex gap-4 mb-3 text-sm">
          <div className="flex-1 bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">{game.awayTeam.split(" ").pop()} ML</div>
            <div className="font-mono font-semibold text-foreground">{formatOdds(game.awayOdds)}</div>
            <div className="text-xs text-muted-foreground">{game.awayImpliedProb}% imp.</div>
          </div>
          {game.awaySpread !== null && (
            <div className="flex-1 bg-muted/20 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground mb-1">Spread</div>
              <div className="font-mono font-semibold text-foreground">{formatOdds(game.awaySpread)}</div>
            </div>
          )}
          <div className="flex-1 bg-muted/20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">{game.homeTeam.split(" ").pop()} ML</div>
            <div className="font-mono font-semibold text-foreground">{formatOdds(game.homeOdds)}</div>
            <div className="text-xs text-muted-foreground">{game.homeImpliedProb}% imp.</div>
          </div>
        </div>

        {/* Public Betting % */}
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Public Betting %</span>
          </div>
          <PublicPercentBar
            homePct={game.publicPctHome}
            awayPct={game.publicPctAway}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
          />
        </div>

        {/* ChalkPicks AI Pick */}
        {game.cpPick && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded bg-primary/10 border border-primary/20">
            <Zap className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-xs text-primary font-medium">CP Pick:</span>
            <span className="text-xs text-foreground truncate">{game.cpPick}</span>
            {game.cpConfidence && (
              <Badge className="ml-auto text-xs bg-primary/20 text-primary border-primary/30">
                {game.cpConfidence}%
              </Badge>
            )}
          </div>
        )}

        {/* AI Insight Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground h-7"
          onClick={() => setShowInsight(!showInsight)}
        >
          <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showInsight ? "rotate-180" : ""}`} />
          {showInsight ? "Hide" : "Show"} AI Insight
        </Button>

        {showInsight && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 p-3 rounded bg-muted/20 border border-border"
          >
            {insightLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {typeof insightData?.insight === "string" ? insightData.insight : "No insight available."}
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConsensusAggregator() {
  const [selectedSport, setSelectedSport] = useState("americanfootball_nfl");

  const { data: sportsData } = trpc.consensus.getSports.useQuery();
  const { data, isLoading, refetch, isFetching } = trpc.consensus.getGames.useQuery(
    { sport: selectedSport },
    { staleTime: 5 * 60 * 1000 }
  );

  const games = data?.games ?? [];
  const error = data?.error;

  const contrarianGames = games.filter((g) => g.contrarianSignal !== "none");

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-primary w-7 h-7" />
          <h1 className="text-3xl font-bold">Consensus Aggregator</h1>
        </div>
        <p className="text-muted-foreground">
          Compare public betting percentages against ChalkPicks AI recommendations to find contrarian value plays.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(sportsData ?? Object.entries(SPORT_LABELS).map(([key, label]) => ({ key, label }))).map((s) => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          {games.length} games · {contrarianGames.length} contrarian signals
        </span>
      </div>

      {/* Contrarian Alert Banner */}
      {contrarianGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-amber-950/40 border border-amber-700/50 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {contrarianGames.length} Contrarian Signal{contrarianGames.length > 1 ? "s" : ""} Detected
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              ChalkPicks AI is backing the side getting less public action — historically a sharp indicator.
            </p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Away betting %</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Home betting %</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-primary" />
          <span>CP AI Pick</span>
        </div>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No games available</p>
          <p className="text-sm mt-1">Check back closer to game time or select a different sport.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contrarian games first */}
          {[...games].sort((a, b) => {
            const order = { strong: 0, moderate: 1, none: 2 };
            return order[a.contrarianSignal] - order[b.contrarianSignal];
          }).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* How It Works */}
      <Card className="mt-10 border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary" /> How Consensus Aggregator Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Public Betting %</strong> shows the estimated percentage of bettors backing each side, derived from consensus odds across major sportsbooks.
          </p>
          <p>
            <strong className="text-foreground">Contrarian Signals</strong> appear when ChalkPicks AI recommends the side receiving less than 48% of public action — historically, sharp money often moves against the crowd.
          </p>
          <p>
            <strong className="text-foreground">AI Insight</strong> provides a 2-sentence analysis combining public action, implied probability, and ChalkPicks recommendation for each game.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
