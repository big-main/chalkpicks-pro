import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CreditCard, Zap } from "lucide-react";
import { useLocation } from "wouter";

/**
 * TrialPrompt Component
 * Displays a prominent prompt on the dashboard for free users to enter payment method
 * to start their 3-day free trial. Only shows for users with "free" subscription tier.
 */
export function TrialPrompt() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Only show for free users
  if (!user || user.subscriptionTier !== "free") {
    return null;
  }

  const handleStartTrial = () => {
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
            <AlertCircle className="w-6 h-6 text-brand-gold" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1">
            Unlock Your 3-Day Free Trial
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Enter your payment method to activate your free trial and unlock premium features. No charges will be made until your trial ends.
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
            onClick={handleStartTrial}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Add Payment Method & Start Trial
          </Button>
        </div>

        {/* Close button (optional - can be removed if always visible) */}
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
