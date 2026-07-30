/**
 * NativePurchaseButton — Smart purchase CTA that routes to:
 *  - RevenueCat (App Store / Google Play) on native iOS/Android
 *  - Stripe Checkout on web
 *
 * Drop this in anywhere you have a "Subscribe" button.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRevenueCat, type RCTier } from "@/hooks/useRevenueCat";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface NativePurchaseButtonProps {
  tier: RCTier;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  onSuccess?: () => void;
}

export default function NativePurchaseButton({
  tier,
  label,
  className = "",
  variant = "default",
  size = "default",
  onSuccess,
}: NativePurchaseButtonProps) {
  const { isAuthenticated } = useAuth();
  const [webLoading, setWebLoading] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);

  const {
    isNative,
    isConfigured,
    isLoading: rcLoading,
    purchaseTier,
  } = useRevenueCat();

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: data => {
      if (data?.url) window.location.href = data.url;
    },
  });

  const tierLabels: Record<RCTier, string> = {
    daily: "Get Basic — $9.99/mo",
    monthly: "Get Pro — $19.99/mo",
    yearly: "Get Elite — $59.99/yr",
  };

  const buttonLabel = label ?? tierLabels[tier];
  const isLoading = rcLoading || webLoading || createCheckout.isPending;

  const handleClick = async () => {
    if (!isAuthenticated) {
      // Redirect to login, return to pricing after auth
      window.location.href = `/login?returnTo=${encodeURIComponent("/pricing")}`;
      return;
    }

    setNativeError(null);

    if (isNative && isConfigured) {
      // Native path: RevenueCat → App Store / Google Play
      const result = await purchaseTier(tier);
      if (result.success) {
        onSuccess?.();
      } else if (result.error && !result.error.includes("cancel")) {
        setNativeError(result.error);
      }
    } else {
      // Web path: Stripe Checkout
      setWebLoading(true);
      try {
        await createCheckout.mutateAsync({
          tier,
          origin: window.location.origin,
        });
      } finally {
        setWebLoading(false);
      }
    }
  };

  const isIOS =
    typeof window !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          buttonLabel
        )}
      </Button>
      {nativeError && (
        <p className="text-xs text-red-400 text-center max-w-xs">
          {nativeError}
        </p>
      )}
      {isNative && isConfigured && (
        <p className="text-xs text-white/30">
          Billed via {isIOS ? "App Store" : "Google Play"}
        </p>
      )}
    </div>
  );
}
