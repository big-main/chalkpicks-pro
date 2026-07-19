import { invokeLLM } from "./_core/llm";
import nodemailer from "nodemailer";

// ─── Resend HTTP API helper (no SDK needed) ───────────────────────────────────
async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || "ChalkPicks Pro <noreply@chalkpicks.live>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email/Resend] Error:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email/Resend] Fetch failed:", e);
    return false;
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  type: "daily-picks" | "subscription-confirmation" | "performance-summary" | "alert" | "welcome" | "newsletter-welcome";
  data?: Record<string, any>;
}

export interface WelcomeEmailOptions {
  email: string;
  name: string;
  tier: "daily" | "monthly" | "yearly";
  expiresAt: Date;
}

// Email configuration — uses environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email notification to a user
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const { to, subject, type, data } = payload;

    // Generate email content based on type
    let htmlContent = "";

    switch (type) {
      case "daily-picks":
        htmlContent = generateDailyPicksEmail(data || {});
        break;
      case "subscription-confirmation":
        htmlContent = generateSubscriptionConfirmationEmail(data || {});
        break;
      case "performance-summary":
        htmlContent = generatePerformanceSummaryEmail(data || {});
        break;
      case "alert":
        htmlContent = generateAlertEmail(data || {});
        break;
      case "welcome":
        htmlContent = generateWelcomeEmail(data || {});
        break;
      case "newsletter-welcome":
        htmlContent = generateNewsletterWelcomeEmail(data || {});
        break;
    }

    console.log(`[Email] Sending ${type} to ${to}`);

    // Priority: Resend API → SMTP → log-only fallback
    if (process.env.RESEND_API_KEY) {
      const sent = await sendViaResend(to, subject, htmlContent);
      if (!sent) console.warn("[Email] Resend failed, falling back to SMTP");
      else { console.log(`[Email] Sent via Resend: ${subject} → ${to}`); return true; }
    }
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"ChalkPicks Pro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[Email] Sent via SMTP: ${subject} → ${to}`);
    } else {
      // Dev fallback: log content only
      console.log(`[Email] No email provider configured — logged only. Subject: ${subject} → ${to}`);
    }

    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

