import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Zap, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const TIER_FEATURES = {
  free: {
    name: "Free",
    color: "bg-slate-700",
    icon: Circle,
    features: [
      { name: "AI Picks (Limited)", included: true },
      { name: "Live Stats", included: true },
      { name: "Backtesting", included: false },
      { name: "Kalshi Markets", included: false },
      { name: "CLV Tracker", included: false },
      { name: "+EV Finder", included: false },
      { name: "Advanced Analytics", included: false },
      { name: "Priority Support", included: false },
    ],
  },
  daily: {
    name: "Daily Pass",
    color: "bg-blue-600",
    icon: Zap,
    features: [
      { name: "AI Picks (Full)", included: true },
      { name: "Live Stats", included: true },
      { name: "Backtesting", included: true },
      { name: "Kalshi Markets", included: false },
      { name: "CLV Tracker", included: false },
      { name: "+EV Finder", included: true },
      { name: "Advanced Analytics", included: false },
      { name: "Priority Support", included: false },
    ],
  },
  monthly: {
    name: "Monthly Pro",
    color: "bg-purple-600",
    icon: Crown,
    features: [
      { name: "AI Picks (Full)", included: true },
      { name: "Live Stats", included: true },
      { name: "Backtesting", included: true },
      { name: "Kalshi Markets", included: true },
      { name: "CLV Tracker", included: true },
      { name: "+EV Finder", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: false },
    ],
  },
  yearly: {
    name: "Annual Elite",
    color: "bg-amber-500",
    icon: Sparkles,
    features: [
      { name: "AI Picks (Full)", included: true },
      { name: "Live Stats", included: true },
      { name: "Backtesting", included: true },
      { name: "Kalshi Markets", included: true },
      { name: "CLV Tracker", included: true },
      { name: "+EV Finder", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: true },
    ],
  },
};

export default function SubscriptionDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: subscription, isLoading } = trpc.subscription.mySubscription.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">Please sign in to view your subscription details.</p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const currentTier = (subscription?.tier || "free") as keyof typeof TIER_FEATURES;
  const tierInfo = TIER_FEATURES[currentTier];
  const TierIcon = tierInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Subscription Dashboard</h1>
          <p className="text-slate-400">Manage your ChalkPicks Pro subscription and premium features</p>
        </div>

        {/* Current Subscription Card */}
        <Card className={`${tierInfo.color} border-0 mb-8 overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent"></div>
          <CardHeader className="relative pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TierIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-3xl mb-1">{tierInfo.name}</CardTitle>
                  <p className="text-white/80">Your current subscription tier</p>
                </div>
              </div>
              <Badge className="bg-white text-slate-900 text-lg px-4 py-2">
                {subscription?.status === "active" ? "✓ Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscription?.currentPeriodStart && (
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-1">Billing Period Start</p>
                  <p className="text-white font-semibold">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                  </p>
                </div>
              )}
              {subscription?.currentPeriodEnd && (
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-1">Billing Period End</p>
                  <p className="text-white font-semibold">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
              {subscription?.priceId && (
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-1">Price</p>
                  <p className="text-white font-semibold">
                    {currentTier === "daily"
                      ? "$9.99/day"
                      : currentTier === "monthly"
                        ? "$29.99/month"
                        : currentTier === "yearly"
                          ? "$299.99/year"
                          : "Free"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Active Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierInfo.features.map((feature, idx) => (
              <Card
                key={idx}
                className={`border-2 ${
                  feature.included
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-800/50 border-slate-700/50 opacity-50"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "text-white font-medium" : "text-slate-400"}>
                      {feature.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upgrade/Manage Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upgrade CTA */}
          {currentTier !== "yearly" && (
            <Card className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Upgrade Your Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  Unlock more premium features and get access to advanced analytics, Kalshi markets, and priority
                  support.
                </p>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700"
                >
                  View Pricing Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Manage Subscription */}
          <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Manage Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                {subscription?.status === "active"
                  ? "View billing history, update payment method, or cancel your subscription."
                  : "Reactivate your subscription to regain access to premium features."}
              </p>
              <Button
                onClick={() => {
                  if (subscription?.customerId) {
                    // Open Stripe customer portal
                    window.location.href = `https://billing.stripe.com/login/test_YWNjdF8xSXRyeUNoOFBtbnl0QWsxN1Z6ckhaamVUeTRoTjZjTElnNQ?prefilled_email=${encodeURIComponent(user?.email || '')}`;
                  }
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Manage Subscription
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">All Subscription Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(TIER_FEATURES).map(([key, tier]) => (
              <Card
                key={key}
                className={`border-2 ${
                  key === currentTier
                    ? "bg-slate-800 border-cyan-500/50 ring-2 ring-cyan-500/20"
                    : "bg-slate-800/50 border-slate-700/50"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-white">{tier.name}</CardTitle>
                    {key === currentTier && <Badge className="bg-cyan-500">Current</Badge>}
                  </div>
                  <p className="text-sm text-slate-400">
                    {key === "free"
                      ? "Free forever"
                      : key === "daily"
                        ? "$9.99/day"
                        : key === "monthly"
                          ? "$29.99/month"
                          : "$299.99/year"}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "text-slate-300" : "text-slate-500 line-through"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 pt-2">+ {tier.features.length - 4} more features</p>
                  </div>
                  {key !== currentTier && (
                    <Button
                      onClick={() => navigate("/pricing")}
                      variant="outline"
                      className="w-full mt-4 border-slate-600 hover:bg-slate-700"
                    >
                      View Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
