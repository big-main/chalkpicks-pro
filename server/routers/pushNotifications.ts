import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";

export const pushNotificationsRouter = router({
  // Get VAPID public key for frontend to create subscription
  getVapidPublicKey: publicProcedure.query(() => {
    return { publicKey: ENV.vapidPublicKey || null };
  }),

  // Subscribe: save a push subscription for the current user
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Check if this endpoint is already registered for this user
      const existing = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Already subscribed — update keys in case they changed
        await db
          .update(pushSubscriptions)
          .set({ p256dh: input.p256dh, auth: input.auth })
          .where(eq(pushSubscriptions.id, existing[0].id));
        return { success: true, alreadyExisted: true };
      }

      await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
      });

      return { success: true, alreadyExisted: false };
    }),

  // Unsubscribe: remove a push subscription
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  // Check if current user has an active push subscription
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { subscribed: false, count: 0 };

    const subs = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.user.id));

    return { subscribed: subs.length > 0, count: subs.length };
  }),
});
