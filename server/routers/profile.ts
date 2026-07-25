import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, picks, userBets } from "../../drizzle/schema";
import { eq, count, and, sql } from "drizzle-orm";

export const profileRouter = router({
  // Get current user's full profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!result.length) throw new Error("User not found");
    const u = result[0];
    // Compute stats
    const betStats = await db
      .select({
        total: count(),
        wins: sql<number>`SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)`,
        losses: sql<number>`SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END)`,
        profit: sql<string>`COALESCE(SUM(profit), 0)`,
      })
      .from(userBets)
      .where(eq(userBets.userId, ctx.user.id));
    const stats = betStats[0] ?? { total: 0, wins: 0, losses: 0, profit: "0" };
    const winRate = stats.total > 0 ? Math.round((Number(stats.wins) / Number(stats.total)) * 100) : 0;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      displayName: u.displayName,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      favoriteSports: u.favoriteSports ? JSON.parse(u.favoriteSports) as string[] : [],
      profileTheme: u.profileTheme ?? "dark",
      isPublicProfile: u.isPublicProfile,
      subscriptionTier: u.subscriptionTier,
      accessTier: u.accessTier,
      role: u.role,
      createdAt: u.createdAt,
      totalBets: Number(stats.total),
      wins: Number(stats.wins),
      losses: Number(stats.losses),
      winRate,
      totalProfit: Number(stats.profit),
      accountBalance: Number(u.accountBalance),
    };
  }),

  // Update profile fields
  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(128).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional().or(z.literal("")),
      favoriteSports: z.array(z.string()).max(8).optional(),
      profileTheme: z.enum(["dark", "neon", "stealth", "fire"]).optional(),
      isPublicProfile: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const updateData: Record<string, unknown> = {};
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl || null;
      if (input.favoriteSports !== undefined) updateData.favoriteSports = JSON.stringify(input.favoriteSports);
      if (input.profileTheme !== undefined) updateData.profileTheme = input.profileTheme;
      if (input.isPublicProfile !== undefined) updateData.isPublicProfile = input.isPublicProfile;
      if (Object.keys(updateData).length === 0) return { success: true };
      await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