function generateDailyPicksEmail(data: Record<string, any>): string {
  const picks = data.picks || [];
  const picksList = picks
    .map(
      (pick: any) =>
        `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #333;">
        <strong>${pick.sport}</strong> - ${pick.recommendation}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
        <span style="background: #fbbf24; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${pick.confidenceScore}%
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
        ${pick.edgeScore}
      </td>
    </tr>`
    )
    .join("");

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #fbbf24; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Today's ChalkPicks</h1>
            <p>Your daily AI-powered sports betting picks</p>
          </div>
          
          <p>Good morning! Here are today's premium picks:</p>
          
          <table>
            <thead>
              <tr style="background: #222;">
                <th style="padding: 12px; text-align: left;">Pick</th>
                <th style="padding: 12px; text-align: center;">Confidence</th>
                <th style="padding: 12px; text-align: center;">Edge</th>
              </tr>
            </thead>
            <tbody>
              ${picksList}
            </tbody>
          </table>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/picks" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View All Picks
            </a>
          </p>
          
          <div class="footer">
            <p>You're receiving this because you're subscribed to daily pick alerts.</p>
            <p><a href="https://chalkpicks.pro/subscription-management" style="color: #fbbf24; text-decoration: none;">Manage preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateSubscriptionConfirmationEmail(data: Record<string, any>): string {
  const tier = data.tier || "monthly";
  const amount = data.amount || "$29.99";
  const renewalDate = data.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #22c55e; margin: 0; }
          .details { background: #222; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Subscription Confirmed</h1>
            <p>Welcome to ChalkPicks Pro!</p>
          </div>
          
          <p>Thank you for upgrading your subscription. Your payment has been processed successfully.</p>
          
          <div class="details">
            <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Next Renewal:</strong> ${renewalDate}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Active</span></p>
          </div>
          
          <p>You now have access to:</p>
          <ul style="color: #e5e7eb;">
            <li>Premium AI-powered picks</li>
            <li>Advanced backtesting engine</li>
            <li>Daily pick alerts</li>
            <li>Performance analytics</li>
            <li>Priority support</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/picks" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Start Betting
            </a>
          </p>
          
          <div class="footer">
            <p>Questions? <a href="https://chalkpicks.pro/support" style="color: #fbbf24; text-decoration: none;">Contact support</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generatePerformanceSummaryEmail(data: Record<string, any>): string {
  const period = data.period || "This Week";
  const wins = data.wins || 0;
  const losses = data.losses || 0;
  const winRate = data.winRate || 0;
  const roi = data.roi || 0;

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #60a5fa; margin: 0; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat { background: #222; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #fbbf24; }
          .stat-label { font-size: 12px; color: #888; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Performance Summary</h1>
            <p>${period}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${wins}</div>
              <div class="stat-label">Wins</div>
            </div>
            <div class="stat">
              <div class="stat-value">${losses}</div>
              <div class="stat-label">Losses</div>
            </div>
            <div class="stat">
              <div class="stat-value">${winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: ${roi > 0 ? "#22c55e" : "#ef4444"};">${roi > 0 ? "+" : ""}${roi}%</div>
              <div class="stat-label">ROI</div>
            </div>
          </div>
          
          <p style="text-align: center;">
            <a href="https://chalkpicks.pro/dashboard" style="background: #60a5fa; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Full Dashboard
            </a>
          </p>
          
          <div class="footer">
            <p>Keep up the great work! Check the leaderboard to see how you rank.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateWelcomeEmail(data: Record<string, any>): string {
  const tier = (data.tier || "monthly") as "daily" | "monthly" | "yearly";
  const tierName = { daily: "Daily Pass", monthly: "Monthly Pro", yearly: "Annual VIP" }[tier];
  const expiresDate = new Date(data.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const tierFeatures = {
    daily: ["Daily AI picks", "Live stats", "Leaderboard access"],
    monthly: ["All Daily features", "+EV Finder", "Steam detector", "CLV Tracker", "Backtesting", "Kelly Calculator", "Email alerts"],
    yearly: ["All Monthly features", "Advanced backtesting", "Custom AI picks", "VIP Discord", "1-on-1 sessions"],
  }[tier];

  return `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #39ff14 0%, #00ff87 100%); color: #000; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px 20px; }
          .tier-badge { display: inline-block; background: #39ff14; color: #000; padding: 8px 16px; border-radius: 4px; font-weight: 600; margin: 10px 0; }
          .features { list-style: none; padding: 0; margin: 20px 0; }
          .features li { padding: 8px 0; padding-left: 24px; position: relative; color: #e5e7eb; }
          .features li:before { content: "✓"; position: absolute; left: 0; color: #39ff14; font-weight: bold; }
          .cta-button { display: inline-block; background: #39ff14; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .expires { background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; color: #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ChalkPicks!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your subscription is now active</p>
          </div>
          
          <div class="content">
            <p style="color: #e5e7eb;">Hi ${data.name},</p>
            
            <p style="color: #e5e7eb;">Thank you for subscribing to ChalkPicks! Your payment has been processed and your account is now upgraded.</p>
            
            <div style="text-align: center;">
              <span class="tier-badge">${tierName}</span>
            </div>
            
            <h2 style="margin-top: 30px; color: #39ff14;">What's included:</h2>
            <ul class="features">
              ${tierFeatures.map((f: string) => `<li>${f}</li>`).join("")}
            </ul>
            
            <div class="expires">
              <strong>Subscription expires:</strong> ${expiresDate}
            </div>
            
            <p style="color: #e5e7eb;">Your subscription will automatically renew. You can manage or cancel anytime from account settings.</p>
            
            <div style="text-align: center;">
              <a href="https://chalkpicks.live/account-settings" class="cta-button">Go to Dashboard</a>
            </div>
            
            <h3 style="margin-top: 30px; color: #39ff14;">Quick start tips:</h3>
            <ul style="color: #e5e7eb;">
              <li><strong>Check picks:</strong> Visit the Picks page for today's AI picks</li>
              <li><strong>Explore tools:</strong> Try +EV Finder and Parlay Optimizer</li>
              <li><strong>Join community:</strong> Connect on the Leaderboard</li>
              <li><strong>Enable notifications:</strong> Get alerts when new picks drop</li>
            </ul>
            
            <p style="margin-top: 30px; color: #888; font-size: 14px;">
              Questions? Reply to this email or visit <a href="https://chalkpicks.live/support" style="color: #39ff14; text-decoration: none;">chalkpicks.live/support</a>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 ChalkPicks. All rights reserved.</p>
            <p><a href="https://chalkpicks.live" style="color: #39ff14; text-decoration: none;">chalkpicks.live</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAlertEmail(data: Record<string, any>): string {
  const title = data.title || "Alert";
  const message = data.message || "";

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #e5e7eb; background: #0f0f0f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #f59e0b; margin: 0; }
          .message { background: #222; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${title}</h1>
          </div>
          
          <div class="message">
            ${message}
          </div>
        </div>
      </body>
    </html>
  `;
}


/**
 * Send a welcome email after subscription purchase
 * Used by webhook handler after checkout.session.completed
 */
export async function sendWelcomeEmail(options: WelcomeEmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[Email] SMTP credentials not configured, skipping welcome email");
      return false;
    }

    const tierName = { daily: "Daily Pass", monthly: "Monthly Pro", yearly: "Annual VIP" }[options.tier];

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.email,
      subject: `Welcome to ChalkPicks ${tierName}! 🎉`,
      html: generateWelcomeEmail({
        name: options.name,
        tier: options.tier,
        expiresAt: options.expiresAt,
      }),
    });

    console.log(`[Email] Welcome email sent to ${options.email} (message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
    return false;
  }
}

// ─── Drip Email Sequence ──────────────────────────────────────────────────────

/**
 * Send a raw HTML email directly (no template generation)
 */
export async function sendEmailRaw(to: string, subject: string, html: string): Promise<boolean> {
  try {
    console.log(`[Email] Sending raw email to ${to}`);
    if (process.env.RESEND_API_KEY) {
      const sent = await sendViaResend(to, subject, html);
      if (sent) { console.log(`[Email] Sent via Resend: ${subject} → ${to}`); return true; }
      console.warn("[Email] Resend failed, falling back to SMTP");
    }
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"ChalkPicks Pro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent via SMTP: ${subject} → ${to}`);
      return true;
    }
    console.log(`[Email] No email provider configured, logged only: ${subject} → ${to}`);
    return false;
  } catch (e) {
    console.error(`[Email/Raw] Error sending to ${to}:`, e);
    return false;
  }
}

export interface DripEmailOptions {
  email: string;
  name: string;
  day: 2 | 3 | 7;
  tier: "daily" | "monthly" | "yearly";
}

function generateDay2Email(name: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e2e8f0; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #39ff14; font-size: 24px; margin: 0;">ChalkPicks Pro Tips</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Day 2 of your journey</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">Hey ${name},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
        Now that you're set up, here are 3 tips to maximize your edge with ChalkPicks:
      </p>
      <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #39ff14; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">Pro Tips</h3>
        <div style="margin-bottom: 16px;">
          <strong style="color: #fff;">1. Follow High-Confidence Picks</strong>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Picks with 80%+ confidence score have a 78% historical win rate. Focus on quality over quantity.</p>
        </div>
        <div style="margin-bottom: 16px;">
          <strong style="color: #fff;">2. Use the +EV Finder Daily</strong>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Check the +EV Finder every morning. Lines move fast — early birds get the best value.</p>
        </div>
        <div>
          <strong style="color: #fff;">3. Enable Push Notifications</strong>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Turn on push alerts to get notified the moment high-confidence picks drop. Never miss an edge.</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://chalkpicks.live/picks" style="display: inline-block; background: #39ff14; color: #000; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px;">View Today's Picks</a>
      </div>
      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 32px;">
        Questions? Reply to this email — we read every message.
      </p>
    </div>
  `;
}

function generateDay3Email(name: string, tier: string): string {
  const isYearly = tier === "yearly";
  const upsellSection = !isYearly ? `
    <div style="background: linear-gradient(135deg, #1a2e1a, #0a1a0a); border: 1px solid rgba(57,255,20,0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <h3 style="color: #39ff14; font-size: 18px; margin: 0 0 8px;">Save 44% with Annual</h3>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">Switch to yearly and save $159.89/year vs monthly billing.</p>
      <a href="https://chalkpicks.live/pricing" style="display: inline-block; background: #39ff14; color: #000; font-weight: 700; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Upgrade to Annual</a>
    </div>
  ` : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e2e8f0; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #39ff14; font-size: 24px; margin: 0;">Share the Edge</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Day 3 — Unlock more value</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">Hey ${name},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
        Loving ChalkPicks? Share your referral code with friends and you'll both get rewarded.
      </p>
      <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <h3 style="color: #fff; font-size: 16px; margin: 0 0 8px;">Your Referral Program</h3>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">When a friend subscribes with your code:</p>
        <div style="display: inline-block; background: rgba(57,255,20,0.05); border: 1px solid rgba(57,255,20,0.2); border-radius: 8px; padding: 12px 20px;">
          <span style="color: #39ff14; font-weight: 700;">You get 20% commission</span>
          <span style="color: #64748b; margin: 0 8px;">+</span>
          <span style="color: #60a5fa; font-weight: 700;">They get 10% off</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <a href="https://chalkpicks.live/referrals" style="display: inline-block; background: #39ff14; color: #000; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px;">Get Your Referral Link</a>
      </div>
      ${upsellSection}
      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 32px;">
        Happy betting!<br/>— The ChalkPicks Team
      </p>
    </div>
  `;
}

function generateDay7Email(name: string, tier: string): string {
  const isYearly = tier === "yearly";
  if (isYearly) {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e2e8f0; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #39ff14; font-size: 24px; margin: 0;">One Week In 🎉</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">You're crushing it</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">Hey ${name},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
        You've been with ChalkPicks for a full week. As an Annual Elite member, you have access to everything — keep tracking your CLV and using the EV Finder to build your edge.
      </p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://chalkpicks.live/dashboard" style="display: inline-block; background: #39ff14; color: #000; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px;">View Your Dashboard</a>
      </div>
      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 32px;">— The ChalkPicks Team</p>
    </div>
  `;
  }
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e2e8f0; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #39ff14; font-size: 24px; margin: 0;">Your First Week Results</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Day 7 — Lock in your edge</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">Hey ${name},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
        You've had a full week to test ChalkPicks. Sharp bettors who track CLV consistently outperform the market by 3–8% over a season.
      </p>
      <div style="background: linear-gradient(135deg, #1a2e1a, #0a1a0a); border: 1px solid rgba(57,255,20,0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #39ff14; font-size: 18px; margin: 0 0 12px;">Upgrade to Annual Elite — Save 44%</h3>
        <ul style="color: #cbd5e1; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 16px;">
          <li>Lock in \$199.99/year vs \$359.88 monthly billing</li>
          <li>VIP Discord access (sharp plays + line alerts)</li>
          <li>Monthly 1-on-1 strategy sessions</li>
          <li>Priority support</li>
        </ul>
        <div style="text-align: center;">
          <a href="https://chalkpicks.live/pricing" style="display: inline-block; background: #39ff14; color: #000; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">Upgrade Now — Save \$159</a>
        </div>
      </div>
      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 32px;">
        This offer is available any time from your account settings.<br/>— The ChalkPicks Team
      </p>
    </div>
  `;
}

/**
 * Send a drip email (Day 2, 3, or 7 of the welcome sequence)
 */
export async function sendDripEmail(options: DripEmailOptions): Promise<boolean> {
  try {
    const subjectMap: Record<number, string> = {
      2: "3 Pro Tips to Maximize Your Edge",
      3: "Share ChalkPicks & Get Rewarded",
      7: options.tier === "yearly" ? "One Week In 🎉" : "Upgrade to Annual Elite — Save 44%",
    };
    const subject = subjectMap[options.day] ?? "ChalkPicks Update";

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return sendEmail({
        to: options.email,
        subject,
        type: "welcome",
        data: { name: options.name, tier: options.tier, dripDay: options.day },
      });
    }

    const htmlMap: Record<number, string> = {
      2: generateDay2Email(options.name),
      3: generateDay3Email(options.name, options.tier),
      7: generateDay7Email(options.name, options.tier),
    };
    const html = htmlMap[options.day] ?? generateDay2Email(options.name);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.email,
      subject,
      html,
    });

    console.log(`[Email] Drip day ${options.day} sent to ${options.email} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send drip day ${options.day} to ${options.email}:`, error);
    return false;
  }
}

