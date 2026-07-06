import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users, userBets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const draftKingsRouter = router({
  // Generate OAuth authorization URL
  getAuthUrl: publicProcedure.query(async () => {
    const clientId = process.env.DRAFTKINGS_CLIENT_ID || "demo_client";
    const redirectUri = `${process.env.VITE_FRONTEND_URL || "https://chalkpicks.live"}/api/oauth/draftkings/callback`;
    const scope = "account:read bets:read";
    
    const authUrl = `https://oauth.draftkings.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    return { authUrl };
  }),

  // Handle OAuth callback and store access token
  handleCallback: protectedProcedure
    .input(z.object({ code: z.string(), state: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for access token (mock for now)
        const accessToken = `dk_token_${ctx.user.id}_${Date.now()}`;
        
        // Store token in database
        await db
          .update(users)
          .set({ draftKingsToken: accessToken })
          .where(eq(users.id, ctx.user.id));

        return { success: true, message: "DraftKings account linked" };
      } catch (error) {
        console.error("DraftKings OAuth error:", error);
        return { success: false, error: "Failed to link account" };
      }
    }),

  // Fetch user's bets from DraftKings
  fetchBets: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user?.draftKingsToken) {
        return { success: false, error: "DraftKings account not linked" };
      }

      // Mock DraftKings API call - fetch user's recent bets
      const mockBets = [
        {
          id: "bet_1",
          sport: "NFL",
          pick: "Chiefs -3",
          odds: -110,
          stake: 100,
          potentialWin: 190.91,
          status: "pending",
          createdAt: new Date(),
        },
        {
          id: "bet_2",
          sport: "NBA",
          pick: "Lakers +5",
          odds: -110,
          stake: 50,
          potentialWin: 95.45,
          status: "won",
          createdAt: new Date(Date.now() - 86400000),
        },
      ];

      // Store bets in database for tracking
      for (const bet of mockBets) {
        await db.insert(userBets).values({
          userId: ctx.user.id,
          sport: bet.sport,
          pick: bet.pick,
          odds: bet.odds,
          stake: bet.stake,
          potentialWin: bet.potentialWin,
          status: bet.status as any,
          createdAt: bet.createdAt,
        }).onConflictDoNothing();
      }

      return { success: true, bets: mockBets };
    } catch (error) {
      console.error("Failed to fetch DraftKings bets:", error);
      return { success: false, error: "Failed to fetch bets" };
    }
  }),

  // Get user's P&L from tracked bets
  getPnL: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userBetsList = await db.query.userBets.findMany({
        where: eq(userBets.userId, ctx.user.id),
      });

      let totalStaked = 0;
      let totalWon = 0;
      let totalLost = 0;
      let winCount = 0;
      let lossCount = 0;

      for (const bet of userBetsList) {
        totalStaked += bet.stake || 0;
        if (bet.status === "won") {
          totalWon += (bet.potentialWin || 0);
          winCount++;
        } else if (bet.status === "lost") {
          totalLost += (bet.stake || 0);
          lossCount++;
        }
      }

      const profit = totalWon - totalStaked;
      const winRate = userBetsList.length > 0 ? (winCount / userBetsList.length) * 100 : 0;

      return {
        success: true,
        stats: {
          totalBets: userBetsList.length,
          totalStaked,
          totalWon,
          totalLost,
          profit,
          winRate: winRate.toFixed(1),
          winCount,
          lossCount,
        },
      };
    } catch (error) {
      console.error("Failed to calculate P&L:", error);
      return { success: false, error: "Failed to calculate P&L" };
    }
  }),

  // Disconnect DraftKings account
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db
        .update(users)
        .set({ draftKingsToken: null })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "DraftKings account disconnected" };
    } catch (error) {
      console.error("Failed to disconnect DraftKings:", error);
      return { success: false, error: "Failed to disconnect" };
    }
  }),
});
