/**
 * LiveOddsTicker — Real-time scrolling odds ticker powered by SharpAPI SSE stream.
 * Shows live odds changes with green/red flash animations.
 * Premium-only feature.
 */
import { useOddsStream, StreamOddsRow } from "@/hooks/useOddsStream";
import { formatSportLabel } from "@/lib/badges";

interface LiveOddsTickerProps {
  league?: string;
  className?: string;
  maxItems?: number;
}

function OddsChip({ row }: { row: StreamOddsRow }) {
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
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-300 ${flashClass}`}
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
    </div>
  );
}

export function LiveOddsTicker({
  league,
  className = "",
  maxItems = 30,
}: LiveOddsTickerProps) {
  const { rows, connected, error } = useOddsStream({
    enabled: true,
    league,
    maxRows: maxItems,
  });

  // Only show rows with recent movement (last 60s) or all if no movement
  const recentRows = rows
    .filter(
      r =>
        r.direction !== "stable" ||
        Date.now() - new Date(r.timestamp).getTime() < 60_000
    )
    .slice(0, maxItems);

  const displayRows = recentRows.length > 0 ? recentRows : rows.slice(0, 15);

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

  if (displayRows.length === 0) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        Live stream connected — waiting for odds movement...
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground">
          LIVE ODDS {league ? `• ${formatSportLabel(league)}` : ""}
        </span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">
          {displayRows.length} lines streaming
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {displayRows.map((row, i) => (
          <OddsChip
            key={`${row.eventId}-${row.sportsbook}-${row.selection}-${i}`}
            row={row}
          />
        ))}
      </div>
    </div>
  );
}
