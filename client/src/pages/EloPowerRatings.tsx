import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Activity, Zap, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const SPORTS = [
  { key: "nfl" as const, name: "NFL" },
  { key: "nba" as const, name: "NBA" },
  { key: "mlb" as const, name: "MLB" },
  { key: "nhl" as const, name: "NHL" },
];

export default function EloPowerRatings() {
  const [sport, setSport] = useState<"nfl" | "nba" | "mlb" | "nhl">("nfl");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [showPredict, setShowPredict] = useState(false);

  const { data: ratingsData, isLoading } = trpc.quant.eloRatings.useQuery({ sport });
  const { data: health } = trpc.quant.health.useQuery();

  const { data: prediction, isLoading: predicting } = trpc.quant.eloPredict.useQuery(
    { home_team: homeTeam, away_team: awayTeam, sport },
    { enabled: showPredict && homeTeam.length > 2 && awayTeam.length > 2 }
  );

  const ratings = ratingsData?.ratings ?? [];

  const chartData = ratings.slice(0, 20).map((r) => ({
    team: r.team.replace(/ /g, "\n"),
    rating: Math.round(r.rating),
    wins: r.wins,
    losses: r.losses,
  }));

  const getStreakIcon = (streak: number) => {
    if (streak > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (streak < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRatingColor = (rating: number, allRatings: number[]) => {
    if (allRatings.length === 0) return "text-gray-300";
    const max = Math.max(...allRatings);
    const min = Math.min(...allRatings);
    const pct = (rating - min) / (max - min);
    if (pct > 0.7) return "text-green-400";
    if (pct > 0.4) return "text-yellow-400";
    return "text-red-400";
  };

  const allRatingValues = ratings.map((r) => r.rating);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              Elo Power Ratings
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-computed team strength ratings using the Elo system. Updated after every game.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.online ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-muted-foreground">
              {health?.online ? "Quant Engine Online" : "Quant Engine Offline"}
            </span>
          </div>
        </div>

        {/* Sport selector */}
        <div className="flex gap-2 mb-6">
          {SPORTS.map((s) => (
            <Button
              key={s.key}
              variant={sport === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSport(s.key)}
            >
              {s.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : ratings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No Elo ratings yet for {sport.toUpperCase()}. Ratings are computed as games are played.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bar chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Top 20 Teams by Elo Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="team"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#f9fafb" }}
                      formatter={(v: number) => [v, "Elo Rating"]}
                    />
                    <Bar dataKey="rating" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={index < 5 ? "#22c55e" : index < 10 ? "#eab308" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ratings table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Full Rankings — {sport.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rank</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Team</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Elo</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">W</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">L</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Win%</th>
                        <th className="text-center px-4 py-3 text-muted-foreground font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.map((r, i) => {
                        const total = r.wins + r.losses;
                        const winPct = total > 0 ? ((r.wins / total) * 100).toFixed(1) : "—";
                        return (
                          <tr key={r.team} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground font-mono">#{i + 1}</td>
                            <td className="px-4 py-3 font-medium">{r.team}</td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${getRatingColor(r.rating, allRatingValues)}`}>
                              {Math.round(r.rating)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-400">{r.wins}</td>
                            <td className="px-4 py-3 text-right text-red-400">{r.losses}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{winPct}%</td>
                            <td className="px-4 py-3 flex justify-center">{getStreakIcon(r.streak)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Win Probability Predictor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-yellow-400" />
              Win Probability Predictor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Home Team</Label>
                <Input
                  placeholder="e.g. Kansas City Chiefs"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Away Team</Label>
                <Input
                  placeholder="e.g. Las Vegas Raiders"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => setShowPredict(true)}
                  disabled={homeTeam.length < 3 || awayTeam.length < 3 || predicting}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {predicting ? "Calculating..." : "Predict"}
                </Button>
              </div>
            </div>

            {prediction && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Home Win Probability</p>
                  <p className="text-3xl font-bold text-green-400">{(prediction.home_win_prob * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-1">{prediction.home_team}</p>
                  <Badge variant="outline" className="mt-2 text-xs">Elo: {Math.round(prediction.home_elo)}</Badge>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Away Win Probability</p>
                  <p className="text-3xl font-bold text-blue-400">{(prediction.away_win_prob * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-1">{prediction.away_team}</p>
                  <Badge variant="outline" className="mt-2 text-xs">Elo: {Math.round(prediction.away_elo)}</Badge>
                </div>
                {prediction.implied_spread !== 0 && (
                  <div className="col-span-2 bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Implied Spread</p>
                    <p className="text-xl font-bold">
                      {prediction.implied_spread > 0
                        ? `${prediction.home_team} -${prediction.implied_spread.toFixed(1)}`
                        : `${prediction.away_team} -${Math.abs(prediction.implied_spread).toFixed(1)}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
