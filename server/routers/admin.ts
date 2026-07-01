/**
 * Admin Router — Application Review, User Management, System Controls
 * 
 * Handles the Edge Terminal application review workflow:
 * - List pending applications
 * - Approve/reject applications with 24-hour response target
 * - Manage user tiers and access levels
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { resolveGameResults, syncGameScores } from "../services/gameResultsResolver";

export const adminRouter = router({
  /**
   * Get all pending applications for review
   */
  getPendingApplications: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const pending = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      experienceLevel: users.experienceLevel,
      bettingFrequency: users.bettingFrequency,
      weeklyBetSize: users.weeklyBetSize,
      onboardingIntent: users.onboardingIntent,
      accessTier: users.accessTier,
      applicationStatus: users.applicationStatus,
      createdAt: users.createdAt,
    }).from(users)
      .where(eq(users.applicationStatus, "pending"))
      .orderBy(desc(users.createdAt));

    return pending;
  }),

  /**
   * Get all applications (any status) for admin dashboard
   */
  getAllApplications: adminProcedure
    .input(z.object({
      status: z.enum(["all", "pending", "approved", "rejected", "not_applied"]).optional().default("all"),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq(users.applicationStatus, input.status));
      }

      const apps = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        experienceLevel: users.experienceLevel,
        bettingFrequency: users.bettingFrequency,
        weeklyBetSize: users.weeklyBetSize,
        onboardingIntent: users.onboardingIntent,
        accessTier: users.accessTier,
        applicationStatus: users.applicationStatus,
        applicationReviewedAt: users.applicationReviewedAt,
        createdAt: users.createdAt,
        subscriptionTier: users.subscriptionTier,
      }).from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit);

      return apps;
    }),

  /**
   * Approve an application — grants access tier and updates status
   */
  approveApplication: adminProcedure
    .input(z.object({
      userId: z.number(),
      accessTier: z.enum(["recreational", "serious", "professional"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const tier = input.accessTier || user.accessTier || "recreational";

      await db.update(users).set({
        applicationStatus: "approved",
        accessTier: tier,
        applicationReviewedAt: new Date(),
        applicationReviewedBy: ctx.user.id as number,
      }).where(eq(users.id, input.userId));

      return { success: true, userId: input.userId, accessTier: tier };
    }),

  /**
   * Reject an application
   */
  rejectApplication: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(users).set({
        applicationStatus: "rejected",
        applicationReviewedAt: new Date(),
        applicationReviewedBy: ctx.user.id as number,
      }).where(eq(users.id, input.userId));

      return { success: true, userId: input.userId };
    }),

  /**
   * Get application stats for admin dashboard
   */
  getApplicationStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0, avgResponseHours: 0 };

    const stats = await db.select({
      status: users.applicationStatus,
      count: sql<number>`count(*)`,
    }).from(users)
      .where(sql`${users.applicationStatus} != 'not_applied'`)
      .groupBy(users.applicationStatus);

    const result = { total: 0, pending: 0, approved: 0, rejected: 0, avgResponseHours: 24 };
    for (const s of stats) {
      const count = Number(s.count);
      result.total += count;
      if (s.status === "pending") result.pending = count;
      else if (s.status === "approved") result.approved = count;
      else if (s.status === "rejected") result.rejected = count;
    }

    return result;
  }),

  /**
   * Manually trigger game results resolution
   */
  resolveResults: adminProcedure.mutation(async () => {
    const results = await resolveGameResults();
    return results;
  }),

  /**
   * Manually trigger game score sync
   */
  syncScores: adminProcedure.mutation(async () => {
    const synced = await syncGameScores();
    return { synced };
  }),

  /**
   * Get all users with their tiers for management
   */
  getUsers: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const userList = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        accessTier: users.accessTier,
        applicationStatus: users.applicationStatus,
        totalBets: users.totalBets,
        winningBets: users.winningBets,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users)
        .orderBy(desc(users.lastSignedIn))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(users);

      return { users: userList, total: Number(countResult?.count || 0) };
    }),

  /**
   * Update user tier/role
   */
  updateUserTier: adminProcedure
    .input(z.object({
      userId: z.number(),
      subscriptionTier: z.enum(["free", "trial", "daily", "monthly", "yearly"]).optional(),
      accessTier: z.enum(["free", "recreational", "serious", "professional"]).optional(),
      role: z.enum(["user", "admin"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updates: Record<string, any> = {};
      if (input.subscriptionTier) updates.subscriptionTier = input.subscriptionTier;
      if (input.accessTier) updates.accessTier = input.accessTier;
      if (input.role) updates.role = input.role;

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No updates provided" });
      }

      await db.update(users).set(updates).where(eq(users.id, input.userId));
      return { success: true };
    }),
});
