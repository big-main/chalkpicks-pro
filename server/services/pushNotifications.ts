import webpush from "web-push";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let initialized = false;

function initWebPush() {
  if (initialized) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[PushNotifications] VAPID keys not configured — push disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:support@chalkpicks.live",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  initWebPush();
  if (!initialized) return { sent: 0, failed: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (!subs.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  await Promise.all(subs.map(async (sub) => {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent++;
    } catch (err: any) {
      failed++;
      // Remove expired/invalid subscriptions (410 = Gone, 404 = Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        try {
          const db2 = await getDb();
          if (db2) await db2.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } catch {}
      }
    }
  }));

  return { sent, failed };
}

export async function sendPushToAllSubscribers(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  initWebPush();
  if (!initialized) return { sent: 0, failed: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subs = await db.select().from(pushSubscriptions);
  if (!subs.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  // Batch in groups of 50 to avoid overwhelming the service
  const batches = [];
  for (let i = 0; i < subs.length; i += 50) {
    batches.push(subs.slice(i, i + 50));
  }

  for (const batch of batches) {
    await Promise.all(batch.map(async (sub) => {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            const db2 = await getDb();
            if (db2) await db2.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          } catch {}
        }
      }
    }));
  }

  return { sent, failed };
}

export async function sendHighConfidencePickAlert(pick: {
  id: number;
  recommendation: string;
  sportKey: string;
  confidenceScore: number;
  edgeScore?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
}): Promise<void> {
  const sport = pick.sportKey.toUpperCase();
  const matchup = pick.homeTeam && pick.awayTeam
    ? `${pick.awayTeam} @ ${pick.homeTeam}`
    : sport;

  const payload: PushPayload = {
    title: `🔥 High-Confidence Pick Alert (${pick.confidenceScore}%)`,
    body: `${pick.recommendation} — ${matchup}`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    url: `/picks/${pick.id}`,
    tag: `pick-${pick.id}`,
  };

  try {
    const result = await sendPushToAllSubscribers(payload);
    console.log(`[PushNotifications] Sent pick alert for pick #${pick.id}: ${result.sent} sent, ${result.failed} failed`);
  } catch (err) {
    console.error("[PushNotifications] Failed to send pick alert:", err);
  }
}

/**
 * Send a "New Pick Available" push notification to all subscribers.
 * Fires for every new pick published, regardless of confidence score.
 */
export async function sendNewPickAlert(pick: {
  id: number;
  recommendation: string;
  sportKey: string;
  confidenceScore: number;
  tier: string;
  homeTeam?: string | null;
  awayTeam?: string | null;
}): Promise<void> {
  const sport = pick.sportKey.replace(/_/g, " ").toUpperCase();
  const matchup = pick.homeTeam && pick.awayTeam
    ? `${pick.awayTeam} @ ${pick.homeTeam}`
    : sport;
  const tierLabel = pick.tier === "free" ? "" : ` [${pick.tier.toUpperCase()}]`;

  const payload: PushPayload = {
    title: `📊 New Pick Available${tierLabel}`,
    body: `${pick.recommendation} — ${matchup} (${pick.confidenceScore}% confidence)`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    url: `/picks/${pick.id}`,
    tag: `new-pick-${pick.id}`,
  };

  try {
    const result = await sendPushToAllSubscribers(payload);
    console.log(`[PushNotifications] New pick alert #${pick.id}: ${result.sent} sent, ${result.failed} failed`);
  } catch (err) {
    console.error("[PushNotifications] Failed to send new pick alert:", err);
  }
}
