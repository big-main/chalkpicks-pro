/**
 * LiveOddsTicker — Real-time scrolling odds ticker powered by SharpAPI SSE stream.
 * Features: interactive click → game detail, sport filter tabs, premium gate with blur.
 */
import { useState } from "react";
import { useOddsStream, StreamOddsRow } from "@/hooks/useOddsStream";
import { formatSportLabel } from "@/lib/badges";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

interface LiveOddsTickerProps {
  className?: string;
  maxItems?: number;
}

const SPORT_TABS = [
  { key: "", label: "All" },
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "ncaaf", label: "NCAAF" },
  { key: "soccer", label: "Soccer" },
];

function OddsChip({
  row,
  onClick,
}: {
  row: StreamOddsRow;
  onClick: () => void;
}) {
  const flashClass =
    row.direction === "up"
      ? "animate-pulse bg-green-500/20 border-green-500/50"
      : row.direction === "down"
        ? "animate-pulse bg-red-500/20 border-red-500/50"
        : "bg-card/80 border-border/50";

  const oddsColor =
    row.direction === "up"
      ? "text-green-400"
      : row.direction === "down"
        ? "text-red-400"
        : "text-foreground";

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-300 hover:scale-105 hover:border-primary/50 cursor-pointer ${flashClass}`}
    >
      <span className="text-muted-foreground font-medium truncate max-w-[80px]">
        {row.sportsbook}
      </span>
      <span className="text-foreground/80 truncate max-w-[120px]">
        {row.selection}
      </span>
      <span className={`font-mono font-bold ${oddsColor}`}>
        {formatOdds(row.oddsAmerican)}
      </span>
      {row.line !== null && (
        <span className="text-muted-foreground text-[10px]">
          ({row.line > 0 ? `+${row.line}` : row.line})
        </span>
      )}
      {row.direction !== "stable" && (
        <span
          className={row.direction === "up" ? "text-green-400" : "text-red-400"}
        >
          {row.direction === "up" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}

function GameMatchupModal({
  row,
  onClose,
}: {
  row: StreamOddsRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-semibold text-primary">
            {formatSportLabel(row.league)} • Live
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-lg font-bold text-foreground mb-1">
            {row.awayTeam} @ {row.homeTeam}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Selection
              </div>
              <div className="font-semibold text-sm">{row.selection}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Odds</div>
              <div
                className={`font-mono font-bold text-lg ${
                  row.direction === "up"
                    ? "text-green-400"
                    : row.direction === "down"
                      ? "text-red-400"
                      : "text-foreground"
                }`}
              >
                {row.oddsAmerican > 0
                  ? `+${row.oddsAmerican}`
                  : row.oddsAmerican}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Book</div>
              <div className="font-semibold text-sm capitalize">
                {row.sportsbook}
              </div>
            </div>
          </div>
        </div>

        {row.line !== null && (
          <div className="flex items-center justify-between text-sm mb-4 px-2">
            <span className="text-muted-foreground">Line</span>
            <span className="font-mono font-bold">
              {row.line > 0 ? `+${row.line}` : row.line}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm mb-4 px-2">
          <span className="text-muted-foreground">Market</span>
          <span className="capitalize">
            {row.marketType.replace(/_/g, " ")}
          </span>
        </div>

        {row.prevOdds !== undefined && row.direction !== "stable" && (
          <div className="flex items-center justify-between text-sm px-2 mb-4">
            <span className="text-muted-foreground">Previous Odds</span>
            <span className="font-mono text-muted-foreground line-through">
              {row.prevOdds > 0 ? `+${row.prevOdds}` : row.prevOdds}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <a
            href={`/tools/odds-calculator`}
            className="flex-1 text-center px-4 py-2 bg-primary/20 text-primary text-xs font-medium rounded-lg hover:bg-primary/30 transition-colors"
          >
            Calculate EV
          </a>
          <a
            href={`/tools/ev-finder`}
            className="flex-1 text-center px-4 py-2 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors"
          >
            Find +EV
          </a>
        </div>
      </div>
    </div>
  );
}

export function LiveOddsTicker({
  className = "",
  maxItems = 30,
}: LiveOddsTickerProps) {
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedRow, setSelectedRow] = useState<StreamOddsRow | null>(null);
  const { user } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  const isPremium =
    subscription?.isActive &&
    (subscription?.tier === "daily" ||
      subscription?.tier === "monthly" ||
      subscription?.tier === "yearly");

  const { rows, connected, error } = useOddsStream({
    enabled: true,
    league: selectedSport || undefined,
    maxRows: maxItems,
  });

  // Filter by sport if selected
  const filteredRows = selectedSport
    ? rows.filter(r =>
        r.league.toLowerCase().includes(selectedSport.toLowerCase())
      )
    : rows;

  // Prioritize rows with movement
  const recentRows = filteredRows
    .filter(
      r =>
        r.direction !== "stable" ||
        Date.now() - new Date(r.timestamp).getTime() < 60_000
    )
    .slice(0, maxItems);

  const displayRows =
    recentRows.length > 0 ? recentRows : filteredRows.slice(0, 15);

  // Premium gate: show blurred preview for free users
  if (!isPremium) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            LIVE ODDS
          </span>
          <span className="text-[10px] text-yellow-500 font-medium ml-auto">
            PREMIUM
          </span>
        </div>

        {/* Sport tabs (visible but non-functional for free users) */}
        <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
          {SPORT_TABS.map(tab => (
            <span
              key={tab.key}
              className="px-2 py-0.5 text-[10px] rounded-full bg-muted/50 text-muted-foreground whitespace-nowrap"
            >
              {tab.label}
            </span>
          ))}
        </div>

        {/* Blurred preview */}
        <div className="relative">
          <div className="flex gap-2 overflow-hidden pb-2 blur-[6px] select-none pointer-events-none">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-card/80 px-3 py-1.5 text-xs whitespace-nowrap"
              >
                <span className="text-muted-foreground">FanDuel</span>
                <span className="text-foreground/80">Team +3.5</span>
                <span className="font-mono font-bold text-green-400">-110</span>
                <span className="text-green-400">▲</span>
              </div>
            ))}
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <a
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg shadow-lg hover:bg-primary transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Upgrade for Live Odds Stream
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!connected && !error) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        Connecting to live odds stream...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="h-2 w-2 rounded-full bg-red-500" />
        {error}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Header with sport filter tabs */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground">
          LIVE ODDS
        </span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">
          {displayRows.length} lines streaming
        </span>
      </div>

      {/* Sport filter tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
        {SPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedSport(tab.key)}
            className={`px-2.5 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
              selectedSport === tab.key
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrolling ticker */}
      {displayRows.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {selectedSport
            ? `No ${formatSportLabel(selectedSport)} odds movement right now`
            : "Waiting for odds movement..."}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayRows.map((row, i) => (
            <OddsChip
              key={`${row.eventId}-${row.sportsbook}-${row.selection}-${i}`}
              row={row}
              onClick={() => setSelectedRow(row)}
            />
          ))}
        </div>
      )}

      {/* Game matchup modal */}
      {selectedRow && (
        <GameMatchupModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
