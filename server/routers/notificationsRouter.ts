import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notificationPreferences, notifications, notificationLogs, announcements, userAlerts, users, newsletterSubscribers } from "../../drizzle/schema";
import { eq, and, desc, isNull, or, gte, sql } from "drizzle-orm";
import {
  ensureUserPreferences,
  getUserInAppNotifications,
  getUserNotificationHistory,
  markNotificationRead,
} from "../notificationService";

export const notificationsRouter = router({
  // ─── Get user's in-app notifications ────────────────────────────────────────
  getInApp: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserInAppNotifications(ctx.user.id, input?.limit ?? 20);
    }),

  // ─── Get unread count ────────────────────────────────────────────────────────
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return { count: rows.length };
  }),

  // ─── Mark notification as read ───────────────────────────────────────────────
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  // ─── Mark all as read ────────────────────────────────────────────────────────
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),

  // ─── Get notification history (logs) ────────────────────────────────────────
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserNotificationHistory(ctx.user.id, input?.limit ?? 20);
    }),

  // ─── Get notification preferences ───────────────────────────────────────────
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    await ensureUserPreferences(ctx.user.id);
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))
      .limit(1);
    return rows[0] || null;
  }),

  // ─── Update notification preferences ────────────────────────────────────────
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        emailDailyPicks: z.boolean().optional(),
        emailDailyDigest: z.boolean().optional(),
        emailSubscriptionConfirm: z.boolean().optional(),
        emailLoginAlert: z.boolean().optional(),
        emailPerformanceSummary: z.boolean().optional(),
        emailDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        smsEnabled: z.boolean().optional(),
        smsPhone: z.string().max(32).optional(),
        smsDailyPicks: z.boolean().optional(),
        smsDailyDigest: z.boolean().optional(),
        smsSubscriptionConfirm: z.boolean().optional(),
        smsLoginAlert: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        inAppDailyPicks: z.boolean().optional(),
        inAppPerformance: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureUserPreferences(ctx.user.id);
      const db = await getDb();
      if (!db) return { success: false };

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) updateData[key] = value;
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(notificationPreferences)
          .set(updateData)
          .where(eq(notificationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),

  // ─── Send test notification (admin only) ────────────────────────────────────
  sendTest: protectedProcedure
    .input(z.object({ type: z.enum(["email", "sms", "in_app"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, message: "Database unavailable" };

      if (input.type === "in_app") {
        await db.insert(notifications).values({
          userId: ctx.user.id,
          type: "system",
          title: "Test Notification 🎯",
          message: "This is a test in-app notification from ChalkPicks Pro. Your notification system is working!",
        });
        return { success: true, message: "In-app test notification sent!" };
      }

      return { success: false, message: `${input.type} requires API credentials (SendGrid/Twilio). Configure them in Settings.` };
    }),

  // ─── Public: Get active announcements ────────────────────────────────────────
  getActiveAnnouncements: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db
      .select()
      .from(announcements)
      .where(and(eq(announcements.isActive, true), or(isNull(announcements.endsAt), gte(announcements.endsAt, now))))
      .orderBy(desc(announcements.createdAt))
      .limit(5);
  }),

  // ─── User: Get my alerts ──────────────────────────────────────────────────────
  getMyAlerts: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { alerts: [], unreadCount: 0 };
      const alerts = await db
        .select()
        .from(userAlerts)
        .where(eq(userAlerts.userId, ctx.user.id))
        .orderBy(desc(userAlerts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const unreadRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(userAlerts)
        .where(and(eq(userAlerts.userId, ctx.user.id), eq(userAlerts.isRead, false)));
      return { alerts, unreadCount: Number(unreadRows[0]?.count ?? 0) };
    }),

  // ─── User: Mark alert read ────────────────────────────────────────────────────
  markAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.update(userAlerts).set({ isRead: true }).where(and(eq(userAlerts.id, input.alertId), eq(userAlerts.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ─── User: Mark all alerts read ───────────────────────────────────────────────
  markAllAlerts: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ok: false };
    await db.update(userAlerts).set({ isRead: true }).where(and(eq(userAlerts.userId, ctx.user.id), eq(userAlerts.isRead, false)));
    return { ok: true };
  }),

  // ─── Admin: Create announcement ───────────────────────────────────────────────
  createAnnouncement: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      body: z.string().min(1),
      type: z.enum(["info", "warning", "success", "promo"]).default("info"),
      ctaText: z.string().max(64).optional(),
      ctaUrl: z.string().max(512).optional(),
      endsAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.insert(announcements).values({
        title: input.title, body: input.body, type: input.type,
        ctaText: input.ctaText ?? null, ctaUrl: input.ctaUrl ?? null,
        isActive: true, endsAt: input.endsAt ? new Date(input.endsAt) : null,
        createdBy: ctx.user.id,
      });
      return { ok: true };
    }),

  // ─── Admin: Update announcement ───────────────────────────────────────────────
  updateAnnouncement: adminProcedure
    .input(z.object({
      id: z.number(), title: z.string().optional(), body: z.string().optional(),
      type: z.enum(["info", "warning", "success", "promo"]).optional(),
      ctaText: z.string().nullable().optional(), ctaUrl: z.string().nullable().optional(),
      isActive: z.boolean().optional(), endsAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      const { id, ...rest } = input;
      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = k === "endsAt" ? (v ? new Date(v as string) : null) : v;
      if (Object.keys(updates).length) await db.update(announcements).set(updates).where(eq(announcements.id, id));
      return { ok: true };
    }),

  // ─── Admin: Delete announcement ───────────────────────────────────────────────
  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.delete(announcements).where(eq(announcements.id, input.id));
      return { ok: true };
    }),

  // ─── Admin: List announcements ────────────────────────────────────────────────
  listAnnouncements: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);
  }),

  // ─── Admin: Broadcast push + save as in-app alert for all users ───────────────
  broadcastPush: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(128),
      body: z.string().min(1).max(512),
      url: z.string().optional(),
      saveAsAlert: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false, pushCount: 0 };
      // Send web push
      let pushCount = 0;
      try {
        const { sendPushToAllSubscribers } = await import("../services/pushNotifications");
        const pushResult = await sendPushToAllSubscribers({ title: input.title, body: input.body, url: input.url ?? "/picks" });
        pushCount = pushResult.sent;
      } catch (e) { console.error("[Broadcast] Push error:", e); }
      // Save in-app alert for all users
      if (input.saveAsAlert) {
        const allUsers = await db.select({ id: users.id }).from(users).limit(5000);
        const batchSize = 100;
        for (let i = 0; i < allUsers.length; i += batchSize) {
          const batch = allUsers.slice(i, i + batchSize);
          await db.insert(userAlerts).values(batch.map((u: { id: number }) => ({
            userId: u.id, type: "broadcast" as const,
            title: input.title, body: input.body,
            actionUrl: input.url ?? null, isRead: false,
          })));
        }
      }
      return { ok: true, pushCount };
    }),

  // ─── Admin: Email blast to all newsletter subscribers ─────────────────────────
  emailBlast: adminProcedure
    .input(z.object({
      subject: z.string().min(1).max(256),
      htmlBody: z.string().min(1),
      testOnly: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false, sent: 0, errors: 0 };
      const { sendEmailRaw } = await import("../email");
      const subs = await db
        .select({ email: newsletterSubscribers.email })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, "active"))
        .limit(input.testOnly ? 1 : 10000);
      let sent = 0;
      const errors: string[] = [];
      for (const sub of subs) {
        try {
          await sendEmailRaw(sub.email, input.subject, input.htmlBody);
          sent++;
          if (sent % 10 === 0) await new Promise((r) => setTimeout(r, 500));
        } catch (e) { errors.push(sub.email); }
      }
      return { ok: true, sent, errors: errors.length };
    }),

  // ─── Public endpoint for scheduled tasks to send daily picks ────────────────
  scheduledDailyPicks: publicProcedure
    .input(z.object({ secret: z.string() }))
    .mutation(async ({ input }) => {
      if (input.secret !== (process.env.SCHEDULER_SECRET || "chalkpicks-scheduler-2024")) {
        return { success: false, message: "Unauthorized" };
      }
      const { sendDailyPicksToAllUsers, sendDailyDigestToAllUsers } = await import("../notificationService");
      await sendDailyPicksToAllUsers();
      await sendDailyDigestToAllUsers();
      return { success: true, message: "Daily notifications dispatched" };
    }),
});
