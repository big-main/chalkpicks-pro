/**
 * useRevenueCat — Native in-app purchase hook for iOS/Android via Capacitor.
 *
 * On native (iOS/Android): uses @revenuecat/purchases-capacitor to handle
 * App Store / Google Play subscriptions.
 * On web: falls back to the existing Stripe checkout flow.
 *
 * Setup required:
 *  1. Create a RevenueCat project at app.revenuecat.com
 *  2. Add your iOS/Android API keys to VITE_REVENUECAT_IOS_KEY and VITE_REVENUECAT_ANDROID_KEY
 *  3. Create products in App Store Connect / Google Play Console matching the IDs below
 *  4. Add those products to a RevenueCat Offering called "default"
 *  5. In RevenueCat dashboard → Integrations → Webhooks, add:
 *       URL: https://chalkpicks.live/api/revenuecat/webhook
 *       Authorization: value of REVENUECAT_WEBHOOK_SECRET env var
 */
import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { trpc } from "@/lib/trpc";

// RevenueCat product IDs — must match App Store Connect / Google Play Console
export const RC_PRODUCTS = {
  daily: "chalkpicks_basic_monthly", // $9.99/mo — Basic tier
  monthly: "chalkpicks_pro_monthly", // $19.99/mo — Pro tier
  yearly: "chalkpicks_elite_yearly", // $59.99/yr — Elite tier
} as const;

export type RCTier = keyof typeof RC_PRODUCTS;

interface RCCustomerInfo {
  activeSubscriptions: string[];
  entitlements: Record<
    string,
    { isActive: boolean; productIdentifier: string }
  >;
}

interface UseRevenueCatReturn {
  isNative: boolean;
  isConfigured: boolean;
  customerInfo: RCCustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  purchaseTier: (tier: RCTier) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  hasActiveSubscription: boolean;
  activeTier: RCTier | null;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const isNative = Capacitor.isNativePlatform();
  const [isConfigured, setIsConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<RCCustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current user's numeric ID to bind to RevenueCat so the
  // server-side webhook can match App Store / Google Play purchases back
  // to the correct ChalkPicks account.
  const { data: currentUser } = trpc.auth.me.useQuery(undefined, {
    enabled: isNative,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Initialize RevenueCat on native platforms only
  useEffect(() => {
    if (!isNative) return;

    const initRC = async () => {
      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        const platform = Capacitor.getPlatform();
        const apiKey =
          platform === "ios"
            ? import.meta.env.VITE_REVENUECAT_IOS_KEY
            : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

        if (!apiKey) {
          console.warn(
            "[RevenueCat] API key not configured for platform:",
            platform
          );
          return;
        }

        await Purchases.configure({ apiKey });

        // Bind the logged-in user's numeric ID as the RevenueCat appUserId.
        // This is what the server-side webhook uses to look up the user in DB.
        if (currentUser?.id) {
          try {
            await Purchases.logIn({ appUserID: String(currentUser.id) });
            console.warn(`[RevenueCat] Logged in as user ${currentUser.id}`);
          } catch (loginErr) {
            // Non-fatal — anonymous purchases still work, webhook matching won't
            console.warn("[RevenueCat] logIn failed (non-fatal):", loginErr);
          }
        }

        setIsConfigured(true);

        // Fetch initial customer info
        const { customerInfo: info } = await Purchases.getCustomerInfo();
        setCustomerInfo({
          activeSubscriptions: info.activeSubscriptions,
          entitlements: Object.fromEntries(
            Object.entries(info.entitlements.active).map(([k, v]) => [
              k,
              {
                isActive: true,
                productIdentifier: v.productIdentifier,
              },
            ])
          ),
        });
      } catch (err) {
        console.error("[RevenueCat] Init error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize purchases"
        );
      }
    };

    initRC();
  }, [isNative, currentUser?.id]);

  const purchaseTier = useCallback(
    async (tier: RCTier): Promise<{ success: boolean; error?: string }> => {
      if (!isNative || !isConfigured) {
        return {
          success: false,
          error: "Native purchases not available on this platform",
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        const productId = RC_PRODUCTS[tier];

        // Fetch offerings to find the package
        const { current } = await Purchases.getOfferings();
        if (!current) {
          return { success: false, error: "No offerings available" };
        }

        const pkg = current.availablePackages.find(
          p => p.product.identifier === productId
        );

        if (!pkg) {
          return {
            success: false,
            error: `Product ${productId} not found in offerings`,
          };
        }

        const { customerInfo: info } = await Purchases.purchasePackage({
          aPackage: pkg,
        });
        setCustomerInfo({
          activeSubscriptions: info.activeSubscriptions,
          entitlements: Object.fromEntries(
            Object.entries(info.entitlements.active).map(([k, v]) => [
              k,
              {
                isActive: true,
                productIdentifier: v.productIdentifier,
              },
            ])
          ),
        });

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Purchase failed";
        // PurchasesErrorCode.purchaseCancelledError — user cancelled, not an error
        if (msg.includes("cancelled") || msg.includes("cancel")) {
          return { success: false, error: "Purchase cancelled" };
        }
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [isNative, isConfigured]
  );

  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isNative || !isConfigured) {
      return { success: false, error: "Native purchases not available" };
    }

    setIsLoading(true);
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo: info } = await Purchases.restorePurchases();
      setCustomerInfo({
        activeSubscriptions: info.activeSubscriptions,
        entitlements: Object.fromEntries(
          Object.entries(info.entitlements.active).map(([k, v]) => [
            k,
            {
              isActive: true,
              productIdentifier: v.productIdentifier,
            },
          ])
        ),
      });
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Restore failed";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [isNative, isConfigured]);

  // Determine active tier from customer info
  const activeTier: RCTier | null = (() => {
    if (!customerInfo) return null;
    for (const [tier, productId] of Object.entries(RC_PRODUCTS) as [
      RCTier,
      string,
    ][]) {
      if (customerInfo.activeSubscriptions.includes(productId)) return tier;
    }
    return null;
  })();

  return {
    isNative,
    isConfigured,
    customerInfo,
    isLoading,
    error,
    purchaseTier,
    restorePurchases,
    hasActiveSubscription: (customerInfo?.activeSubscriptions.length ?? 0) > 0,
    activeTier,
  };
}
