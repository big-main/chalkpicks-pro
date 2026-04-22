import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, Crown, Star, Shield } from "lucide-react";
import { toast } from "sonner";

const PLAN_ICONS = { daily: Zap, monthly: Star, yearly: Crown };
const PLAN_COLORS = {
  daily: "border-blue-400/30 hover:border-blue-400/60",
  monthly: "border-primary/50 hover:border-primary glow-gold",
  yearly: "border-accent/30 hover:border-accent/60",
};

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const { data: plans } = trpc.subscription.plans.useQuery();
  const { data: mySubscription } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      if (url) {
        toast.info("Redirecting to checkout...");
        window.open(url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to start checkout"),
  });

  const handleSubscribe = (tier: "daily" | "monthly" | "yearly") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createCheckout.mutate({ tier, origin: window.location.origin });
  };

  const planOrder: Array<"daily" | "monthly" | "yearly"> = ["daily", "monthly", "yearly"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-12 text-center">
            <Badge className="mb-3 badge-premium border-0 text-xs inline-flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium Access
            </Badge>
            <h1 className="font-display text-5xl tracking-wider mb-3">
              CHOOSE YOUR <span className="text-gold-gradient">EDGE</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join thousands of winning bettors. Get AI-powered picks, real-time stats, backtesting, and more.
            </p>
          </div>
        </div>

        <div className="container py-10">
          {/* Current Subscription */}
          {isAuthenticated && mySubscription?.isActive && (
            <Card className="bg-accent/5 border-accent/30 mb-8 max-w-lg mx-auto">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    Active: {mySubscription.tier?.charAt(0).toUpperCase()}{mySubscription.tier?.slice(1)} Plan
                  </div>
                  {mySubscription.expiresAt && (
                    <div className="text-xs text-muted-foreground">
                      Expires: {new Date(mySubscription.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {planOrder.map((tier) => {
              const plan = plans?.[tier];
              if (!plan) return null;
              const Icon = PLAN_ICONS[tier];
              const isCurrentPlan = mySubscription?.tier === tier && mySubscription?.isActive;
              const isPopular = (plan as any).popular;

              return (
                <Card key={tier} className={`bg-card relative transition-all duration-300 ${PLAN_COLORS[tier]} ${isPopular ? "scale-105" : ""}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="badge-premium border-0 text-xs px-3">⭐ Most Popular</Badge>
                    </div>
                  )}
                  {(plan as any).savings && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="badge-win border-0 text-xs">{(plan as any).savings}</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${tier === "daily" ? "text-blue-400" : tier === "monthly" ? "text-primary" : "text-accent"}`} />
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="font-display text-4xl text-foreground">
                        ${(plan.amountCents / 100).toFixed(tier === "yearly" ? 0 : 2)}
                      </span>
                      <span className="text-muted-foreground text-sm mb-1">
                        /{tier === "daily" ? "day" : tier === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature: string) => (
                        <div key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className={`w-full font-bold ${
                        isCurrentPlan ? "bg-accent/20 text-accent border border-accent/30 cursor-default" :
                        isPopular ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-gold" :
                        "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                      onClick={() => !isCurrentPlan && handleSubscribe(tier)}
                      disabled={createCheckout.isPending || isCurrentPlan}
                    >
                      {isCurrentPlan ? "✓ Current Plan" :
                        createCheckout.isPending && createCheckout.variables?.tier === tier ? "Loading..." :
                        isAuthenticated ? `Get ${plan.name}` : "Sign In to Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Free Tier */}
          <Card className="bg-card border-border max-w-2xl mx-auto mb-10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="font-semibold text-foreground mb-1">Free Tier — Always Available</div>
                  <p className="text-sm text-muted-foreground">Get started with limited picks and basic stats. No credit card required.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {["3 free picks/day", "Basic stats", "Public leaderboard"].map(f => (
                    <Badge key={f} className="bg-secondary text-muted-foreground border-0 text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Signals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: "🔒", label: "Secure Payments", sub: "Powered by Stripe" },
              { icon: "↩️", label: "Cancel Anytime", sub: "No lock-in contracts" },
              { icon: "🎯", label: "68%+ Win Rate", sub: "Verified historical data" },
              { icon: "⚡", label: "Instant Access", sub: "Picks unlock immediately" },
            ].map(t => (
              <div key={t.label} className="text-center">
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="text-sm font-medium text-foreground">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.sub}</div>
              </div>
            ))}
          </div>

          {/* Test Mode Notice */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Test payments: use card <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">4242 4242 4242 4242</code>, any future date, any CVC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
