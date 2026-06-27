import { ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { Paywall } from "./Paywall";
import { Spinner } from "./ui/spinner";

interface FeatureGateProps {
  feature: "kalshi" | "clvTracker" | "evFinder" | "tools" | "backtesting" | "liveStats" | "leaderboard" | "arbitrage" | "parlay_builder" | "bankroll_tracker";
  children: ReactNode;
  fallback?: ReactNode;
  requiredTier?: "daily" | "monthly" | "yearly";
}

const FEATURE_TIER_MAP: Record<string, "daily" | "monthly" | "yearly"> = {
  kalshi: "monthly",
  clvTracker: "monthly",
  evFinder: "monthly",
  tools: "monthly",
  backtesting: "monthly",
  liveStats: "daily",
  leaderboard: "daily",
  arbitrage: "monthly",
  parlay_builder: "monthly",
  bankroll_tracker: "monthly",
};

export function FeatureGate({
  feature,
  children,
  fallback,
  requiredTier,
}: FeatureGateProps) {
  const tier = requiredTier || FEATURE_TIER_MAP[feature] || "monthly";
  
  // Query access status
  const { data: accessData, isLoading } = trpc.features.canAccess.useQuery(
    { feature: feature as any },
    { retry: 1 }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // No access - show paywall
  if (accessData && !accessData.hasAccess) {
    return (
      fallback || (
        <Paywall
          tier={tier}
          title={feature.charAt(0).toUpperCase() + feature.slice(1)}
          description={`This premium feature requires a ${tier === "daily" ? "Daily Pass" : tier === "monthly" ? "Monthly Pro" : "Annual Elite"} subscription.`}
        />
      )
    );
  }

  // Has access - render children
  return <>{children}</>;
}
