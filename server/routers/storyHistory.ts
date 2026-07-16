import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { storyExports } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const storyHistoryRouter = router({
  /**
   * Save a generated story to history
   * Called after story generation completes
   */
  saveStory: protectedProcedure
    .input(z.object({
      pickId: z.number().optional(),
      sport: z.string(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      recommendation: z.string(),
      odds: z.number().optional(),
      confidenceScore: z.number(),
      pickType: z.string(),
      aiAnalysis: z.string().optional(),
      result: z.string().optional(),
      s3Url: z.string().optional(),
      s3Key: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        const result = await db.insert(storyExports).values({
          userId: ctx.user.id,
          pickId: input.pickId ?? null,
          sport: input.sport,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          recommendation: input.recommendation,
          odds: input.odds ?? null,
          confidenceScore: input.confidenceScore,
          pickType: input.pickType,
          aiAnalysis: input.aiAnalysis ?? null,
          result: (input.result ?? "pending") as "win" | "loss" | "push" | "pending",
          s3Url: input.s3Url ?? null,
          s3Key: input.s3Key ?? null,
          postedToInstagram: false,
        });

        // Fetch the inserted row to get the ID
        const inserted = await db.select().from(storyExports).orderBy(desc(storyExports.createdAt)).limit(1);
        const id = inserted[0]?.id ?? 0;
        return { success: true, id };
      } catch (error) {
        console.error("[StoryHistory] Save failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save story" });
      }
    }),

  /**
   * Get all stories for the current user
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      sport: z.string().optional(),
      postedOnly: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) return { stories: [], total: 0 };

      try {
        const conditions = [eq(storyExports.userId, ctx.user.id)];
        if (input.sport) conditions.push(eq(storyExports.sport, input.sport));
        if (input.postedOnly) conditions.push(eq(storyExports.postedToInstagram, true));

        const [stories, countResult] = await Promise.all([
          db
            .select()
            .from(storyExports)
            .where(and(...conditions))
            .orderBy(desc(storyExports.generatedAt))
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ count: storyExports.id })
            .from(storyExports)
            .where(and(...conditions)),
        ]);

        return {
          stories,
          total: countResult.length,
        };
      } catch (error) {
        console.error("[StoryHistory] Fetch failed:", error);
        return { stories: [], total: 0 };
      }
    }),

  /**
   * Get a single story by ID
   */
  getStory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        const story = await db
          .select()
          .from(storyExports)
          .where(and(eq(storyExports.id, input.id), eq(storyExports.userId, ctx.user.id)))
          .limit(1);

        if (!story[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
        return story[0];
      } catch (error) {
        console.error("[StoryHistory] Get failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch story" });
      }
    }),

  /**
   * Delete a story from history
   */
  deleteStory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        // Verify ownership
        const story = await db
          .select()
          .from(storyExports)
          .where(and(eq(storyExports.id, input.id), eq(storyExports.userId, ctx.user.id)))
          .limit(1);

        if (!story[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });

        await db.delete(storyExports).where(eq(storyExports.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("[StoryHistory] Delete failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete story" });
      }
    }),

  /**
   * Mark a story as posted to Instagram
   */
  markAsPosted: protectedProcedure
    .input(z.object({
      id: z.number(),
      instagramPostId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        // Verify ownership
        const story = await db
          .select()
          .from(storyExports)
          .where(and(eq(storyExports.id, input.id), eq(storyExports.userId, ctx.user.id)))
          .limit(1);

        if (!story[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });

        await db
          .update(storyExports)
          .set({
            postedToInstagram: true,
            postedAt: new Date(),
            instagramPostId: input.instagramPostId ?? null,
          })
          .where(eq(storyExports.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[StoryHistory] Mark as posted failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update story" });
      }
    }),

  /**
   * Get statistics for the user's story exports
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const db = await getDb();
    if (!db) return { totalGenerated: 0, totalPosted: 0, byResult: {} };

    try {
      const stories = await db
        .select()
        .from(storyExports)
        .where(eq(storyExports.userId, ctx.user.id));

      const totalGenerated = stories.length;
      const totalPosted = stories.filter(s => s.postedToInstagram).length;

      const byResult: Record<string, number> = {
        win: 0,
        loss: 0,
        push: 0,
        pending: 0,
      };

      stories.forEach(s => {
        byResult[s.result] = (byResult[s.result] ?? 0) + 1;
      });

      return {
        totalGenerated,
        totalPosted,
        byResult,
        winRate: totalGenerated > 0 ? Math.round((byResult.win / totalGenerated) * 100) : 0,
      };
    } catch (error) {
      console.error("[StoryHistory] Stats failed:", error);
      return { totalGenerated: 0, totalPosted: 0, byResult: {} };
    }
  }),
});
