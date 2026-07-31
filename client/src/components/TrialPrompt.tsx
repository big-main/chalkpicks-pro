import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Zap } from "lucide-react";
import { useLocation } from "wouter";

/**
 * UpgradePrompt Component
 * Displays a prominent prompt on the dashboard for free users to upgrade
 * to a paid plan. Only shows for users with "free" subscription tier.
 */
export function TrialPrompt() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Only show for free users
  if (!user || user.subscriptionTier !== "free") {
    return null;
  }

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  return (
    <Card className="relative overflow-hidden border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/20 to-orange-950/20 p-6 mb-6">
      {/* Animated background accent */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/50">
            <Zap className="w-6 h-6 text-brand-gold" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1">
            Upgrade to Premium
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Unlock AI-powered picks, advanced analytics, and pro tools. Plans
            start at $9.99/mo.
          </p>

          {/* Features list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Zap className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>Premium AI picks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Zap className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Zap className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>Backtesting tools</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Zap className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>Leaderboard access</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            View Plans & Subscribe
          </Button>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            // Could add dismiss logic here if needed
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-transparent" />
    </Card>
  );
}
