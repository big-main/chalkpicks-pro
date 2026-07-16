/**
 * pushSender.ts — Web Push notification sender using VAPID keys.
 * Sends real browser push notifications to subscribed users.
 */
import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions, users } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { ENV } from "./_core/env";

let vapidInitialized = false;

function initVapid() {
  if (vapidInitialized) return;
  const publicKey = ENV.vapidPublicKey;
  const privateKey = ENV.vapidPrivateKey;
  if (!publicKey || !privateKey) {
    console.warn("[PushSender] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:admin@chalkpicks.live",
    publicKey,
    privateKey
  );
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a single user (all their subscribed devices).
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  initVapid();
  if (!vapidInitialized) return { sent: 0, failed: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return { sent: 0, failed: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    badge: payload.badge ?? "/icon-72.png",
    url: payload.url ?? "https://chalkpicks.live",
    tag: payload.tag ?? "chalkpicks",
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: number[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message,
          { TTL: 86400 } // 24h TTL
        );
        sent++;
      } catch (err: any) {
        failed++;
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleEndpoints.push(sub.id);
        }
        console.warn(`[PushSender] Failed to send to sub ${sub.id}:`, err.message);
      }
    })
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, staleEndpoints));
    console.log(`[PushSender] Removed ${staleEndpoints.length} stale subscriptions`);
  }

  return { sent, failed };
}

/**
 * Send a push notification to ALL subscribed users (broadcast).
 * Used for new +EV picks, daily picks alerts, etc.
 */
export async function broadcastPush(payload: PushPayload, userIds?: number[]): Promise<{ sent: number; failed: number; users: number }> {
  initVapid();
  if (!vapidInitialized) return { sent: 0, failed: 0, users: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0, users: 0 };

  // Get all subscriptions (optionally filtered by userIds)
  const query = db.select().from(pushSubscriptions);
  const subs = userIds && userIds.length > 0
    ? await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds))
    : await query;

  if (subs.length === 0) return { sent: 0, failed: 0, users: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    badge: payload.badge ?? "/icon-72.png",
    url: payload.url ?? "https://chalkpicks.live",
    tag: payload.tag ?? "chalkpicks",
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: number[] = [];

  // Send in batches of 50 to avoid overwhelming the push service
  const BATCH_SIZE = 50;
  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            message,
            { TTL: 86400 }
          );
          sent++;
        } catch (err: any) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.push(sub.id);
          }
        }
      })
    );
  }

  if (staleEndpoints.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, staleEndpoints));
  }

  const uniqueUsers = new Set(subs.map((s) => s.userId)).size;
  console.log(`[PushSender] Broadcast sent=${sent} failed=${failed} users=${uniqueUsers}`);
  return { sent, failed, users: uniqueUsers };
}

/**
 * Send a +EV alert to all subscribed users.
 * Called when a new high-confidence +EV pick is published.
 */
export async function sendEVAlert(pick: {
  sport: string;
  team: string;
  betType: string;
  ev: number;
  odds: number;
  confidence: number;
}): Promise<void> {
  const evStr = pick.ev > 0 ? `+${pick.ev.toFixed(1)}%` : `${pick.ev.toFixed(1)}%`;
  const oddsStr = pick.odds > 0 ? `+${pick.odds}` : String(pick.odds);
  await broadcastPush({
    title: `🔥 New +EV Pick: ${pick.sport.toUpperCase()}`,
    body: `${pick.team} ${pick.betType} (${oddsStr}) — EV: ${evStr} | Confidence: ${pick.confidence}%`,
    url: "https://chalkpicks.live/ev-finder",
    tag: "ev-alert",
    icon: "/icon-192.png",
  });
}

/**
 * Send a daily picks digest push to all subscribed users.
 */
export async function sendDailyPicksPush(pickCount: number, topSport: string): Promise<void> {
  await broadcastPush({
    title: `📊 ${pickCount} New ChalkPicks Today`,
    body: `Top picks for ${topSport} and more are ready. Check your dashboard.`,
    url: "https://chalkpicks.live/picks",
    tag: "daily-picks",
    icon: "/icon-192.png",
  });
}
