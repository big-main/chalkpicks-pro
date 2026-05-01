import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notificationPreferences, notifications, notificationLogs } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
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
