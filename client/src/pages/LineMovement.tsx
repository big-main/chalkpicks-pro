import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

function LowBalanceModal({ required, balance, onClose }: { required: number; balance: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-yellow-500/50 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-gold">
            <AlertTriangle className="h-5 w-5" />
            Insufficient Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This tool requires <span className="font-bold text-white">{required} credits</span> per use.
            Your current balance is <span className="font-bold text-brand-red">${balance.toFixed(2)}</span>.
          </p>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-brand-green">💡 Spend $5 and get $100 in free credits!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => window.location.href = "/credits"} className="flex-1 bg-brand-green/80 hover:bg-brand-green">
              <DollarSign className="h-4 w-4 mr-1" /> Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LineMovementContent() {
  const [sport, setSport] = useState<"nba" | "nfl" | "mlb" | "nhl">("nba");
  const [sharpOnly, setSharpOnly] = useState(false);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [lowBalanceInfo, setLowBalanceInfo] = useState({ required: 0, balance: 0 });

  const lineMutation = trpc.tools.lineMovement.useMutation({
    onSuccess: (data) => {
      if (data.error === "insufficient_credits") {
        setLowBalanceInfo({ required: data.required!, balance: data.balance! });
        setShowLowBalance(true);
      }
    },
  });

  const handleTrack = () => {
    lineMutation.mutate({ sport, sharpOnly });
  };

  const data = lineMutation.data?.data;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {showLowBalance && (
        <LowBalanceModal
          required={lowBalanceInfo.required}
          balance={lowBalanceInfo.balance}
          onClose={() => setShowLowBalance(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-brand-blue" />
              Line Movement Tracker
            </h1>
            <p className="text-gray-400 mt-1">Track real-time line movements and detect sharp money action</p>
          </div>
          <Badge variant="outline" className="text-brand-blue border-brand-blue/50 px-3 py-1">
            1 credit/use
          </Badge>
        </div>

        {/* Controls */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Sport</label>
                <Select value={sport} onValueChange={(v) => setSport(v as any)}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nba">NBA</SelectItem>
                    <SelectItem value="nfl">NFL</SelectItem>
                    <SelectItem value="mlb">MLB</SelectItem>
                    <SelectItem value="nhl">NHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={sharpOnly} onCheckedChange={setSharpOnly} />
                <label className="text-sm text-gray-300">Sharp Moves Only</label>
              </div>
              <Button
                onClick={handleTrack}
                disabled={lineMutation.isPending}
                className="bg-brand-blue/80 hover:bg-brand-blue"
              >
                {lineMutation.isPending ? (
                  <span className="animate-pulse">Scanning...</span>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-1" /> Track Lines
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{data.totalTracked}</p>
                  <p className="text-xs text-gray-400">Lines Tracked</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-brand-red/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-brand-red">{data.sharpMoves}</p>
                  <p className="text-xs text-gray-400">Sharp Moves Detected</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-brand-gold">${lineMutation.data?.balance?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Credits Remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Movement Cards */}
            <div className="space-y-3">
              {data.movements.map((move, i) => (
                <Card key={i} className={`bg-gray-900 ${move.isSharpMove ? "border-brand-red/40" : "border-gray-800"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${move.direction === "up" ? "bg-brand-green/10" : "bg-brand-red/10"}`}>
                          {move.direction === "up" ? (
                            <ArrowUpRight className="h-5 w-5 text-brand-green" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-brand-red" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{move.awayTeam} @ {move.homeTeam}</p>
                          <p className="text-sm text-gray-400">{move.market} • {move.bookmaker}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 line-through text-sm">{move.openLine}</span>
                            <span className="text-white font-mono">{move.currentLine}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Moved {Math.abs(move.movement).toFixed(1)} pts
                          </p>
                        </div>
                        {move.isSharpMove && (
                          <Badge className="bg-red-600/20 text-brand-red border-brand-red/30">
                            🦈 SHARP
                          </Badge>
                        )}
                        <Badge variant="outline" className={
                          Math.abs(move.movement) > 2 ? "text-brand-green border-brand-green/30" :
                          Math.abs(move.movement) > 1 ? "text-brand-gold border-yellow-500/30" :
                          "text-gray-400 border-gray-500/30"
                        }>
                          {Math.abs(move.movement).toFixed(1)} pts
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !lineMutation.isPending && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-brand-blue mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300">Line Movement Scanner</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Track real-time line movements across sportsbooks. Detect sharp money action and reverse line movement for smarter bets.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function LineMovement() {
  return (
    <FeatureGate feature="tools" requiredTier="monthly">
      <LineMovementContent />
    </FeatureGate>
  );
}
