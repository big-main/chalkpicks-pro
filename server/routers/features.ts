import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Feature access tiers:
 * - free: Basic access (Picks, Home)
 * - daily: Daily Pass ($9.99) - 24 hour access
 * - monthly: Monthly Pro ($29.99) - Full access
 * - yearly: Annual Elite ($199.99) - Full access + VIP features
 */

const FEATURE_TIERS = {
  // Free features
  picks: ["free", "daily", "monthly", "yearly"],
  home: ["free", "daily", "monthly", "yearly"],
  signup: ["free", "daily", "monthly", "yearly"],
  login: ["free", "daily", "monthly", "yearly"],
  
  // Daily Pass features ($9.99)
  liveStats: ["daily", "monthly", "yearly"],
  leaderboard: ["daily", "monthly", "yearly"],
  
  // Monthly Pro features ($29.99)
  evFinder: ["monthly", "yearly"],
  tools: ["monthly", "yearly"],
  backtesting: ["monthly", "yearly"],
  kalshi: ["monthly", "yearly"],
  clvTracker: ["monthly", "yearly"],
  arbitrage: ["monthly", "yearly"],
  parlay_builder: ["monthly", "yearly"],
  bankroll_tracker: ["monthly", "yearly"],
  
  // Annual Elite features ($199.99)
  vipDiscord: ["yearly"],
  strategySessions: ["yearly"],
} as const;

type FeatureName = keyof typeof FEATURE_TIERS;

/**
 * Check if user has access to a feature based on subscription tier
 */
export const featureRouter = router({
  // Check access to a specific feature
  canAccess: protectedProcedure
    .input(z.object({
      feature: z.enum(Object.keys(FEATURE_TIERS) as [FeatureName, ...FeatureName[]]),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return {
          hasAccess: false,
          tier: "free",
          requiredTier: FEATURE_TIERS[input.feature][0],
          message: "Database unavailable",
        };
      }

      const user = await db.select({
        subscriptionTier: users.subscriptionTier,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

      const u = user[0];
      if (!u) {
        return {
          hasAccess: false,
          tier: "free",
          requiredTier: FEATURE_TIERS[input.feature][0],
          message: "User not found",
        };
      }

      // Check if subscription is active
      const isSubscriptionActive = u.subscriptionTier !== "free" && (
        !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
      );

      const currentTier = isSubscriptionActive ? u.subscriptionTier : "free";
      const allowedTiers = FEATURE_TIERS[input.feature];
      const hasAccess = allowedTiers.includes(currentTier as any);

      return {
        hasAccess,
        tier: currentTier,
        requiredTier: allowedTiers[0],
        message: hasAccess
          ? "Access granted"
          : `This feature requires ${allowedTiers.join(" or ")} subscription`,
      };
    }),

  // Get feature access summary for current user
  getAccessSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        tier: "free",
        isActive: false,
        features: {
          picks: true,
          home: true,
          signup: true,
          login: true,
          liveStats: false,
          leaderboard: false,
          evFinder: false,
          tools: false,
          backtesting: false,
          kalshi: false,
          clvTracker: false,
          vipDiscord: false,
          strategySessions: false,
        },
      };
    }

    const user = await db.select({
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (!u) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const isActive = u.subscriptionTier !== "free" && (
      !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
    );

    const currentTier = isActive ? u.subscriptionTier : "free";

    // Build feature access map
    const features: Record<FeatureName, boolean> = {} as any;
    for (const [feature, tiers] of Object.entries(FEATURE_TIERS)) {
      features[feature as FeatureName] = [...(tiers as readonly string[])].includes(currentTier);
    }

    return {
      tier: currentTier,
      isActive,
      features,
    };
  }),

  // Get upgrade info for a locked feature
  getUpgradeInfo: protectedProcedure
    .input(z.object({
      feature: z.enum(Object.keys(FEATURE_TIERS) as [FeatureName, ...FeatureName[]]),
    }))
    .query(({ input }) => {
      const allowedTiers = FEATURE_TIERS[input.feature];
      const requiredTier = allowedTiers[0];

      const tierInfo: Record<string, any> = {
        daily: {
          name: "Daily Pass",
          price: "$9.99",
          duration: "24 hours",
          features: ["All premium picks today", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"],
        },
        monthly: {
          name: "Monthly Pro",
          price: "$29.99",
          duration: "1 month",
          features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support"],
        },
        yearly: {
          name: "Annual Elite",
          price: "$199.99",
          duration: "1 year",
          features: ["Everything in Monthly", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"],
        },
      };

      return {
        feature: input.feature,
        requiredTier,
        tierInfo: tierInfo[requiredTier],
        message: `Upgrade to ${tierInfo[requiredTier].name} to access ${input.feature}`,
      };
    }),
});
