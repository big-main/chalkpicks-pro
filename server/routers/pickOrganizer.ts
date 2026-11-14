import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pickOrganizerPlans, picks, type User } from "../../drizzle/schema";
import {
  organizerPlanSchema,
  type OrganizerPlanInput,
} from "../../shared/pickOrganizer";

async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Organizer database unavailable",
    });
  return db;
}
export async function validateSourcePicks(
  input: OrganizerPlanInput,
  user: User
) {
  const ids = input.legs.flatMap(leg => (leg.pickId ? [leg.pickId] : []));
  if (!ids.length) return input;
  const db = await database();
  const rows = await db
    .select({
      id: picks.id,
      tier: picks.tier,
      result: picks.result,
      isActive: picks.isActive,
      recommendation: picks.recommendation,
      odds: picks.odds,
    })
    .from(picks)
    .where(inArray(picks.id, ids))
    .limit(12);
  const premium =
    user.role === "admin" ||
    (["daily", "monthly", "yearly"].includes(user.subscriptionTier) &&
      (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date()));
  for (const id of ids) {
    const source = rows.find(row => row.id === id);
    if (
      !source ||
      (input.status !== "archived" &&
        (!source.isActive || source.result !== "pending"))
    )
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Only active pending picks can be added. Remove settled or unavailable selections.",
      });
    if (source.tier === "premium" && !premium)
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "An active subscription is required to organize premium picks.",
      });
  }
  // Linked selections are copied from their real source, never from client-supplied analysis.
  return {
    ...input,
    legs: input.legs.map(leg => {
      const source = rows.find(row => row.id === leg.pickId);
      return source
        ? {
            pickId: source.id,
            description: source.recommendation,
            odds: source.odds,
          }
        : leg;
    }),
  };
}
export const pickOrganizerRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          offset: z.number().int().min(0).max(10000).default(0),
          userId: z.number().int().positive().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await database();
      if (input?.userId && input.userId !== ctx.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot view another account",
        });
      const records = await db
        .select()
        .from(pickOrganizerPlans)
        .where(eq(pickOrganizerPlans.userId, ctx.user.id))
        .orderBy(desc(pickOrganizerPlans.updatedAt))
        .limit(150)
        .offset(input?.offset ?? 0);
      return {
        records: records.map(row => ({
          ...row,
          eventAt: row.eventAt?.getTime() ?? null,
          stake: Number(row.stake),
        })),
        hasMore: records.length === 150,
      };
    }),
  save: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        plan: organizerPlanSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      if (input.id) {
        const [existing] = await db
          .select({ id: pickOrganizerPlans.id })
          .from(pickOrganizerPlans)
          .where(
            and(
              eq(pickOrganizerPlans.id, input.id),
              eq(pickOrganizerPlans.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (!existing)
          throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      } else {
        const [count] = await db
          .select({ total: sql<number>`count(*)` })
          .from(pickOrganizerPlans)
          .where(eq(pickOrganizerPlans.userId, ctx.user.id))
          .limit(1);
        if (Number(count?.total) >= 1000)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Plan limit reached. Remove old drafts first.",
          });
      }
      const plan = await validateSourcePicks(input.plan, ctx.user);
      const values = {
        ...plan,
        userId: ctx.user.id,
        stake: plan.stake.toFixed(2),
        eventAt: plan.eventAt === null ? null : new Date(plan.eventAt),
        updatedAt: new Date(),
      };
      if (input.id)
        await db
          .update(pickOrganizerPlans)
          .set(values)
          .where(
            and(
              eq(pickOrganizerPlans.id, input.id),
              eq(pickOrganizerPlans.userId, ctx.user.id)
            )
          );
      else await db.insert(pickOrganizerPlans).values(values);
      return { success: true };
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const condition = and(
        eq(pickOrganizerPlans.id, input.id),
        eq(pickOrganizerPlans.userId, ctx.user.id)
      );
      const [record] = await db
        .select({ id: pickOrganizerPlans.id })
        .from(pickOrganizerPlans)
        .where(condition)
        .limit(1);
      if (!record)
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      await db.delete(pickOrganizerPlans).where(condition);
      return { success: true };
    }),
});
