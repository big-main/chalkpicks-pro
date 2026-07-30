/**
 * Directory Submissions Tracker Router
 * Admin-only CRUD for managing directory/backlink submissions.
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { directorySubmissions } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const directoryTrackerRouter = router({
  /** List all directory submissions with optional tier filter */
  list: adminProcedure
    .input(
      z
        .object({
          tier: z
            .enum([
              "tier1",
              "tier2",
              "tier3",
              "tier4",
              "reddit",
              "guest_post",
              "all",
            ])
            .optional()
            .default("all"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const rows = await db
        .select()
        .from(directorySubmissions)
        .orderBy(desc(directorySubmissions.id));

      const tier = input?.tier;
      if (tier && tier !== "all") {
        return rows.filter(r => r.tier === tier);
      }
      return rows;
    }),

  /** Get aggregate stats */
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const rows = await db
      .select({
        status: directorySubmissions.status,
        count: sql<number>`count(*)`,
      })
      .from(directorySubmissions)
      .groupBy(directorySubmissions.status);

    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = Number(r.count);

    return { total, byStatus };
  }),

  /** Update status of a submission */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "not_started",
          "in_progress",
          "submitted",
          "verified",
          "rejected",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const updates: Record<string, unknown> = { status: input.status };
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.status === "submitted") updates.submittedAt = new Date();
      if (input.status === "verified") updates.verifiedAt = new Date();

      await db
        .update(directorySubmissions)
        .set(updates)
        .where(eq(directorySubmissions.id, input.id));

      return { success: true };
    }),

  /** Add a new directory submission */
  add: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().min(1),
        tier: z.enum([
          "tier1",
          "tier2",
          "tier3",
          "tier4",
          "reddit",
          "guest_post",
        ]),
        domainAuthority: z.number().nullable().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db.insert(directorySubmissions).values({
        name: input.name,
        url: input.url,
        tier: input.tier,
        domainAuthority: input.domainAuthority ?? null,
        notes: input.notes ?? null,
      });

      return { success: true };
    }),

  /** Delete a submission */
  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .delete(directorySubmissions)
        .where(eq(directorySubmissions.id, input.id));
      return { success: true };
    }),
});
