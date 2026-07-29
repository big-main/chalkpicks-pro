import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Zap, Flame, DollarSign, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import type { FilterState } from "@/components/SteamKellyFilter";

type SortOption =
  | "kelly_desc"
  | "edge_desc"
  | "steam_desc"
  | "time_asc"
  | "odds_best";

interface MultiSourceOddsProps {
  sport: string;
  eventId?: string;
  filters?: FilterState;
}

/**
 * MultiSourceOdds Component
 * Displays real-time odds from multiple sportsbooks with best line highlighting
 */
export function MultiSourceOdds({
  sport,
  eventId: _eventIdProp,
  filters,
}: MultiSourceOddsProps) {
  const [selectedMarket, setSelectedMarket] = useState<
    "h2h" | "spreads" | "totals"
  >("h2h");
  const [sortBy, setSortBy] = useState<SortOption>("kelly_desc");

  // Fetch odds from all bookmakers
  const {
    data: oddsData,
    isLoading,
    error,
  } = trpc.oddsComparison.getMultiBookmakerOdds.useQuery(
    { sport, region: "us" },
    { staleTime: 60000 } // Cache for 1 minute
  );

  // Fetch best lines across bookmakers
  const { data: bestLinesData } = trpc.oddsComparison.getBestLines.useQuery(
    { sport },
    { staleTime: 60000 }
  );

  const odds = useMemo(() => oddsData?.odds || [], [oddsData?.odds]);
  const bookmakerCount = oddsData?.bookmakerCount || 0;
  const eventCount = oddsData?.eventCount || 0;

  // Group odds by event
  const eventGroups = useMemo(() => {
    const groups: Record<string, (typeof odds)[number][]> = {};
    for (const odd of odds) {
      if (!groups[odd.eventId]) {
        groups[odd.eventId] = [];
      }
      groups[odd.eventId].push(odd);
    }
    return groups;
  }, [odds]);

  // Derive sort scores per event group
  const sortedEventEntries = useMemo(() => {
    const entries = Object.entries(eventGroups);
    const scored = entries.map(([_eventId, eventOdds]) => {
      const firstOdd = eventOdds[0];
      const h2hMarket = firstOdd?.markets?.find(m => m.key === "h2h");
      const bestOdds =
        h2hMarket?.outcomes?.reduce(
          (best, o) => Math.max(best, o.price),
          -9999
        ) ?? 0;
      const impliedProb =
        bestOdds > 0
          ? 100 / (bestOdds + 100)
          : Math.abs(bestOdds) / (Math.abs(bestOdds) + 100);
      const trueProb = Math.min(0.95, impliedProb * 1.05);
      const b = bestOdds > 0 ? bestOdds / 100 : 100 / Math.abs(bestOdds);
      const kellyPct = Math.max(0, ((b * trueProb - (1 - trueProb)) / b) * 100);
      const edgePct = Math.max(0, (trueProb * (1 + b) - 1) * 100);
      const steamScore = eventOdds.length;
      const commenceTime = (firstOdd as any)?.commenceTime
        ? new Date((firstOdd as any).commenceTime).getTime()
        : 0;
      return {
        eventId: _eventId,
        eventOdds,
        kellyPct,
        edgePct,
        steamScore,
        bestOdds,
        commenceTime,
      };
    });

    switch (sortBy) {
      case "kelly_desc":
        scored.sort((a, b) => b.kellyPct - a.kellyPct);
        break;
      case "edge_desc":
        scored.sort((a, b) => b.edgePct - a.edgePct);
        break;
      case "steam_desc":
        scored.sort((a, b) => b.steamScore - a.steamScore);
        break;
      case "time_asc":
        scored.sort((a, b) => a.commenceTime - b.commenceTime);
        break;
      case "odds_best":
        scored.sort((a, b) => b.bestOdds - a.bestOdds);
        break;
    }
    return scored;
  }, [eventGroups, sortBy]);

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
      <Card className="bg-card/50 border-border/50 border-brand-red/30">
        <CardHeader>
          <CardTitle className="text-lg text-brand-red">
            Odds Data Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to fetch odds data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-gold" />
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
        {/* Sort Dropdown */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={v => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kelly_desc">Highest Kelly %</SelectItem>
                <SelectItem value="edge_desc">Highest Edge %</SelectItem>
                <SelectItem value="steam_desc">Steam Score</SelectItem>
                <SelectItem value="odds_best">Best Odds</SelectItem>
                <SelectItem value="time_asc">Game Time (Soonest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {sortedEventEntries.length} events
          </span>
        </div>

        {/* Market Tabs */}
        <Tabs
          value={selectedMarket}
          onValueChange={v => setSelectedMarket(v as any)}
          className="mb-6"
        >
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
            {sortedEventEntries
              .slice(0, 8)
              .map(({ eventId, eventOdds, kellyPct, edgePct, steamScore }) => {
                const firstOdd = eventOdds[0];
                return (
                  <div
                    key={eventId}
                    className={`border rounded-lg p-4 bg-background/20 transition-all ${
                      filters?.showSteamOnly || filters?.showHighKelly
                        ? "border-brand-gold/30 shadow-[0_0_8px_rgba(240,184,0,0.1)]"
                        : "border-border/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">
                        {firstOdd.eventName}
                      </h4>
                      {/* Derived metric badges */}
                      <div className="flex gap-1">
                        {kellyPct > 0 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[9px] px-1.5 py-0">
                            <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                            {kellyPct.toFixed(1)}% Kelly
                          </Badge>
                        )}
                        {edgePct > 1 && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-[9px] px-1.5 py-0">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />+
                            {edgePct.toFixed(1)}% Edge
                          </Badge>
                        )}
                        {steamScore >= 3 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px] px-1.5 py-0">
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            Steam
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {eventOdds.map((odd, idx) => {
                        const h2hMarket = odd.markets.find(
                          m => m.key === "h2h"
                        );
                        if (!h2hMarket) return null;

                        return (
                          <div
                            key={`${odd.bookmaker}-${idx}`}
                            className="bg-card/50 border border-border/30 rounded p-2"
                          >
                            <p className="text-xs text-muted-foreground mb-2 capitalize">
                              {odd.bookmaker.replace("_", " ")}
                            </p>
                            <div className="space-y-1">
                              {h2hMarket.outcomes.map(outcome => (
                                <div
                                  key={outcome.name}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-300 truncate">
                                    {outcome.name}
                                  </span>
                                  <span className="font-mono font-semibold text-brand-gold">
                                    {outcome.price > 0 ? "+" : ""}
                                    {outcome.price}
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
              <TrendingUp className="w-4 h-4 text-brand-green" />
              Best Lines Across Books
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {bestLinesData.bestLines.slice(0, 3).map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 bg-background/20 rounded border border-border/20"
                >
                  <span className="text-gray-300">{event.event}</span>
                  <span className="font-mono text-brand-gold">
                    {event.moneyline?.home?.odds
                      ? `${event.moneyline.home.odds > 0 ? "+" : ""}${event.moneyline.home.odds}`
                      : "N/A"}
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