/**
 * Newsletter welcome email — sent to new blog newsletter subscribers
 */
function generateNewsletterWelcomeEmail(data: Record<string, any>): string {
  const email = data.email || "";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to ChalkPicks Daily Picks</title>
      <style>
        body { margin: 0; padding: 0; background: #0a0f0a; font-family: 'Segoe UI', Arial, sans-serif; color: #e0e0e0; }
        .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
        .logo { font-size: 22px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; margin-bottom: 24px; }
        .hero { background: linear-gradient(135deg, #0d1f14 0%, #0a1520 100%); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 28px 24px; margin-bottom: 24px; }
        .hero h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 10px; }
        .hero p { font-size: 15px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.6; }
        .features { margin-bottom: 24px; }
        .feature { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .feature-icon { width: 32px; height: 32px; background: rgba(16,185,129,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .feature-text h3 { font-size: 14px; font-weight: 600; color: #fff; margin: 0 0 3px; }
        .feature-text p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
        .cta { text-align: center; margin-bottom: 24px; }
        .cta a { display: inline-block; background: #10b981; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 32px; border-radius: 8px; }
        .footer { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; line-height: 1.6; }
        .footer a { color: rgba(16,185,129,0.7); text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚡ ChalkPicks Pro</div>
        <div class="hero">
          <h1>You're in. Daily picks start now.</h1>
          <p>Welcome to the ChalkPicks newsletter — AI-powered +EV picks, sharp money alerts, and line movement signals delivered to your inbox every day.</p>
        </div>
        <div class="features">
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <div class="feature-text">
              <h3>Daily AI Picks</h3>
              <p>Top picks across NFL, NBA, MLB, NHL — with confidence scores and edge analysis.</p>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">📈</div>
            <div class="feature-text">
              <h3>Sharp Money Alerts</h3>
              <p>Know when the books move and where the sharp action is landing.</p>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">💰</div>
            <div class="feature-text">
              <h3>+EV Opportunities</h3>
              <p>Positive expected value plays identified by our arbitrage and CLV engine.</p>
            </div>
          </div>
        </div>
        <div class="cta">
          <a href="https://chalkpicks.live/picks">View Today's Picks →</a>
        </div>
        <div class="footer">
          You're receiving this because you subscribed at chalkpicks.live.<br />
          <a href="https://chalkpicks.live/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> · <a href="https://chalkpicks.live/privacy">Privacy Policy</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
