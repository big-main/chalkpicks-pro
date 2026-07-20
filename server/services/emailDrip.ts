/**
 * Welcome Email Drip Sequence
 * 3-email series for new users:
 *   Step 1 (Day 1):  How to read picks + feature tour
 *   Step 2 (Day 3):  Advanced features (Arb Finder, EV Finder, Steam Moves)
 *   Step 3 (Day 7):  Upgrade offer with promo code
 */
import { eq, and, lte } from "drizzle-orm";
import { emailDripQueue, users } from "../../drizzle/schema";
import { sendEmail } from "../email";
import * as db from "../db";

const SITE_URL = "https://chalkpicks.live";

// ─── Email Templates ──────────────────────────────────────────────────────────

function step1Html(name: string): string {
  const firstName = name?.split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#39ff14;">CHALK</span><span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#d4a017;">PICKS</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Welcome, ${firstName}! 🎉</h1>
    <p style="color:#999;margin:0 0 24px;line-height:1.6;">You're in. Here's how to get the most out of ChalkPicks in the next 5 minutes.</p>

    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <h3 style="color:#39ff14;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Step 1 — Read Today's Picks</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">Each pick shows the game, our recommended bet, confidence score, and AI analysis. Green = strong edge. Gold = high value.</p>
      <a href="${SITE_URL}/picks" style="display:inline-block;background:#39ff14;color:#000;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">View Today's Picks →</a>
    </div>

    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <h3 style="color:#d4a017;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🏦 Step 2 — Pick a Sportsbook</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">We've partnered with the top books. Each pick has a "Place Bet" button that takes you directly to the right game with the best odds.</p>
      <a href="${SITE_URL}/sportsbooks" style="display:inline-block;background:#d4a017;color:#000;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Compare Sportsbooks →</a>
    </div>

    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#fff;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🔔 Step 3 — Enable Alerts</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">Turn on push notifications to get alerted the moment a new pick drops or a steam move is detected — before the line moves.</p>
      <a href="${SITE_URL}/settings" style="display:inline-block;background:#1a1a1a;color:#fff;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #333;">Enable Notifications →</a>
    </div>

    <p style="color:#555;font-size:12px;text-align:center;">ChalkPicks Pro · <a href="${SITE_URL}/unsubscribe" style="color:#555;">Unsubscribe</a></p>
  </div>
</body>
</html>`;
}

function step2Html(name: string): string {
  const firstName = name?.split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#39ff14;">CHALK</span><span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#d4a017;">PICKS</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">The tools the pros use, ${firstName} 🔬</h1>
    <p style="color:#999;margin:0 0 24px;line-height:1.6;">You've seen the picks. Here are the 3 pro tools that give ChalkPicks members a real edge.</p>

    <div style="background:#111;border:1px solid #1a3a1a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <h3 style="color:#39ff14;margin:0 0 6px;font-size:15px;font-weight:700;">⚡ Arbitrage Finder</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">Finds guaranteed-profit opportunities by betting both sides across different books. Risk-free money when the math lines up.</p>
      <a href="${SITE_URL}/arbitrage" style="color:#39ff14;font-size:13px;font-weight:600;text-decoration:none;">Try Arbitrage Finder →</a>
    </div>

    <div style="background:#111;border:1px solid #3a2a00;border-radius:12px;padding:20px;margin-bottom:16px;">
      <h3 style="color:#d4a017;margin:0 0 6px;font-size:15px;font-weight:700;">📈 +EV Finder</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">Identifies bets where the true probability is higher than what the book is offering. Long-term, +EV bets always win.</p>
      <a href="${SITE_URL}/ev-finder" style="color:#d4a017;font-size:13px;font-weight:600;text-decoration:none;">Find +EV Bets →</a>
    </div>

    <div style="background:#111;border:1px solid #1a1a3a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#7c9ef8;margin:0 0 6px;font-size:15px;font-weight:700;">🌊 Steam Move Detector</h3>
      <p style="color:#ccc;margin:0 0 12px;font-size:14px;line-height:1.6;">Detects when sharp money moves a line fast — a signal that professional bettors know something. Follow the steam.</p>
      <a href="${SITE_URL}/sharp-money" style="color:#7c9ef8;font-size:13px;font-weight:600;text-decoration:none;">Track Steam Moves →</a>
    </div>

    <p style="color:#555;font-size:12px;text-align:center;">ChalkPicks Pro · <a href="${SITE_URL}/unsubscribe" style="color:#555;">Unsubscribe</a></p>
  </div>
</body>
</html>`;
}

