import { Check, Zap, Crown, Star, Lock, Loader2, Sparkles } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import NativePurchaseButton from "@/components/NativePurchaseButton";
import { Capacitor } from "@capacitor/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PricingPlan {
  key: "daily" | "monthly" | "yearly";
  name: string;
  amountCents: number;
  interval: string;
  description: string;
  features: string[];
}

export interface PricingCardProps {
  plan: PricingPlan;
  /** Whether this is the user's current active subscription tier */
  isCurrentPlan: boolean;
  /** Whether this card is highlighted as the most popular option */
  isPopular?: boolean;
  /** Whether a promo discount has been applied */
  hasDiscount?: boolean;
  /** The discounted price in cents (used when hasDiscount is true) */
  discountedCents?: number;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether this card's subscribe action is currently loading */
  isLoading?: boolean;
  /** Called when the user clicks the subscribe CTA on web (Stripe flow) */
  onSubscribe: (tier: "daily" | "monthly" | "yearly") => void;
}

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    glow: string;
    badge?: string;
    popular?: boolean;
  }
> = {
  daily: {
    icon: Zap,
    color: "#f0b800",
    glow: "rgba(212,160,23,0.25)",
    badge: "Try it out",
  },
  monthly: {
    icon: Crown,
    color: "#39ff14",
    glow: "rgba(57,255,20,0.25)",
    badge: "Most Popular",
    popular: true,
  },
  yearly: {
    icon: Star,
    color: "#d4a017",
    glow: "rgba(212,160,23,0.25)",
    badge: "Best Value",
  },
};

// ─── PricingCard ──────────────────────────────────────────────────────────────

export default function PricingCard({
  plan,
  isCurrentPlan,
  isPopular = false,
  hasDiscount = false,
  discountedCents,
  isAuthenticated,
  isLoading = false,
  onSubscribe,
}: PricingCardProps) {
  const meta = PLAN_META[plan.key] ?? PLAN_META.monthly;
  const Icon = meta.icon;

  const originalPrice = plan.amountCents / 100;
  const finalCents =
    hasDiscount && discountedCents !== null && discountedCents !== undefined
      ? discountedCents
      : plan.amountCents;
  const finalPrice = finalCents / 100;

  return (
    <div
      className="relative flex flex-col"
      style={{ transform: isPopular ? "scale(1.03)" : "scale(1)" }}
    >
      {isPopular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-bold tracking-wider z-10 whitespace-nowrap rounded-full bg-brand-green text-black shadow-lg"
          style={{ boxShadow: "0 0 20px rgba(57,255,20,0.4)" }}
        >
          ★ MOST POPULAR
        </div>
      )}

      <NeonCard
        className="flex flex-col flex-1 p-7"
        variant={isPopular ? "premium" : isCurrentPlan ? "accent" : "default"}
        interactive={false}
        style={{
          boxShadow: isPopular
            ? `0 0 40px ${meta.glow}`
            : isCurrentPlan
              ? `0 0 20px ${meta.glow}`
              : undefined,
        }}
      >
        {/* Plan header */}
        <div className="mb-6">
          <div
            className="w-11 h-11 flex items-center justify-center mb-4 rounded-xl"
            style={{
              background: `${meta.color}0a`,
              border: `1px solid ${meta.color}25`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: meta.color }} />
          </div>
          <div
            className="text-[10px] font-bold tracking-wider mb-1.5"
            style={{ color: meta.color }}
          >
            {meta.badge?.toUpperCase()}
          </div>
          <h2 className="font-display text-xl text-white">{plan.name}</h2>
          <p className="text-sm mt-1.5 text-white/40">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-7">
          <div className="flex items-end gap-1.5">
            {hasDiscount && (
              <span className="mb-2 text-lg line-through text-white/30">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span
              className="font-display leading-none"
              style={{
                fontSize: "3.2rem",
                color: hasDiscount ? "#39ff14" : meta.color,
              }}
            >
              ${finalPrice.toFixed(2)}
            </span>
            <span className="mb-2 text-sm text-white/40">
              /{plan.key === "yearly" ? "yr" : "mo"}
            </span>
          </div>
          {hasDiscount && (
            <div className="text-xs mt-1.5 font-semibold text-brand-green flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              CHALK15 APPLIED — You save $
              {(originalPrice - finalPrice).toFixed(2)}!
            </div>
          )}
          {plan.key === "yearly" && !hasDiscount && (
            <div className="text-xs mt-1.5 text-brand-gold">
              = ${(originalPrice / 12).toFixed(2)}/mo · Save $14/mo vs Pro
            </div>
          )}
          {plan.key === "monthly" && !hasDiscount && (
            <div className="text-xs mt-1.5 text-white/35">
              Billed monthly · cancel anytime
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {(plan.features as string[]).map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: meta.color }}
              />
              <span className="text-white/70">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrentPlan ? (
          <div
            className="w-full py-3.5 text-center text-sm font-semibold rounded-xl"
            style={{
              background: `${meta.color}0a`,
              border: `1px solid ${meta.color}30`,
              color: meta.color,
            }}
          >
            ✓ CURRENT PLAN
          </div>
        ) : Capacitor.isNativePlatform() ? (
          // Native iOS/Android: route through RevenueCat → App Store / Google Play
          <div
            style={{
              background: isPopular ? meta.color : `${meta.color}10`,
              color: isPopular ? "#0a0a0f" : meta.color,
              border: `1px solid ${meta.color}40`,
              boxShadow: isPopular ? `0 0 20px ${meta.glow}` : "none",
              borderRadius: "0.75rem",
            }}
          >
            <NativePurchaseButton
              tier={plan.key}
              label={hasDiscount ? "Get Discounted Access" : "Get Access Now"}
              className="w-full py-3.5 text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            />
          </div>
        ) : (
          // Web: Stripe Checkout
          <button
            onClick={() => onSubscribe(plan.key)}
            disabled={isLoading}
            className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all rounded-xl hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: isPopular ? meta.color : `${meta.color}10`,
              color: isPopular ? "#0a0a0f" : meta.color,
              border: `1px solid ${meta.color}40`,
              cursor: isLoading ? "wait" : "pointer",
              boxShadow: isPopular ? `0 0 20px ${meta.glow}` : "none",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : !isAuthenticated ? (
              <>
                <Lock className="w-4 h-4" /> Sign In to Subscribe
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />{" "}
                {hasDiscount ? "Get Discounted Access" : "Get Access Now"}
              </>
            )}
          </button>
        )}
      </NeonCard>
    </div>
  );
}
