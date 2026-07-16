import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { apiKeys } from "../../drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `cp_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

export const apiKeysRouter = router({
  // List all active API keys for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        tier: apiKeys.tier,
        requestsToday: apiKeys.requestsToday,
        requestsTotal: apiKeys.requestsTotal,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, ctx.user.id), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt));
    return keys;
  }),

  // Generate a new API key
  generate: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(64).default("Default") }))
    .mutation(async ({ ctx, input }) => {
      // Limit: max 5 active keys per user
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), isNull(apiKeys.revokedAt)));
      if (existing.length >= 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum of 5 active API keys allowed. Revoke an existing key first.",
        });
      }

      const tier =
        ctx.user.subscriptionTier === "yearly" ? "enterprise" :
        ctx.user.subscriptionTier === "monthly" ? "pro" : "basic";

      const { raw, hash, prefix } = generateApiKey();
      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        keyHash: hash,
        keyPrefix: prefix,
        name: input.name,
        tier,
      });

      // Return the raw key ONCE — never stored in plaintext
      return { key: raw, prefix, tier };
    }),

  // Revoke an API key
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [key] = await db
        .select({ id: apiKeys.id, userId: apiKeys.userId })
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), isNull(apiKeys.revokedAt)));
      if (!key || key.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
      }
      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));
      return { success: true };
    }),

  // Validate an API key (used by external API consumers)
  validate: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, tier: null, requestsToday: 0 };
      const hash = createHash("sha256").update(input.key).digest("hex");
      const [key] = await db
        .select({
          id: apiKeys.id,
          userId: apiKeys.userId,
          tier: apiKeys.tier,
          requestsToday: apiKeys.requestsToday,
          requestsTotal: apiKeys.requestsTotal,
          revokedAt: apiKeys.revokedAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, hash));

      if (!key || key.revokedAt) {
        return { valid: false, tier: null, requestsToday: 0 };
      }

      // Rate limits by tier
      const limits: Record<string, number> = { basic: 100, pro: 1000, enterprise: 10000 };
      const limit = limits[key.tier] ?? 100;
      if (key.requestsToday >= limit) {
        return { valid: false, tier: key.tier, requestsToday: key.requestsToday, rateLimited: true };
      }

      // Increment usage
      await db
        .update(apiKeys)
        .set({
          requestsToday: key.requestsToday + 1,
          requestsTotal: key.requestsTotal + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(apiKeys.id, key.id));

      return { valid: true, tier: key.tier, requestsToday: key.requestsToday + 1 };
    }),
});
