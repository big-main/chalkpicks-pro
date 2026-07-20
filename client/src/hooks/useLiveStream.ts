import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useLiveStream — connects to the WebSocket server and subscribes to a channel.
 * Returns the latest data payload for that channel.
 * 
 * Channels: "steam-moves" | "live-scores" | "odds-updates" | "kalshi-markets" | "leaderboard"
 */

interface UseLiveStreamOptions {
  channel: string;
  enabled?: boolean;
}

interface SteamMove {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  sharpSide: string;
  publicPct: number;
  openLine: number;
  currentLine: number;
  lineMove: number;
  confidence: "high" | "medium" | "low";
  steamType: "steam_move" | "reverse_line_movement" | "sharp_action";
  bookmaker: string;
  detectedAt: number;
}

interface SteamMovesPayload {
  moves: SteamMove[];
  count: number;
  timestamp: number;
}

export function useLiveStream<T = any>({ channel, enabled = true }: UseLiveStreamOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        // Subscribe to channel
        ws.send(JSON.stringify({ type: "subscribe", channel }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "channel_data" && msg.channel === channel) {
            setData(msg.data as T);
            setLastUpdate(msg.data?.timestamp ?? Date.now());
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Connection failed, will retry via onclose
    }
  }, [channel, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { data, isConnected, lastUpdate };
}

/**
 * Convenience hook for steam moves specifically
 */
export function useSteamMovesStream(enabled = true) {
  return useLiveStream<SteamMovesPayload>({ channel: "steam-moves", enabled });
}

export type { SteamMove, SteamMovesPayload };
