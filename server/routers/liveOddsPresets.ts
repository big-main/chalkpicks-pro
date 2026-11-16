import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { liveOddsPresets } from "../../drizzle/schema";

const configSchema = z.object({
  selectedSport: z.string().max(32),
  search: z.string().max(120),
  selectedBook: z.string().max(80),
  selectedMarket: z.string().max(80),
  movementOnly: z.boolean(),
  sort: z.enum([
    "latest",
    "odds_desc",
    "odds_asc",
    "line_desc",
    "line_asc",
    "team",
  ]),
});

async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Preset database unavailable",
    });
  return db;
}

export const liveOddsPresetsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await database();
    const records = await db
      .select()
      .from(liveOddsPresets)
      .where(eq(liveOddsPresets.userId, ctx.user.id))
      .orderBy(desc(liveOddsPresets.updatedAt))
      .limit(50);
    return records.map(record => ({
      id: record.id,
      name: record.name,
      config: record.config,
      updatedAt: record.updatedAt,
    }));
  }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        name: z.string().trim().min(1).max(80),
        config: configSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      if (input.id) {
        const [existing] = await db
          .select({ id: liveOddsPresets.id })
          .from(liveOddsPresets)
          .where(
            and(
              eq(liveOddsPresets.id, input.id),
              eq(liveOddsPresets.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (!existing)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Preset not found",
          });
        await db
          .update(liveOddsPresets)
          .set({
            name: input.name,
            config: input.config,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(liveOddsPresets.id, input.id),
              eq(liveOddsPresets.userId, ctx.user.id)
            )
          );
        return { id: input.id };
      }

      const [count] = await db
        .select({ total: sql<number>`count(*)` })
        .from(liveOddsPresets)
        .where(eq(liveOddsPresets.userId, ctx.user.id))
        .limit(1);
      if (Number(count?.total ?? 0) >= 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Preset limit reached. Delete an old preset first.",
        });
      }
      const result = await db.insert(liveOddsPresets).values({
        userId: ctx.user.id,
        name: input.name,
        config: input.config,
      });
      return { id: Number(result[0].insertId) };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      await db
        .delete(liveOddsPresets)
        .where(
          and(
            eq(liveOddsPresets.id, input.id),
            eq(liveOddsPresets.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
