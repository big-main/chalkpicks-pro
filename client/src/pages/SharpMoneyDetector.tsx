import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Zap, BarChart3, Users } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { BreadcrumbJsonLd } from "@/components/seo/schema-jsonld";

const SPORTS = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "basketball_nba", label: "NBA" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
  { key: "soccer_epl", label: "EPL" },
];

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = { high: "bg-red-500/20 text-red-400 border-red-500/30", medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", low: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  return <Badge className={`${colors[confidence]} border text-xs`}>{confidence.toUpperCase()}</Badge>;
}

function SteamTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    steam_move: "⚡ Steam Move",
    reverse_line_movement: "↔ Reverse Line",
    sharp_action: "🎯 Sharp Action",
  };
  return <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">{labels[type] ?? type}</Badge>;
}

function SharpMoneyContent() {
  const [sport, setSport] = useState("americanfootball_nfl");
  const [tab, setTab] = useState("steam");

  const steamQuery = trpc.sharpMoney.getSteamMoves.useQuery({ sport, minMagnitude: 2 }, { refetchInterval: 120000 });
  const consensusQuery = trpc.sharpMoney.getConsensus.useQuery({ sport }, { refetchInterval: 120000 });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "https://chalkpicks.live" }, { name: "Sharp Money Detector", url: "https://chalkpicks.live/sharp-money" }]} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              Sharp Money Detector
            </h1>
            <p className="text-slate-400 mt-1">Real-time steam moves and reverse line movement alerts</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => { steamQuery.refetch(); consensusQuery.refetch(); }} className="border-slate-700">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200 text-sm">
            <strong>Steam Move:</strong> When the line moves against the public betting % — sharp bettors (syndicates, wiseguys) are on the other side.
            <strong className="ml-2">Reverse Line Movement:</strong> Public bets heavily on Team A but the line moves toward Team B = sharp money on B.
          </AlertDescription>
        </Alert>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="steam" className="data-[state=active]:bg-emerald-600">
              <Zap className="h-4 w-4 mr-1" /> Steam Moves ({steamQuery.data?.sharpMoveCount ?? 0})
            </TabsTrigger>
            <TabsTrigger value="consensus" className="data-[state=active]:bg-emerald-600">
              <Users className="h-4 w-4 mr-1" /> Public Consensus
            </TabsTrigger>
          </TabsList>

          {/* Steam Moves Tab */}
          <TabsContent value="steam" className="space-y-4 mt-4">
            {steamQuery.isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading steam moves...</div>
            ) : steamQuery.data?.steamMoves.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  No significant steam moves detected for {SPORTS.find(s => s.key === sport)?.label ?? sport} right now.
                </CardContent>
              </Card>
            ) : (
              steamQuery.data?.steamMoves.map((move) => (
                <Card key={move.eventId} className="bg-slate-900 border-slate-700 hover:border-emerald-500/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ConfidenceBadge confidence={move.confidence} />
                          <SteamTypeBadge type={move.steamType} />
                          <span className="text-xs text-slate-500">{move.bookmaker}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {move.homeTeam} vs {move.awayTeam}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{formatTime(move.commenceTime)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                          {move.sharpSide === move.homeTeam ? move.homeTeam.split(" ").pop() : move.awayTeam.split(" ").pop()}
                        </div>
                        <div className="text-xs text-slate-400">Sharp side</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Public Bet %</div>
                        <div className="text-lg font-bold text-slate-300">{move.publicPct}%</div>
                        <div className="text-xs text-slate-500">on {move.homeTeam.split(" ").pop()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Open Line</div>
                        <div className="text-lg font-bold text-slate-300">{move.openLine > 0 ? `+${move.openLine}` : move.openLine}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Current Line</div>
                        <div className="text-lg font-bold text-white">{move.currentLine > 0 ? `+${move.currentLine}` : move.currentLine}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Line Move</div>
                        <div className={`text-lg font-bold flex items-center justify-center gap-1 ${move.lineMove < 0 ? "text-red-400" : "text-green-400"}`}>
                          {move.lineMove < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                          {move.lineMove > 0 ? `+${move.lineMove}` : move.lineMove}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-300">
                        <span className="text-yellow-400 font-semibold">Sharp Signal:</span>{" "}
                        {move.publicPct}% of public bets on {move.homeTeam.split(" ").pop()} but the line moved{" "}
                        {move.lineMove < 0 ? "toward" : "away from"} {move.homeTeam.split(" ").pop()} by{" "}
                        {Math.abs(move.lineMove)} points — indicating sharp money on{" "}
                        <span className="text-emerald-400 font-semibold">{move.sharpSide}</span>.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Consensus Tab */}
          <TabsContent value="consensus" className="mt-4">
            {consensusQuery.isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading consensus data...</div>
            ) : (
              <div className="space-y-3">
                {consensusQuery.data?.consensus.map((game) => (
                  <Card key={game.eventId} className="bg-slate-900 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{game.homeTeam} vs {game.awayTeam}</h3>
                          <p className="text-xs text-slate-400">{formatTime(game.commenceTime)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.sharpIndicator !== "none" && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                              🎯 Sharp on {game.sharpIndicator === "home" ? game.homeTeam.split(" ").pop() : game.awayTeam.split(" ").pop()}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">Spread: {game.currentSpread > 0 ? `+${game.currentSpread}` : game.currentSpread}</span>
                        </div>
                      </div>

                      {/* Public Bet % bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{game.homeTeam.split(" ").pop()}</span>
                            <span>{game.homePublicPct}% bets / {game.homeMoneyPct}% money</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${game.homePublicPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{game.awayTeam.split(" ").pop()}</span>
                            <span>{game.awayPublicPct}% bets / {game.awayMoneyPct}% money</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${game.awayPublicPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SharpMoneyDetector() {
  return (
    <FeatureGate feature="evFinder">
      <SharpMoneyContent />
    </FeatureGate>
  );
}
