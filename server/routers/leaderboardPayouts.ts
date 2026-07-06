import { publicProcedure, protectedProcedure, router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users, leaderboardPayouts } from "../../drizzle/schema";
import { eq, desc, limit } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20",
});

const WEEKLY_PRIZE_POOL = 50000; // $500 in cents
const TOP_WINNERS_COUNT = 5;

export const leaderboardPayoutsRouter = router({
  // Get current weekly leaderboard
  getWeeklyLeaderboard: publicProcedure.query(async () => {
    try {
      const topUsers = await db.query.users.findMany({
        orderBy: [desc(users.weeklyWinRate)],
        limit: 10,
      });

      return {
        success: true,
        leaderboard: topUsers.map((user, idx) => ({
          rank: idx + 1,
          userId: user.id,
          name: user.name || "Anonymous",
          winRate: user.weeklyWinRate || 0,
          profit: user.weeklyProfit || 0,
          picks: user.weeklyPicks || 0,
          stripeConnectId: user.stripeConnectId ? "connected" : "not_connected",
        })),
      };
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      return { success: false, error: "Failed to fetch leaderboard" };
    }
  }),

  // Connect Stripe Connect account for payouts
  connectStripeAccount: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Generate OAuth link for Stripe Connect
      const clientId = process.env.STRIPE_CONNECT_CLIENT_ID || "";
      const redirectUri = `${process.env.VITE_FRONTEND_URL || "https://chalkpicks.live"}/api/stripe/connect/callback`;

      const oauthUrl = `https://connect.stripe.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=read_write&redirect_uri=${redirectUri}&state=${ctx.user.id}`;

      return {
        success: true,
        oauthUrl,
        message: "Redirect to Stripe Connect to link your account",
      };
    } catch (error) {
      console.error("Failed to generate Stripe Connect URL:", error);
      return { success: false, error: "Failed to generate connection URL" };
    }
  }),

  // Handle Stripe Connect callback
  handleStripeConnectCallback: protectedProcedure
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for access token
        const response = await fetch("https://connect.stripe.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_secret: process.env.STRIPE_SECRET_KEY || "",
            code: input.code,
            grant_type: "authorization_code",
          }).toString(),
        });

        const data = (await response.json()) as { stripe_user_id?: string };

        if (data.stripe_user_id) {
          await db
            .update(users)
            .set({ stripeConnectId: data.stripe_user_id })
            .where(eq(users.id, ctx.user.id));

          return { success: true, message: "Stripe account connected" };
        }

        return { success: false, error: "Failed to connect Stripe account" };
      } catch (error) {
        console.error("Stripe Connect callback error:", error);
        return { success: false, error: "Failed to process connection" };
      }
    }),

  // Distribute weekly prize pool to top 5 users
  distributeWeeklyPrizes: adminProcedure.mutation(async () => {
    try {
      // Get top 5 users by win rate
      const topUsers = await db.query.users.findMany({
        orderBy: [desc(users.weeklyWinRate)],
        limit: TOP_WINNERS_COUNT,
      });

      if (topUsers.length === 0) {
        return { success: false, error: "No users to pay out" };
      }

      // Prize distribution: 40%, 25%, 20%, 10%, 5%
      const prizeDistribution = [0.4, 0.25, 0.2, 0.1, 0.05];
      const payouts: Array<{ userId: string; amount: number; rank: number }> = [];

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const amount = Math.floor(WEEKLY_PRIZE_POOL * prizeDistribution[i]);

        if (!user.stripeConnectId) {
          console.log(`User ${user.id} has no Stripe Connect account, skipping payout`);
          continue;
        }

        try {
          // Create payout to connected account
          const payout = await stripe.payouts.create(
            {
              amount,
              currency: "usd",
              method: "instant",
              description: `ChalkPicks Weekly Prize - Rank #${i + 1}`,
            },
            {
              stripeAccount: user.stripeConnectId,
            }
          );

          // Record payout in database
          await db.insert(leaderboardPayouts).values({
            userId: user.id,
            rank: i + 1,
            amount,
            stripePayoutId: payout.id,
            status: payout.status as any,
            weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          });

          payouts.push({
            userId: user.id,
            amount,
            rank: i + 1,
          });

          console.log(`Payout of $${(amount / 100).toFixed(2)} sent to user ${user.id}`);
        } catch (error) {
          console.error(`Failed to send payout to user ${user.id}:`, error);
        }
      }

      return {
        success: true,
        payouts,
        totalDistributed: payouts.reduce((sum, p) => sum + p.amount, 0),
      };
    } catch (error) {
      console.error("Failed to distribute weekly prizes:", error);
      return { success: false, error: "Failed to distribute prizes" };
    }
  }),

  // Get user's payout history
  getPayoutHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const payouts = await db.query.leaderboardPayouts.findMany({
        where: eq(leaderboardPayouts.userId, ctx.user.id),
        orderBy: [desc(leaderboardPayouts.weekStartDate)],
        limit: 52, // Last year of payouts
      });

      return {
        success: true,
        payouts: payouts.map((p) => ({
          rank: p.rank,
          amount: p.amount,
          status: p.status,
          weekStartDate: p.weekStartDate,
          stripePayoutId: p.stripePayoutId,
        })),
        totalEarned: payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    } catch (error) {
      console.error("Failed to fetch payout history:", error);
      return { success: false, error: "Failed to fetch history" };
    }
  }),
});
