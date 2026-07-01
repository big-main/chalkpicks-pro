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

/**
 * Access tier restrictions (Edge Terminal):
 * - free: Basic picks only
 * - recreational: Standard tools + daily picks
 * - serious: All tools + advanced analytics
 * - professional: Everything + priority support + custom AI
 */
const ACCESS_TIER_FEATURES = {
  free: ["picks", "home", "signup", "login"],
  recreational: ["picks", "home", "signup", "login", "liveStats", "leaderboard"],
  serious: ["picks", "home", "signup", "login", "liveStats", "leaderboard", "evFinder", "tools", "backtesting", "kalshi", "clvTracker", "arbitrage", "parlay_builder", "bankroll_tracker"],
  professional: ["picks", "home", "signup", "login", "liveStats", "leaderboard", "evFinder", "tools", "backtesting", "kalshi", "clvTracker", "arbitrage", "parlay_builder", "bankroll_tracker", "vipDiscord", "strategySessions"],
} as const;

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
 * Unified access check logic used by all procedures
 */
function checkFeatureAccess(
  subscriptionTier: string,
  subscriptionExpiresAt: Date | null,
  accessTier: string | null,
  applicationStatus: string | null,
  feature: FeatureName
): { hasAccess: boolean; currentTier: string; isActive: boolean; reason?: string } {
  // Check if subscription is active
  const isActive = subscriptionTier !== "free" && (
    !subscriptionExpiresAt || subscriptionExpiresAt > new Date()
  );
  const currentTier = isActive ? subscriptionTier : "free";

  // Check subscription-based access
  const allowedTiers = FEATURE_TIERS[feature];
  const hasSubscriptionAccess = (allowedTiers as readonly string[]).includes(currentTier);

  // Check Edge Terminal access tier (only for approved users)
  const userAccessTier = (accessTier || "free") as keyof typeof ACCESS_TIER_FEATURES;
  const accessTierFeatures = ACCESS_TIER_FEATURES[userAccessTier] || ACCESS_TIER_FEATURES.free;
  const hasAccessTierAccess = (accessTierFeatures as readonly string[]).includes(feature);

  // Access logic:
  // 1. Must have subscription-level access (payment gate)
  // 2. If user has applied and been approved, their accessTier determines additional feature gates
  // 3. Users who haven't applied yet get access based on subscription only (no Edge Terminal restriction)
  const isApproved = applicationStatus === "approved";
  const hasApplied = applicationStatus === "pending" || applicationStatus === "approved" || applicationStatus === "rejected";

  let hasAccess: boolean;
  let reason: string | undefined;

  if (!hasSubscriptionAccess) {
    hasAccess = false;
    reason = `Requires ${allowedTiers[0]} subscription or higher`;
  } else if (hasApplied && !isApproved) {
    // Applied but not yet approved — restrict to free-tier features only
    const freeFeatures = ACCESS_TIER_FEATURES.free;
    hasAccess = (freeFeatures as readonly string[]).includes(feature);
    if (!hasAccess) reason = "Application pending review";
  } else if (isApproved && !hasAccessTierAccess) {
    // Approved but access tier doesn't include this feature
    hasAccess = false;
    reason = `Requires ${getRequiredAccessTier(feature)} access tier or higher`;
  } else {
    hasAccess = true;
  }

  return { hasAccess, currentTier, isActive, reason };
}

/**
 * Get the minimum access tier required for a feature
 */
function getRequiredAccessTier(feature: string): string {
  for (const [tier, features] of Object.entries(ACCESS_TIER_FEATURES)) {
    if ((features as readonly string[]).includes(feature)) return tier;
  }
  return "professional";
}

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
        accessTier: users.accessTier,
        applicationStatus: users.applicationStatus,
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

      const result = checkFeatureAccess(
        u.subscriptionTier,
        u.subscriptionExpiresAt,
        u.accessTier,
        u.applicationStatus,
        input.feature
      );

      return {
        hasAccess: result.hasAccess,
        tier: result.currentTier,
        requiredTier: FEATURE_TIERS[input.feature][0],
        message: result.hasAccess
          ? "Access granted"
          : result.reason || `This feature requires ${FEATURE_TIERS[input.feature].join(" or ")} subscription`,
      };
    }),

  // Get feature access summary for current user
  getAccessSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        tier: "free",
        accessTier: "free",
        isActive: false,
        features: Object.fromEntries(
          Object.keys(FEATURE_TIERS).map(f => [f, ["free", "daily", "monthly", "yearly"].includes("free") && (FEATURE_TIERS[f as FeatureName] as readonly string[]).includes("free")])
        ),
      };
    }

    const user = await db.select({
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      accessTier: users.accessTier,
      applicationStatus: users.applicationStatus,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (!u) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Build feature access map using unified logic
    const features: Record<string, boolean> = {};
    for (const feature of Object.keys(FEATURE_TIERS) as FeatureName[]) {
      const result = checkFeatureAccess(
        u.subscriptionTier,
        u.subscriptionExpiresAt,
        u.accessTier,
        u.applicationStatus,
        feature
      );
      features[feature] = result.hasAccess;
    }

    const isActive = u.subscriptionTier !== "free" && (
      !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
    );

    return {
      tier: isActive ? u.subscriptionTier : "free",
      accessTier: u.accessTier || "free",
      applicationStatus: u.applicationStatus || "not_applied",
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
      const requiredAccessTier = getRequiredAccessTier(input.feature);

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
        requiredAccessTier,
        tierInfo: tierInfo[requiredTier],
        message: `Upgrade to ${tierInfo[requiredTier]?.name || requiredTier} to access ${input.feature}`,
      };
    }),
});