function step3Html(name: string, promoCode?: string): string {
  const firstName = name?.split(" ")[0] || "there";
  const promo = promoCode || "WELCOME20";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#39ff14;">CHALK</span><span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#d4a017;">PICKS</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Your exclusive upgrade offer, ${firstName} 🏆</h1>
    <p style="color:#999;margin:0 0 24px;line-height:1.6;">You've been with us for a week. Here's a special offer to unlock everything.</p>

    <div style="background:linear-gradient(135deg,#0d1f0d,#1a1a00);border:1px solid rgba(57,255,20,0.3);border-radius:16px;padding:28px;margin-bottom:24px;text-align:center;">
      <p style="color:#39ff14;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Limited Time Offer</p>
      <h2 style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;">20% OFF</h2>
      <p style="color:#ccc;margin:0 0 20px;font-size:14px;">Your first month of ChalkPicks Pro</p>
      <div style="background:#0a0a0a;border:2px dashed rgba(57,255,20,0.4);border-radius:8px;padding:12px;margin-bottom:20px;">
        <span style="color:#39ff14;font-size:20px;font-weight:900;letter-spacing:4px;">${promo}</span>
      </div>
      <a href="${SITE_URL}/pricing?promo=${promo}" style="display:inline-block;background:#39ff14;color:#000;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Claim Your Discount →</a>
      <p style="color:#555;font-size:12px;margin:12px 0 0;">Expires in 48 hours</p>
    </div>

    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#fff;margin:0 0 12px;font-size:14px;">What Pro unlocks:</h3>
      <ul style="color:#ccc;font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
        <li>Unlimited AI picks (all sports, all games)</li>
        <li>Arbitrage Finder with real-time alerts</li>
        <li>+EV Finder with 20+ sportsbooks</li>
        <li>Steam Move Detector (sharp money signals)</li>
        <li>CLV Tracker (closing line value analysis)</li>
        <li>Quant models (Elo ratings, Monte Carlo)</li>
        <li>Priority push notifications</li>
      </ul>
    </div>

    <p style="color:#555;font-size:12px;text-align:center;">ChalkPicks Pro · <a href="${SITE_URL}/unsubscribe" style="color:#555;">Unsubscribe</a></p>
  </div>
</body>
</html>`;
}

// ─── Queue Management ─────────────────────────────────────────────────────────

/**
 * Enqueue a 3-step welcome drip for a new user.
 * Call this immediately after user registration.
 */
export async function enqueueWelcomeDrip(userId: number, email: string): Promise<void> {
  const database = await db.getDb();
  if (!database) return;

  const now = new Date();
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await database.insert(emailDripQueue).values([
    { userId, email, sequence: "welcome", step: 1, sendAt: now, status: "pending" },
    { userId, email, sequence: "welcome", step: 2, sendAt: day3, status: "pending" },
    { userId, email, sequence: "welcome", step: 3, sendAt: day7, status: "pending" },
  ]);
  console.log(`[EmailDrip] Queued 3-step welcome drip for user ${userId} (${email})`);
}

/**
 * Process pending drip emails that are due to be sent.
 * Called by the heartbeat scheduler every hour.
 */
export async function processDripQueue(): Promise<void> {
  const database = await db.getDb();
  if (!database) return;

  const now = new Date();
  const pending = await database
    .select({ id: emailDripQueue.id, userId: emailDripQueue.userId, email: emailDripQueue.email, step: emailDripQueue.step })
    .from(emailDripQueue)
    .where(and(eq(emailDripQueue.status, "pending"), lte(emailDripQueue.sendAt, now)))
    .limit(20);

  if (pending.length === 0) return;
  console.log(`[EmailDrip] Processing ${pending.length} pending drip emails`);

  for (const item of pending) {
    try {
      // Fetch user name
      const [user] = await database.select({ name: users.name, subscriptionTier: users.subscriptionTier })
        .from(users).where(eq(users.id, item.userId)).limit(1);

      // Skip if user is already a paid subscriber (don't send upgrade email)
      if (item.step === 3 && user?.subscriptionTier && user.subscriptionTier !== "free") {
        await database.update(emailDripQueue)
          .set({ status: "skipped", sentAt: now })
          .where(eq(emailDripQueue.id, item.id));
        continue;
      }

      const name = user?.name || "there";
      let subject = "";
      let html = "";

      if (item.step === 1) {
        subject = "Welcome to ChalkPicks — here's how to get started 🎉";
        html = step1Html(name);
      } else if (item.step === 2) {
        subject = "The 3 pro tools that give ChalkPicks members an edge 🔬";
        html = step2Html(name);
      } else if (item.step === 3) {
        subject = "Your exclusive 20% off upgrade offer (expires in 48h) 🏆";
        html = step3Html(name);
      }

      const sent = await sendEmail({ to: item.email, subject, type: "alert", data: { html } });

      await database.update(emailDripQueue)
        .set({ status: sent ? "sent" : "failed", sentAt: now })
        .where(eq(emailDripQueue.id, item.id));

      console.log(`[EmailDrip] Step ${item.step} → ${item.email}: ${sent ? "sent" : "failed"}`);
    } catch (err) {
      console.error(`[EmailDrip] Error processing drip ${item.id}:`, err);
      await database.update(emailDripQueue)
        .set({ status: "failed" })
        .where(eq(emailDripQueue.id, item.id));
    }
  }
}
