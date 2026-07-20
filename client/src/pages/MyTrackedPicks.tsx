import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";

export function MyTrackedPicks() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: trackedPicks, isLoading, refetch } = trpc.tracking.getTrackedPicks.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const removeFromTracked = trpc.tracking.removeFromTracked.useMutation({
    onSuccess: () => refetch(),
  });

  if (!user) return <div className="text-center py-8">Please log in to view tracked picks.</div>;
  if (isLoading) return <div className="text-center py-8">Loading tracked picks...</div>;

  const picks = trackedPicks || [];
  const wonPicks = picks.filter((p: any) => p.pick.result === "win");
  const lostPicks = picks.filter((p: any) => p.pick.result === "loss");
  const pushedPicks = picks.filter((p: any) => p.pick.result === "push");
  const pendingPicks = picks.filter((p: any) => p.pick.result === "pending");

  const totalPicks = picks.length;
  const wins = wonPicks.length;
  const losses = lostPicks.length;
  const pushes = pushedPicks.length;
  const winRate = totalPicks > 0 ? ((wins / (totalPicks - pushes)) * 100).toFixed(1) : "0";

  // Calculate P&L (simplified: assume 1 unit per pick)
  const pnl = wins - losses;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tracked Picks</h1>
        <p className="text-gray-600">Monitor your favorite picks and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalPicks}</div>
              <p className="text-sm text-gray-600">Total Tracked</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{wins}</div>
              <p className="text-sm text-gray-600">Wins</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{losses}</div>
              <p className="text-sm text-gray-600">Losses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{winRate}%</div>
              <p className="text-sm text-gray-600">Win Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className={pnl >= 0 ? "border-green-200" : "border-red-200"}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pnl >= 0 ? "+" : ""}{pnl}u
              </div>
              <p className="text-sm text-gray-600">P&L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({totalPicks})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingPicks.length})</TabsTrigger>
          <TabsTrigger value="won">Won ({wins})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({losses})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PicksList picks={picks} onRemove={removeFromTracked} />
        </TabsContent>

        <TabsContent value="pending">
          <PicksList picks={pendingPicks} onRemove={removeFromTracked} />
        </TabsContent>

        <TabsContent value="won">
          <PicksList picks={wonPicks} onRemove={removeFromTracked} />
        </TabsContent>

        <TabsContent value="lost">
          <PicksList picks={lostPicks} onRemove={removeFromTracked} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PicksList({ picks, onRemove }: any) {
  if (picks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No picks to display
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {picks.map((tracking: any) => {
        const pick = tracking.pick;
        const resultEmoji = pick.result === "win" ? "🎉" : pick.result === "loss" ? "❌" : pick.result === "push" ? "🔄" : "⏳";

        return (
          <Card key={tracking.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">
                      {pick.homeTeam} vs {pick.awayTeam}
                    </CardTitle>
                    <Badge variant={
                      pick.result === "win" ? "default" :
                      pick.result === "loss" ? "destructive" :
                      pick.result === "push" ? "secondary" :
                      "outline"
                    }>
                      {resultEmoji} {pick.result?.toUpperCase() || "PENDING"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{pick.sportKey.toUpperCase()} • {pick.pickDate}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove.mutate({ pickId: pick.id })}
                  disabled={onRemove.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pick Type</p>
                  <p className="font-semibold">{pick.pickType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recommendation</p>
                  <p className="font-semibold">{pick.recommendation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="font-semibold">{pick.confidenceScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Odds</p>
                  <p className="font-semibold">{pick.odds ? `${pick.odds > 0 ? "+" : ""}${pick.odds}` : "N/A"}</p>
                </div>
              </div>

              {pick.aiAnalysis && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                  <p className="font-semibold mb-1">Analysis</p>
                  <p>{pick.aiAnalysis.substring(0, 200)}...</p>
                </div>
              )}

              {tracking.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  <p className="font-semibold mb-1">Your Notes</p>
                  <p>{tracking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
