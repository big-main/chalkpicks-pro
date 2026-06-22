import { useEffect, useState, useCallback } from "react";

interface UseRealtimeDataOptions {
  channel: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for subscribing to real-time WebSocket data
 * 
 * Usage:
 * const { data, isConnected, error } = useRealtimeData({ channel: "live-scores" });
 */
export function useRealtimeData<T = any>({
  channel,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${channel}`);
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);

        // Subscribe to channel
        ws.send(
          JSON.stringify({
            type: "subscribe",
            channel,
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Only process updates for this channel
          if (message.channel === channel && message.type === "update") {
            setData(message.data);
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          setError("Max reconnection attempts reached");
        }
      };

      return ws;
    } catch (err) {
      console.error("[WebSocket] Connection error:", err);
      setError(String(err));
      return null;
    }
  }, [channel, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return { data, isConnected, error };
}

/**
 * Hook for subscribing to multiple channels
 */
export function useRealtimeDataMultiple(channels: string[]) {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        setError(null);

        // Subscribe to all channels
        channels.forEach((channel) => {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel,
              timestamp: Date.now(),
            })
          );
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "update") {
            setAllData((prev) => ({
              ...prev,
              [message.channel]: message.data,
            }));
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
      };

      return () => {
        if (ws) {
          ws.close();
        }
      };
    } catch (err) {
      console.error("[WebSocket] Connection error:", err);
      setError(String(err));
    }
  }, [channels]);

  return { allData, isConnected, error };
}
