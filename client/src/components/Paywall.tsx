import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Zap, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PaywallProps {
  tier: "daily" | "monthly" | "yearly";
  title?: string;
  description?: string;
}

export function Paywall({ tier, title = "Premium Feature", description = "Unlock this feature with a subscription" }: PaywallProps) {
  const [location, navigate] = useLocation();

  const tierInfo = {
    daily: { name: "Daily Pass", price: "$9.99/day", features: ["24-hour full access", "All premium picks", "Real-time alerts"] },
    monthly: { name: "Monthly Pro", price: "$29.99/mo", features: ["Unlimited access", "Backtesting engine", "Leaderboard", "Priority support"] },
    yearly: { name: "Annual Elite", price: "$199.99/yr", features: ["Everything in Monthly", "Early access to features", "VIP Discord", "1-on-1 sessions"] },
  };

  const info = tierInfo[tier];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex items-center justify-center px-4 pt-32 pb-16">
        <div className="max-w-md w-full">
          {/* Locked Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40 bg-[rgba(57,255,20,0.2)]"></div>
              <div className="relative glass-card-static rounded-full p-5 glow-green">
                <Lock className="w-8 h-8 text-[#39ff14]" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">{title}</h1>
            <p className="text-muted-foreground mb-5 text-lg">{description}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.2)]">
              <Zap className="w-4 h-4 text-[#39ff14]" />
              <span className="text-[#39ff14] font-condensed text-sm">Requires {info.name}</span>
            </div>
          </div>

          {/* Features */}
          <div className="glass-card-static p-6 mb-8">
            <p className="text-foreground text-sm font-condensed uppercase tracking-wider mb-4">What you'll unlock:</p>
            <ul className="space-y-3">
              {info.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-muted-foreground text-sm">
                  <div className="w-5 h-5 rounded-full bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.3)] flex items-center justify-center mr-3 flex-shrink-0">
                    <Zap className="w-3 h-3 text-[#39ff14]" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/pricing", { replace: true })}
              className="btn-premium w-full justify-center"
            >
              <Zap className="w-4 h-4" />
              Upgrade to {info.name}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="btn-outline-premium w-full justify-center"
            >
              Back to Home
            </button>
          </div>

          {/* Price */}
          <p className="text-center text-muted-foreground text-sm mt-6">Starting at {info.price}</p>
        </div>
      </div>
    </div>
  );
}
