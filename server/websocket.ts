import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

/**
 * WebSocket Server for Real-Time Live Data
 * 
 * Handles:
 * - Live scores (ESPN)
 * - Kalshi market updates
 * - Odds changes from sportsbooks
 * - Leaderboard updates
 * - User activity
 */

interface WebSocketMessage {
  type: "subscribe" | "unsubscribe" | "update" | "ping" | "pong";
  channel: string;
  data?: any;
  timestamp?: number;
}

interface ClientSubscription {
  channels: Set<string>;
  lastUpdate: Map<string, number>;
}

const clients = new Map<WebSocket, ClientSubscription>();
const channelSubscribers = new Map<string, Set<WebSocket>>();

export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WebSocket] Client connected");

    // Initialize client subscription tracking
    clients.set(ws, {
      channels: new Set(),
      lastUpdate: new Map(),
    });

    // Handle incoming messages
    ws.on("message", (message: string) => {
      try {
        const msg: WebSocketMessage = JSON.parse(message);
        handleWebSocketMessage(ws, msg);
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      console.log("[WebSocket] Client disconnected");
      const subscription = clients.get(ws);
      if (subscription) {
        subscription.channels.forEach((channel) => {
          const subscribers = channelSubscribers.get(channel);
          if (subscribers) {
            subscribers.delete(ws);
          }
        });
      }
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: "connected",
      timestamp: Date.now(),
    }));
  });

  return wss;
}

function handleWebSocketMessage(ws: WebSocket, msg: WebSocketMessage) {
  const subscription = clients.get(ws);
  if (!subscription) return;

  switch (msg.type) {
    case "subscribe":
      subscribeToChannel(ws, msg.channel, subscription);
      break;

    case "unsubscribe":
      unsubscribeFromChannel(ws, msg.channel, subscription);
      break;

    case "ping":
      ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      break;

    default:
      console.warn("[WebSocket] Unknown message type:", msg.type);
  }
}

function subscribeToChannel(ws: WebSocket, channel: string, subscription: ClientSubscription) {
  subscription.channels.add(channel);

  if (!channelSubscribers.has(channel)) {
    channelSubscribers.set(channel, new Set());
  }
  channelSubscribers.get(channel)!.add(ws);

  // Send subscription confirmation
  ws.send(JSON.stringify({
    type: "subscribed",
    channel,
    timestamp: Date.now(),
  }));

  console.log(`[WebSocket] Client subscribed to ${channel}`);
}

function unsubscribeFromChannel(ws: WebSocket, channel: string, subscription: ClientSubscription) {
  subscription.channels.delete(channel);

  const subscribers = channelSubscribers.get(channel);
  if (subscribers) {
    subscribers.delete(ws);
  }

  ws.send(JSON.stringify({
    type: "unsubscribed",
    channel,
    timestamp: Date.now(),
  }));

  console.log(`[WebSocket] Client unsubscribed from ${channel}`);
}

/**
 * Broadcast live data to all subscribers of a channel
 */
export function broadcastToChannel(channel: string, data: any) {
  const subscribers = channelSubscribers.get(channel);
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify({
    type: "update",
    channel,
    data,
    timestamp: Date.now(),
  });

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(data: any) {
  const message = JSON.stringify({
    type: "broadcast",
    data,
    timestamp: Date.now(),
  });

  clients.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Get subscriber count for a channel
 */
export function getChannelSubscriberCount(channel: string): number {
  return channelSubscribers.get(channel)?.size || 0;
}

/**
 * Get total connected clients
 */
export function getTotalConnectedClients(): number {
  return clients.size;
}
