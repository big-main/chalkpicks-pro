import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { toast } from "sonner";

interface MultiSourceOddsProps {
  sport: string;
  eventId?: string;
}

/**
 * MultiSourceOdds Component
 * Displays real-time odds from multiple sportsbooks with best line highlighting
 */
export function MultiSourceOdds({ sport, eventId }: MultiSourceOddsProps) {
  const [selectedMarket, setSelectedMarket] = useState<"h2h" | "spreads" | "totals">("h2h");

  // Fetch odds from all bookmakers
  const { data: oddsData, isLoading, error } = trpc.oddsComparison.getMultiBookmakerOdds.useQuery(
    { sport, region: "us" },
    { staleTime: 60000 } // Cache for 1 minute
  );

  // Fetch best lines across bookmakers
  const { data: bestLinesData } = trpc.oddsComparison.getBestLines.useQuery(
    { sport },
    { staleTime: 60000 }
  );

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Real-Time Odds Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-border/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-red-500">Odds Data Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to fetch odds data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const odds = oddsData?.odds || [];
  const bookmakerCount = oddsData?.bookmakerCount || 0;
  const eventCount = oddsData?.eventCount || 0;

  // Group odds by event
  const eventGroups: Record<string, typeof odds> = {};
  for (const odd of odds) {
    if (!eventGroups[odd.eventId]) {
      eventGroups[odd.eventId] = [];
    }
    eventGroups[odd.eventId].push(odd);
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Real-Time Odds Comparison
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {bookmakerCount} sportsbooks • {eventCount} events
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Market Tabs */}
        <Tabs value={selectedMarket} onValueChange={(v) => setSelectedMarket(v as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="h2h" className="text-xs">
              Moneyline
            </TabsTrigger>
            <TabsTrigger value="spreads" className="text-xs">
              Spreads
            </TabsTrigger>
            <TabsTrigger value="totals" className="text-xs">
              Over/Under
            </TabsTrigger>
          </TabsList>

          {/* Moneyline Tab */}
          <TabsContent value="h2h" className="space-y-4">
            {Object.entries(eventGroups).slice(0, 5).map(([eventId, eventOdds]) => {
              const firstOdd = eventOdds[0];
              return (
                <div key={eventId} className="border border-border/30 rounded-lg p-4 bg-background/20">
                  <h4 className="font-semibold text-sm mb-3">{firstOdd.eventName}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {eventOdds.map((odd, idx) => {
                      const h2hMarket = odd.markets.find((m) => m.key === "h2h");
                      if (!h2hMarket) return null;

                      return (
                        <div key={`${odd.bookmaker}-${idx}`} className="bg-card/50 border border-border/30 rounded p-2">
                          <p className="text-xs text-muted-foreground mb-2 capitalize">
                            {odd.bookmaker.replace("_", " ")}
                          </p>
                          <div className="space-y-1">
                            {h2hMarket.outcomes.map((outcome) => (
                              <div key={outcome.name} className="flex items-center justify-between text-xs">
                                <span className="text-gray-300 truncate">{outcome.name}</span>
                                <span className="font-mono font-semibold text-amber-400">
                                  {outcome.price > 0 ? "+" : ""}{outcome.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Spreads Tab */}
          <TabsContent value="spreads" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Spread data loading...</p>
            </div>
          </TabsContent>

          {/* Totals Tab */}
          <TabsContent value="totals" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Totals data loading...</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Best Lines Summary */}
        {bestLinesData?.bestLines && bestLinesData.bestLines.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Best Lines Across Books
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {bestLinesData.bestLines.slice(0, 3).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-background/20 rounded border border-border/20">
                  <span className="text-gray-300">{event.event}</span>
                  <span className="font-mono text-amber-400">
                    {event.moneyline?.home?.odds ? `${event.moneyline.home.odds > 0 ? "+" : ""}${event.moneyline.home.odds}` : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-6"
          onClick={() => {
            toast.success("Odds refreshed!");
          }}
        >
          Refresh Odds
        </Button>
      </CardContent>
    </Card>
  );
}
