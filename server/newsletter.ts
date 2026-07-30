import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// In-memory store for newsletter subscribers (in production, use database)
const subscribers = new Set<string>();

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({ email: z.string().email(), source: z.string().optional() })
    )
    .mutation(async ({ input }) => {
      const { email, source } = input;

      // Check if already subscribed
      if (subscribers.has(email)) {
        throw new Error("Email already subscribed to newsletter");
      }

      try {
        // Send welcome email via Resend
        if (!resend) {
          throw new Error("Email service not configured");
        }
        const result = await resend.emails.send({
          from: "ChalkPicks <noreply@chalkpicks.live>",
          to: email,
          subject: "Welcome to ChalkPicks Daily Picks! 🎯",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #d4af37;">Welcome to ChalkPicks Daily Picks!</h1>
              <p style="color: #666; font-size: 16px;">
                You're now subscribed to receive AI-powered sports betting picks every morning at 8 AM PT.
              </p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #39ff14; margin-top: 0;">What You'll Get:</h2>
                <ul style="color: #333;">
                  <li>Daily AI picks for NFL, NBA, MLB & NHL</li>
                  <li>Confidence scores and edge analysis</li>
                  <li>Steam move alerts</li>
                  <li>Arbitrage opportunities</li>
                  <li>Exclusive +EV finder results</li>
                </ul>
              </div>
              <p style="color: #666; font-size: 14px;">
                Start your free trial at <a href="https://chalkpicks.live" style="color: #d4af37;">chalkpicks.live</a>
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">
                You can unsubscribe anytime by replying to this email.
              </p>
            </div>
          `,
        });

        if (result.error) {
          throw new Error(
            `Failed to send welcome email: ${result.error.message}`
          );
        }

        // Add to subscribers set
        subscribers.add(email);

        return {
          success: true,
          message: "Successfully subscribed to daily picks newsletter",
        };
      } catch (error) {
        console.error("Newsletter subscription error:", error);
        throw new Error("Failed to subscribe to newsletter. Please try again.");
      }
    }),

  // Admin endpoint to get subscriber count (protected in production)
  getSubscriberCount: publicProcedure.query(() => {
    return {
      count: subscribers.size,
    };
  }),
});
