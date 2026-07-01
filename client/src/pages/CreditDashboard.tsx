import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, TrendingUp, Zap } from "lucide-react";

export default function CreditDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"daily" | "monthly" | "yearly">("monthly");

  const { data: subscription } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create checkout session");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>Please log in to view your credits</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accountBalance = parseFloat(user?.accountBalance?.toString() || "0");
  const subscriptionStatus = subscription?.isActive ? "active" : "inactive";
  const subscriptionTier = subscription?.tier || "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Credit Dashboard</h1>
          <p className="text-slate-400">Manage your account credits and purchases</p>
        </div>

        {/* Credit Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Available Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">${accountBalance.toFixed(2)}</div>
              <p className="text-emerald-100 text-sm">Ready to use on any tool</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2 capitalize">{subscriptionTier}</div>
              <Badge className={subscription?.isActive ? "bg-emerald-400" : "bg-slate-400"}>
                {subscriptionStatus}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Bonus Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">$100</div>
              <p className="text-purple-100 text-sm">From your first payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Credits Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Purchase More Credits</CardTitle>
            <CardDescription>Get $100 bonus credits on any purchase of $5 or more</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { tier: "daily", name: "Daily Pass", price: 9.99, description: "24-hour access" },
                { tier: "monthly", name: "Monthly Pass", price: 29.99, description: "30-day access" },
                { tier: "yearly", name: "VIP Annual Pass", price: 199.99, description: "365-day access" },
              ].map(({ tier, name, price, description }) => (
                <Card
                  key={tier}
                  className={`cursor-pointer transition-all ${
                    selectedTier === tier ? "ring-2 ring-emerald-500" : ""
                  }`}
                  onClick={() => setSelectedTier(tier as "daily" | "monthly" | "yearly")}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{name}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">${price}</div>
                    <div className="text-sm text-emerald-600 font-semibold">+ $100 bonus credits</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={() => {
                createCheckout.mutate({
                  tier: selectedTier,
                  origin: window.location.origin,
                });
              }}
              disabled={createCheckout.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
            >
              {createCheckout.isPending ? "Processing..." : `Purchase ${selectedTier} Pass`}
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-5 h-5" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2 text-sm">
            <p>• Every purchase of $5 or more grants you $100 in bonus credits</p>
            <p>• Use credits on any ChalkPicks Pro tool and feature</p>
            <p>• Credits never expire — use them anytime</p>
            <p>• Subscription gives you access to all features + bonus credits</p>
            <p>• Use promo code LAUNCH50 for 15% off any purchase</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
