import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";
import NeonCard from "@/components/NeonCard";
import { Check, Zap, Crown, Star, Shield, Lock, Tag, Loader2, ArrowRight, Sparkles, Gift, Percent, Clock } from "lucide-react";

// ─── Countdown timer hook ─────────────────────────────────────────────────────

function useCountdown() {
  // Offer expires 72 hours from the user's first visit (stored in localStorage)
  const [endTime] = useState(() => {
    const stored = localStorage.getItem("chalk15_expires");
    if (stored) return parseInt(stored);
    const expires = Date.now() + 72 * 60 * 60 * 1000; // 72 hours
    localStorage.setItem("chalk15_expires", expires.toString());
    return expires;
  });

  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: timeLeft <= 0 };
}

// ─── Promo Banner with Countdown ─────────────────────────────────────────────

function PromoBanner({ onApply }: { onApply: () => void }) {
  const { hours, minutes, seconds, expired } = useCountdown();

  if (expired) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(135deg, rgba(57,255,20,0.06) 0%, rgba(212,160,23,0.06) 100%)",
        border: "1px solid rgba(57,255,20,0.15)",
      }}
    >
      {/* Animated shimmer */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-full animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.03) 50%, transparent 100%)" }}
        />
      </div>

      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
            >
              <Gift className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Limited Time Offer</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                  15% OFF
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Use code <span className="font-mono font-bold text-brand-green">CHALK15</span> at checkout for 15% off any plan
              </p>
            </div>
          </div>
          <button
            onClick={onApply}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:scale-105"
            style={{
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.25)",
              color: "#39ff14",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Code
          </button>
        </div>

        {/* Countdown timer */}
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Clock className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-xs text-white/50">Offer expires in:</span>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-white/5 text-brand-green border border-white/10">
              {pad(hours)}
            </span>
            <span className="text-white/30 text-xs">:</span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-white/5 text-brand-green border border-white/10">
              {pad(minutes)}
            </span>
            <span className="text-white/30 text-xs">:</span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-white/5 text-brand-green border border-white/10">
              {pad(seconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, {
  icon: React.ElementType;
  color: string;
  glow: string;
  badge?: string;
  popular?: boolean;
}> = {
  daily:   { icon: Zap,   color: "#f0b800", glow: "rgba(212,160,23,0.25)",   badge: "Try it out" },
  monthly: { icon: Crown, color: "#39ff14", glow: "rgba(57,255,20,0.25)",   badge: "Most Popular", popular: true },
  yearly:  { icon: Star,  color: "#d4a017", glow: "rgba(212,160,23,0.25)",  badge: "Best Value" },
};

// ─── Detailed feature comparison ───────────────────────────────────────────────

const FEATURE_CATEGORIES = [
  {
    category: "Core Features",
    features: [
      { name: "AI-generated picks (daily)", daily: true, monthly: true, yearly: true, description: "Daily AI picks with confidence scores" },
      { name: "Confidence & edge scores", daily: true, monthly: true, yearly: true, description: "AI confidence and expected value metrics" },
      { name: "Live stats & player data", daily: true, monthly: true, yearly: true, description: "Real-time stats from 10+ sportsbooks" },
      { name: "Leaderboard access", daily: true, monthly: true, yearly: true, description: "View top bettors and their performance" },
    ]
  },
  {
    category: "Premium Analytics",
    features: [
      { name: "+EV Finder", daily: false, monthly: true, yearly: true, description: "Find positive expected value opportunities" },
      { name: "Steam move detector", daily: false, monthly: true, yearly: true, description: "Detect sharp money and line movements" },
      { name: "CLV Tracker", daily: false, monthly: true, yearly: true, description: "Track closing line value for your bets" },
      { name: "Backtesting engine", daily: false, monthly: true, yearly: true, description: "Test strategies against historical data" },
    ]
  },
  {
    category: "Tools & Calculators",
    features: [
      { name: "Kelly Criterion calculator", daily: false, monthly: true, yearly: true, description: "Optimal bet sizing based on edge" },
      { name: "Parlay optimizer", daily: false, monthly: true, yearly: true, description: "Build and analyze multi-leg parlays" },
      { name: "Arbitrage finder", daily: false, monthly: true, yearly: true, description: "Find risk-free arbitrage opportunities" },
      { name: "Bankroll tracker", daily: false, monthly: true, yearly: true, description: "Track P&L, ROI, and betting performance" },
    ]
  },
  {
    category: "Market Data",
    features: [
      { name: "Kalshi prediction markets", daily: false, monthly: true, yearly: true, description: "Access to real prediction market data" },
      { name: "Odds comparison (18+ books)", daily: false, monthly: true, yearly: true, description: "Compare odds across major sportsbooks" },
      { name: "Line movement history", daily: false, monthly: true, yearly: true, description: "Historical line movement tracking" },
    ]
  },
  {
    category: "Support & Community",
    features: [
      { name: "Email pick alerts", daily: false, monthly: true, yearly: true, description: "Daily picks delivered to your inbox" },
      { name: "Email support", daily: false, monthly: true, yearly: true, description: "Priority email support" },
      { name: "VIP Discord access", daily: false, monthly: false, yearly: true, description: "Exclusive Discord community for elite members" },
      { name: "1-on-1 strategy sessions", daily: false, monthly: false, yearly: true, description: "Personal consulting with betting experts" },
      { name: "Advanced backtesting", daily: false, monthly: false, yearly: true, description: "Deep historical analysis and simulations" },
    ]
  },
];

function CheckMark({ value, color }: { value: boolean; color: string }) {
  return value
    ? <div className="flex justify-center"><Check className="w-4 h-4" style={{ color }} /></div>
    : <div className="flex justify-center"><span className="text-white/20">—</span></div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const [showComparison, setShowComparison] = useState(false);

  // A/B test: CTA button text variant
  // Variant A (even userId or unauthenticated): "Get Access Now"
  // Variant B (odd userId): "Start Free Trial"
  const abVariant = useMemo(() => {
    if (!user) return Math.random() < 0.5 ? 'A' : 'B'; // random for unauthenticated
    return (user.id as number) % 2 === 0 ? 'A' : 'B';
  }, [user]);

  useEffect(() => {
    analytics.track('ab_experiment_viewed', { experiment: 'pricing_cta_v1', variant: abVariant });
  }, [abVariant]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: plansData } = trpc.subscription.plans.useQuery();
  const { data: mySubscription } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [promoValidating, setPromoValidating] = useState(false);
  const [promoQueryCode, setPromoQueryCode] = useState("");

  const { data: promoResult, error: promoQueryError } = trpc.promoCode.validate.useQuery(
    { code: promoQueryCode, tier: "monthly" },
    {
      enabled: !!promoQueryCode && promoValidating,
      retry: false,
    }
  );

  // Track subscription page view
  useEffect(() => {
    analytics.track("subscription_page_viewed", {});
  }, []);

  React.useEffect(() => {
    if (!promoValidating) return;
    if (promoResult) {
      setPromoApplied(true);
      setPromoError("");
      setPromoDiscount(promoResult.discount ?? 0);
      setPromoDiscountType((promoResult.discountType as "percentage" | "fixed") ?? "percentage");
      setPromoValidating(false);
    }
  }, [promoResult, promoValidating]);

  React.useEffect(() => {
    if (!promoValidating) return;
    if (promoQueryError) {
      setPromoApplied(false);
      setPromoError(promoQueryError.message || "Invalid promo code");
      setPromoValidating(false);
    }
  }, [promoQueryError, promoValidating]);

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        analytics.track("subscription_started", {
          tier: loadingTier,
          promoApplied,
          promoCode: promoApplied ? promoCode.trim() : undefined,
        });
        window.location.href = data.url;
      }
      setLoadingTier(null);
    },
    onError: (err) => {
      alert(err.message || "Failed to create checkout session");
      setLoadingTier(null);
    },
  });

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoApplied(false);
    setPromoValidating(true);
    setPromoQueryCode(promoCode.trim());
  };

  const handleSubscribe = (tier: "daily" | "monthly" | "yearly") => {
    if (!isAuthenticated) {
      analytics.track('pricing_cta_clicked', { tier, variant: abVariant, authenticated: false });
      window.location.href = "/login";
      return;
    }
    analytics.track('pricing_cta_clicked', { tier, variant: abVariant, authenticated: true });
    setLoadingTier(tier);
    createCheckout.mutate({
      tier,
      origin: window.location.origin,
      promoCode: promoApplied ? promoCode.trim() : undefined,
    });
  };

  const getDiscountedPrice = (amountCents: number) => {
    if (!promoApplied) return amountCents;
    if (promoDiscountType === "percentage") {
      return Math.max(0, amountCents - Math.round((amountCents * promoDiscount) / 100));
    }
    return Math.max(0, amountCents - Math.round(promoDiscount * 100));
  };

  const planOrder: Array<"daily" | "monthly" | "yearly"> = ["daily", "monthly", "yearly"];
  const plans = planOrder.map((key) => {
    const p = plansData?.[key];
    if (p) return { key, ...p };
    const defaults = {
      daily:   { name: "Basic",    amountCents: 999,   interval: "month", description: "Essential picks for casual bettors",  features: ["All premium picks daily", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"] },
      monthly: { name: "Pro",      amountCents: 1999,  interval: "month", description: "Best value for serious bettors",    features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support", "Daily pick alerts"] },
      yearly:  { name: "Elite",    amountCents: 5999,  interval: "year",  description: "Maximum savings for pros",          features: ["Everything in Pro", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"] },
    };
    return { key, ...defaults[key] };
  });

  const currentTier = mySubscription?.tier ?? "free";
  const isActive = mySubscription?.isActive ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[radial-gradient(ellipse,rgba(57,255,20,0.04)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 container pt-28 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass-card-static text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-brand-green" />
            <span className="text-white/60">Secure Checkout · Cancel Anytime</span>
          </div>
          <h1 className="font-display text-white leading-tight" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            Pick Your{" "}
            <span className="text-emerald-gradient">Edge</span>
          </h1>
          <p className="mt-4 text-lg max-w-xl mx-auto text-white/45">
            Join thousands of sharp bettors using AI-powered analytics, real-time odds, and professional tools to beat the books.
          </p>

          {/* Active subscription banner */}
          {isAuthenticated && isActive && (
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-full glass-card-static text-sm font-semibold text-brand-green">
              <Check className="w-4 h-4" />
              You're on the <strong>{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</strong> plan
              {mySubscription?.expiresAt && (
                <span className="text-brand-green/60 font-normal">
                  · expires {new Date(mySubscription.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PROMO CODE SECTION — Prominent banner + input
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-2xl mx-auto mb-14">
          {/* Promo banner callout with countdown */}
          {!promoApplied && <PromoBanner onApply={() => setPromoCode("CHALK15")} />}

          {/* Promo code input card */}
          <NeonCard className="p-6" variant={promoApplied ? "premium" : "default"}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{
                  background: promoApplied ? "rgba(57,255,20,0.1)" : "rgba(212,160,23,0.08)",
                  border: `1px solid ${promoApplied ? "rgba(57,255,20,0.25)" : "rgba(212,160,23,0.2)"}`,
                }}
              >
                {promoApplied ? (
                  <Percent className="w-4 h-4 text-brand-green" />
                ) : (
                  <Tag className="w-4 h-4 text-brand-gold" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white">
                  {promoApplied ? "Discount Applied!" : "Have a promo code?"}
                </span>
                <p className="text-xs text-white/40">
                  {promoApplied
                    ? `${promoDiscountType === "percentage" ? `${promoDiscount}%` : `$${promoDiscount}`} off applied to all plans below`
                    : "Enter your code below to unlock exclusive savings"
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); setPromoError(""); }}
                  placeholder="CHALK15"
                  className="w-full px-4 py-3 text-sm font-mono font-semibold tracking-wider rounded-xl bg-white/5 border text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    borderColor: promoApplied ? "rgba(57,255,20,0.4)" : promoError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)",
                    boxShadow: promoApplied ? "0 0 20px rgba(57,255,20,0.1)" : "none",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                />
                {promoApplied && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-5 h-5 text-brand-green" />
                  </div>
                )}
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={promoValidating || !promoCode.trim()}
                className="px-6 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                style={{
                  background: promoApplied
                    ? "rgba(57,255,20,0.15)"
                    : promoCode.trim()
                      ? "linear-gradient(135deg, rgba(57,255,20,0.2) 0%, rgba(57,255,20,0.1) 100%)"
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${promoApplied ? "rgba(57,255,20,0.4)" : promoCode.trim() ? "rgba(57,255,20,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: promoApplied ? "#39ff14" : promoCode.trim() ? "#39ff14" : "rgba(255,255,255,0.3)",
                  cursor: promoValidating ? "wait" : !promoCode.trim() ? "not-allowed" : "pointer",
                  boxShadow: promoApplied ? "0 0 15px rgba(57,255,20,0.15)" : "none",
                }}
              >
                {promoValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : promoApplied ? (
                  <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Applied</span>
                ) : (
                  "Apply"
                )}
              </button>
            </div>

            {/* Success message */}
            {promoApplied && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg"
                style={{ background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.15)" }}
              >
                <Sparkles className="w-4 h-4 text-brand-green flex-shrink-0" />
                <p className="text-xs font-semibold text-brand-green">
                  {promoDiscountType === "percentage" ? `${promoDiscount}% off` : `$${promoDiscount} off`} all plans!
                  Discount reflected in prices below.
                </p>
              </div>
            )}

            {/* Error message */}
            {promoError && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <span className="text-xs font-semibold text-red-400">{promoError}</span>
              </div>
            )}
          </NeonCard>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-14">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.key] ?? PLAN_META.monthly;
            const Icon = meta.icon;
            const isCurrent = isActive && currentTier === plan.key;
            const originalPrice = plan.amountCents / 100;
            const discountedCents = getDiscountedPrice(plan.amountCents);
            const finalPrice = discountedCents / 100;
            const hasDiscount = promoApplied && discountedCents < plan.amountCents;
            const isPopular = meta.popular;
            const isLoading = loadingTier === plan.key;

            return (
              <div
                key={plan.key}
                className="relative flex flex-col"
                style={{ transform: isPopular ? "scale(1.03)" : "scale(1)" }}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-bold tracking-wider z-10 whitespace-nowrap rounded-full bg-brand-green text-black shadow-lg"
                    style={{ boxShadow: "0 0 20px rgba(57,255,20,0.4)" }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}

                <NeonCard
                  className="flex flex-col flex-1 p-7"
                  variant={isPopular ? "premium" : isCurrent ? "accent" : "default"}
                  interactive={false}
                  style={{
                    boxShadow: isPopular ? `0 0 40px ${meta.glow}` : isCurrent ? `0 0 20px ${meta.glow}` : undefined,
                  }}
                >
                  {/* Plan header */}
                  <div className="mb-6">
                    <div
                      className="w-11 h-11 flex items-center justify-center mb-4 rounded-xl"
                      style={{ background: `${meta.color}0a`, border: `1px solid ${meta.color}25` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: meta.color }}>
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
                        style={{ fontSize: "3.2rem", color: hasDiscount ? "#39ff14" : meta.color }}
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
                        CHALK15 APPLIED — You save ${(originalPrice - finalPrice).toFixed(2)}!
                      </div>
                    )}
                    {plan.key === "yearly" && !hasDiscount && (
                      <div className="text-xs mt-1.5 text-brand-gold">= ${(originalPrice / 12).toFixed(2)}/mo · Save $14/mo vs Pro</div>
                    )}
                    {plan.key === "monthly" && !hasDiscount && (
                      <div className="text-xs mt-1.5 text-white/35">Billed monthly · cancel anytime</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {(plan.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                        <span className="text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div
                      className="w-full py-3.5 text-center text-sm font-semibold rounded-xl"
                      style={{ background: `${meta.color}0a`, border: `1px solid ${meta.color}30`, color: meta.color }}
                    >
                      ✓ CURRENT PLAN
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.key as "daily" | "monthly" | "yearly")}
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
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : !isAuthenticated ? (
                        <><Lock className="w-4 h-4" /> Sign In to Subscribe</>
                      ) : (
                        <><Zap className="w-4 h-4" /> {hasDiscount ? "Get Discounted Access" : abVariant === 'B' ? "Start Free Trial" : "Get Access Now"}</>
                      )}
                    </button>
                  )}
                </NeonCard>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {[
            { icon: Shield, label: "256-bit SSL Encryption" },
            { icon: Check,  label: "Cancel Anytime" },
            { icon: Zap,    label: "Instant Access" },
            { icon: Star,   label: "Powered by Stripe" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 text-sm text-white/40">
              <badge.icon className="w-4 h-4 text-brand-green/60" />
              {badge.label}
            </div>
          ))}
        </div>

        {/* Feature comparison toggle */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="btn-outline-premium text-sm py-2.5 px-5"
          >
            {showComparison ? "Hide" : "Show"} Detailed Feature Comparison
            <ArrowRight className="w-4 h-4" style={{ transform: showComparison ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s" }} />
          </button>
        </div>

        {/* Enhanced feature comparison table */}
        {showComparison && (
          <NeonCard className="max-w-5xl mx-auto overflow-hidden mb-14 p-8" interactive={false}>
            <h3 className="font-display text-2xl text-white mb-6">Complete Feature Breakdown</h3>

            <div className="space-y-8">
              {FEATURE_CATEGORIES.map((category, catIdx) => (
                <div key={catIdx}>
                  <h4 className="text-xs font-semibold tracking-wider text-brand-green mb-4 uppercase">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.features.map((feature, fIdx) => (
                      <div
                        key={fIdx}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-3 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.02)", borderLeft: "2px solid rgba(57,255,20,0.1)" }}
                      >
                        <div className="md:col-span-2">
                          <div className="font-medium text-sm text-white/80">{feature.name}</div>
                          <div className="text-xs mt-0.5 text-white/35">{feature.description}</div>
                        </div>
                        <div className="flex justify-center">
                          <CheckMark value={feature.daily} color="#f0b800" />
                        </div>
                        <div className="flex justify-center">
                          <CheckMark value={feature.monthly} color="#39ff14" />
                        </div>
                        <div className="flex justify-center">
                          <CheckMark value={feature.yearly} color="#d4a017" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}>
                    <Check className="w-3 h-3" style={{ color: "#f0b800" }} />
                  </div>
                  <span className="text-white/40">Basic ($9.99/mo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
                    <Check className="w-3 h-3" style={{ color: "#39ff14" }} />
                  </div>
                  <span className="text-white/40">Pro ($19.99/mo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}>
                    <Check className="w-3 h-3" style={{ color: "#d4a017" }} />
                  </div>
                  <span className="text-white/40">Elite ($59.99/yr)</span>
                </div>
              </div>
            </div>
          </NeonCard>
        )}

        {/* Guarantee card */}
        <div className="max-w-2xl mx-auto text-center">
          <NeonCard className="p-8" variant="accent" interactive={false}>
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-5 rounded-2xl" style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}>
              <Shield className="w-7 h-7 text-brand-gold" />
            </div>
            <h3 className="font-display text-xl text-white mb-3">Money-Back Guarantee</h3>
            <p className="text-sm text-white/45 leading-relaxed">
              Not satisfied? Contact us within 48 hours of your first purchase and we'll issue a full refund — no questions asked.
            </p>
            <div className="mt-4 text-xs text-white/25">
              Payments processed securely by Stripe
            </div>
          </NeonCard>
        </div>
      </div>

      {/* Shimmer animation keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
