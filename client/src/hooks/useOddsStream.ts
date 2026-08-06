/**
 * useOddsStream — React hook for real-time odds via SharpAPI SSE stream.
 * Connects to /api/sharp/stream and merges snapshot + update events into state.
 * Premium-only: requires active subscription.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export interface StreamOddsRow {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  sportsbook: string;
  marketType: string;
  selection: string;
  oddsAmerican: number;
  line: number | null;
  timestamp: string;
  league: string;
  prevOdds?: number; // for flash animation
  direction?: "up" | "down" | "stable";
}

interface UseOddsStreamOptions {
  enabled?: boolean;
  league?: string;
  maxRows?: number;
}

export function useOddsStream(opts: UseOddsStreamOptions = {}) {
  const { enabled = true, league, maxRows = 100 } = opts;
  const [rows, setRows] = useState<StreamOddsRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const rowMapRef = useRef<Map<string, StreamOddsRow>>(new Map());

  const processRow = useCallback((raw: any): StreamOddsRow => {
    const key = `${raw.event_id}-${raw.sportsbook}-${raw.market_type}-${raw.selection}`;
    const existing = rowMapRef.current.get(key);
    const newOdds = raw.odds_american ?? 0;
    let direction: "up" | "down" | "stable" = "stable";
    if (existing && existing.oddsAmerican !== newOdds) {
      direction = newOdds > existing.oddsAmerican ? "up" : "down";
    }
    return {
      eventId: raw.event_id,
      homeTeam: raw.home_team || "Home",
      awayTeam: raw.away_team || "Away",
      sportsbook: raw.sportsbook || "unknown",
      marketType: raw.market_type || "moneyline",
      selection: raw.selection || raw.display_selection || "Unknown",
      oddsAmerican: newOdds,
      line: raw.line ?? null,
      timestamp: raw.timestamp || new Date().toISOString(),
      league: raw.league || "",
      prevOdds: existing?.oddsAmerican,
      direction,
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const params = new URLSearchParams();
    if (league) params.set("league", league);
    const url = `/api/sharp/stream${params.toString() ? `?${params}` : ""}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("snapshot", e => {
      try {
        const data = JSON.parse(e.data);
        const items: any[] = Array.isArray(data) ? data : data.data || [];
        const map = new Map<string, StreamOddsRow>();
        items.slice(0, maxRows).forEach(raw => {
          const row = processRow(raw);
          const key = `${row.eventId}-${row.sportsbook}-${row.marketType}-${row.selection}`;
          map.set(key, row);
        });
        rowMapRef.current = map;
        setRows(Array.from(map.values()));
        setConnected(true);
        setError(null);
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("update", e => {
      try {
        const data = JSON.parse(e.data);
        const items: any[] = Array.isArray(data) ? data : [data];
        items.forEach(raw => {
          const row = processRow(raw);
          const key = `${row.eventId}-${row.sportsbook}-${row.marketType}-${row.selection}`;
          rowMapRef.current.set(key, row);
        });
        // Only keep maxRows
        const allRows = Array.from(rowMapRef.current.values());
        if (allRows.length > maxRows) {
          const trimmed = allRows.slice(-maxRows);
          rowMapRef.current = new Map(
            trimmed.map(r => [
              `${r.eventId}-${r.sportsbook}-${r.marketType}-${r.selection}`,
              r,
            ])
          );
        }
        setRows(Array.from(rowMapRef.current.values()));
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setConnected(false);
      setError("Stream disconnected — reconnecting...");
    };

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled, league, maxRows, processRow]);

  return { rows, connected, error };
}
