import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referralCodes, referrals, referralRewards, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const referralRouter = router({
  /**
   * Generate a referral code for the current user
   */
  generateCode: protectedProcedure
    .input(
      z.object({
        discountPercentage: z.number().min(1).max(100).optional().default(10),
        maxRedemptions: z.number().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      // Generate unique code
      const code = `REF${userId}${Date.now().toString(36).toUpperCase()}`.substring(0, 32);

      const result = await database.insert(referralCodes).values({
        userId,
        code,
        discountPercentage: input.discountPercentage,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt,
      });

      return { code, id: result[0] };
    }),

  /**
   * Get all referral codes for the current user
   */
  getMyCodes: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const codes = await database
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId));

    return codes;
  }),

  /**
   * Get referral statistics for the current user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return null;

    const database = await getDb();
    if (!database) return null;

    const myReferrals = await database
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const rewards = await database
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId));

    const totalReferrals = myReferrals.length;
    const activeReferrals = myReferrals.filter((r: any) => r.status === "active").length;
    const totalCommission = rewards.reduce((sum: number, r: any) => sum + parseFloat(r.rewardAmount?.toString() || "0"), 0);
    const earnedCommission = rewards
      .filter((r: any) => r.status === "earned")
      .reduce((sum: number, r: any) => sum + parseFloat(r.rewardAmount?.toString() || "0"), 0);

    return {
      totalReferrals,
      activeReferrals,
      totalCommission,
      earnedCommission,
      pendingCommission: totalCommission - earnedCommission,
    };
  }),

  /**
   * Get all referrals for the current user
   */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const myReferrals = await database
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    // Get referred user details
    const referralDetails = await Promise.all(
      myReferrals.map(async (ref: any) => {
        const referredUser = await database
          .select()
          .from(users)
          .where(eq(users.id, ref.referredUserId))
          .limit(1);

        return {
          ...ref,
          referredUser: referredUser[0] || null,
        };
      })
    );

    return referralDetails;
  }),

  /**
   * Get rewards for the current user
   */
  getMyRewards: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const rewards = await database
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId));

    return rewards;
  }),

  /**
   * Claim a reward
   */
  claimReward: protectedProcedure
    .input(z.object({ rewardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      const reward = await database
        .select()
        .from(referralRewards)
        .where(and(eq(referralRewards.id, input.rewardId), eq(referralRewards.referrerId, userId)))
        .limit(1);

      if (!reward || reward.length === 0) throw new Error("Reward not found");
      if (reward[0].status === "claimed") throw new Error("Reward already claimed");

      await database
        .update(referralRewards)
        .set({ status: "claimed", claimedAt: new Date() })
        .where(eq(referralRewards.id, input.rewardId));

      return { success: true };
    }),

  /**
   * Get referral code details
   */
  getCodeDetails: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return null;

      const codeData = await database
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code))
        .limit(1);

      if (!codeData || codeData.length === 0) return null;

      const code = codeData[0];
      const codeOwner = await database
        .select()
        .from(users)
        .where(eq(users.id, code.userId))
        .limit(1);

      return {
        ...code,
        owner: codeOwner[0] || null,
        canRedeem: code.isActive && (!code.expiresAt || code.expiresAt > new Date()) && (!code.maxRedemptions || code.currentRedemptions < code.maxRedemptions),
      };
    }),
});
