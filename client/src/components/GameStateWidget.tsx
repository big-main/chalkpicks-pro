/**
 * GameStateWidget
 * Shows live multi-book consensus scores, period, clock, and possession
 * from SharpAPI Game State endpoint (Sharp plan add-on).
 * Renders as a compact horizontal ticker or a grid of live game cards.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Activity, Clock } from "lucide-react";

interface GameStateWidgetProps {
  sport?: string;
  variant?: "ticker" | "cards";
  className?: string;
}

export function GameStateWidget({
  sport,
  variant = "ticker",
  className = "",
}: GameStateWidgetProps) {
  const { data, isLoading } = trpc.sharpOpportunities.getGameState.useQuery(
    { sport },
    { refetchInterval: 15000 } // refresh every 15s for live games
  );

  const games = (data?.games ?? []) as any[];
  const liveGames = games.filter(g => g.isLive);

  if (isLoading || liveGames.length === 0) return null;

  if (variant === "ticker") {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className="flex items-center gap-1 mb-1">
          <Activity className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-red-400">
            LIVE
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {liveGames.slice(0, 8).map(game => (
            <div
              key={game.gameId}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-center"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                minWidth: "120px",
              }}
            >
              <div className="text-[9px] font-bold tracking-wider text-red-400 mb-1">
                {game.period} {game.clock && `· ${game.clock}`}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {game.homeTeam}
              </div>
              <div className="text-lg font-bold" style={{ color: "#39ff14" }}>
                {game.homeScore ?? "—"} – {game.awayScore ?? "—"}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {game.awayTeam}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cards variant
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}
    >
      {liveGames.map(game => (
        <div
          key={game.gameId}
          className="p-4 rounded-xl"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-wider text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
              LIVE
            </span>
            <span className="text-[10px] text-muted-foreground">
              {game.sport}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate flex-1">
                {game.homeTeam}
              </span>
              <span
                className="text-lg font-bold ml-2"
                style={{ color: "#39ff14" }}
              >
                {game.homeScore ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate flex-1">
                {game.awayTeam}
              </span>
              <span
                className="text-lg font-bold ml-2"
                style={{ color: "#39ff14" }}
              >
                {game.awayScore ?? "—"}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {game.period}
            {game.clock && ` · ${game.clock}`}
          </div>
        </div>
      ))}
    </div>
  );
}
