import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storyScheduled } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const storyScheduledRouter = router({
  scheduleStory: protectedProcedure
    .input(
      z.object({
        sport: z.string(),
        homeTeam: z.string(),
        awayTeam: z.string(),
        recommendation: z.string(),
        confidenceScore: z.number().min(0).max(100),
        pickType: z.string(),
        aiAnalysis: z.string().optional(),
        templateId: z.string().default("default"),
        scheduledTime: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const result = await database.insert(storyScheduled).values({
          userId: ctx.user.id,
          sport: input.sport,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          recommendation: input.recommendation,
          confidenceScore: input.confidenceScore,
          pickType: input.pickType,
          aiAnalysis: input.aiAnalysis,
          templateId: input.templateId,
          scheduledTime: new Date(input.scheduledTime),
          status: "pending",
        });

        return {
          success: true,
          id: (result as any)[0]?.insertId ?? 0,
          scheduledTime: input.scheduledTime,
        };
      } catch (error) {
        console.error("[StoryScheduled] Schedule failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule story",
        });
      }
    }),

  getScheduled: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        status: z.enum(["pending", "posted", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const conditions = [eq(storyScheduled.userId, ctx.user.id)];
        if (input.status) {
          conditions.push(eq(storyScheduled.status, input.status));
        }

        const stories = await database
          .select()
          .from(storyScheduled)
          .where(and(...conditions))
          .orderBy(desc(storyScheduled.scheduledTime))
          .limit(input.limit)
          .offset(input.offset);

        const total = await database
          .select()
          .from(storyScheduled)
          .where(and(...conditions));

        return {
          stories,
          total: total.length,
        };
      } catch (error) {
        console.error("[StoryScheduled] Get failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scheduled stories",
        });
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "posted", "failed", "cancelled"]),
        failureReason: z.string().optional(),
        instagramPostId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const story = await database
          .select()
          .from(storyScheduled)
          .where(eq(storyScheduled.id, input.id))
          .limit(1);

        if (!story || story.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
        }

        if (story[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await database
          .update(storyScheduled)
          .set({
            status: input.status,
            failureReason: input.failureReason,
            instagramPostId: input.instagramPostId,
            postedAt: input.status === "posted" ? new Date() : undefined,
          })
          .where(eq(storyScheduled.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[StoryScheduled] Update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update story status",
        });
      }
    }),

  cancelScheduled: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const story = await database
          .select()
          .from(storyScheduled)
          .where(eq(storyScheduled.id, input.id))
          .limit(1);

        if (!story || story.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (story[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await database
          .update(storyScheduled)
          .set({ status: "cancelled" })
          .where(eq(storyScheduled.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[StoryScheduled] Cancel failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel scheduled story",
        });
      }
    }),

  getUpcoming: protectedProcedure
    .input(z.object({ hoursAhead: z.number().default(24) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const now = new Date();
        const futureTime = new Date(now.getTime() + input.hoursAhead * 60 * 60 * 1000);

        const upcoming = await database
          .select()
          .from(storyScheduled)
          .where(
            and(
              eq(storyScheduled.userId, ctx.user.id),
              eq(storyScheduled.status, "pending"),
              gte(storyScheduled.scheduledTime, now),
              lte(storyScheduled.scheduledTime, futureTime)
            )
          )
          .orderBy(desc(storyScheduled.scheduledTime));

        return { upcoming };
      } catch (error) {
        console.error("[StoryScheduled] Get upcoming failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch upcoming stories",
        });
      }
    }),
});
