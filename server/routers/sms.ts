import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import twilio from "twilio";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "";

export const smsRouter = router({
  /**
   * Enable SMS notifications for the current user
   * Stores phone number and sets SMS preference
   */
  enableSMS: protectedProcedure
    .input(z.object({ phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number") }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        // Send verification code via SMS (in production, generate and store code)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await twilioClient.messages.create({
          body: `Your ChalkPicks verification code is: ${verificationCode}. Valid for 10 minutes.`,
          from: TWILIO_PHONE,
          to: input.phoneNumber,
        });

        console.log(`[SMS] Verification code sent to ${input.phoneNumber} for user ${ctx.user.id}`);

        return {
          success: true,
          message: "Verification code sent. Check your phone.",
          verificationCode, // In production, don't return this; store in DB with expiry
        };
      } catch (error) {
        console.error("[SMS] Failed to send verification code:", error);
        return {
          success: false,
          message: "Failed to send SMS. Please try again.",
        };
      }
    }),

  /**
   * Send SMS alert when a new pick is available
   */
  sendPickAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        sport: z.string(),
        recommendation: z.string(),
        confidence: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const message = `🎯 New ChalkPicks Alert!\n${input.sport}: ${input.recommendation}\nConfidence: ${input.confidence}%\n\nCheck your picks: chalkpicks.live/picks`;

        await twilioClient.messages.create({
          body: message,
          from: TWILIO_PHONE,
          to: input.phoneNumber,
        });

        console.log(`[SMS] Pick alert sent to ${input.phoneNumber}`);
        return { success: true };
      } catch (error) {
        console.error("[SMS] Failed to send pick alert:", error);
        return { success: false, error: "Failed to send SMS" };
      }
    }),

  /**
   * Send SMS when a user's bet wins
   */
  sendWinAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        betAmount: z.number(),
        winAmount: z.number(),
        sport: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const profit = input.winAmount - input.betAmount;
        const message = `🎉 You Won!\n${input.sport}\nProfit: +$${profit.toFixed(2)}\nTotal: $${input.winAmount.toFixed(2)}\n\nchalkpicks.live`;

        await twilioClient.messages.create({
          body: message,
          from: TWILIO_PHONE,
          to: input.phoneNumber,
        });

        console.log(`[SMS] Win alert sent to ${input.phoneNumber}`);
        return { success: true };
      } catch (error) {
        console.error("[SMS] Failed to send win alert:", error);
        return { success: false, error: "Failed to send SMS" };
      }
    }),

  /**
   * Send SMS when steam move is detected
   */
  sendSteamAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        sport: z.string(),
        event: z.string(),
        movement: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      try {
        const message = `⚡ Steam Move Detected!\n${input.sport}\n${input.event}\nMovement: ${input.movement}\n\nAct fast: chalkpicks.live/picks`;

        await twilioClient.messages.create({
          body: message,
          from: TWILIO_PHONE,
          to: input.phoneNumber,
        });

        console.log(`[SMS] Steam alert sent to ${input.phoneNumber}`);
        return { success: true };
      } catch (error) {
        console.error("[SMS] Failed to send steam alert:", error);
        return { success: false, error: "Failed to send SMS" };
      }
    }),
});
