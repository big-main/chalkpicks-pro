import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { sendEmail } from "../email";

export const newsletterRouter = router({
  /**
   * Subscribe an email to the newsletter.
   * Idempotent — re-subscribing a previously unsubscribed address reactivates it.
   */
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email(),
      source: z.string().max(64).default("blog"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Upsert: if email already exists, reactivate; otherwise insert
      const existing = await db
        .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].status === "unsubscribed") {
          await db
            .update(newsletterSubscribers)
            .set({ status: "active" })
            .where(eq(newsletterSubscribers.email, input.email));
        }
        // Already active — still return success (idempotent)
        return { ok: true, isNew: false };
      }

      // New subscriber
      await db.insert(newsletterSubscribers).values({
        email: input.email,
        source: input.source,
        status: "active",
      });

      // Fire welcome email (non-blocking — don't fail the mutation if email fails)
      sendEmail({
        to: input.email,
        subject: "You're in — ChalkPicks daily picks start now ⚡",
        type: "newsletter-welcome",
        data: { email: input.email },
      }).then((sent) => {
        if (sent) {
          // Mark welcome sent timestamp
          getDb().then(db2 => {
            if (db2) {
              db2.update(newsletterSubscribers)
                .set({ welcomeSentAt: new Date() })
                .where(eq(newsletterSubscribers.email, input.email))
                .catch(() => {});
            }
          });
        }
      }).catch(() => {});

      return { ok: true, isNew: true };
    }),

  /**
   * Unsubscribe an email from the newsletter.
   */
  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(newsletterSubscribers)
        .set({ status: "unsubscribed" })
        .where(eq(newsletterSubscribers.email, input.email));

      return { ok: true };
    }),
});
