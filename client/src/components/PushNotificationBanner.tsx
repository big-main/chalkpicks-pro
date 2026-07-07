import { Bell, BellOff, X } from "lucide-react";
import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function PushNotificationBanner() {
  const { isAuthenticated } = useAuth();
  const { state, subscribe, unsubscribe, isSupported, isSubscribed } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("push_banner_dismissed") === "true";
  });

  // Don't show if not authenticated, not supported, already subscribed, or dismissed
  if (!isAuthenticated || !isSupported || isSubscribed || dismissed || state === "denied") {
    return null;
  }

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success("Push notifications enabled! You'll get alerts for high-confidence picks.");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push_banner_dismissed", "true");
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(57,255,20,0.04) 0%, rgba(99,102,241,0.04) 100%)",
        border: "1px solid rgba(57,255,20,0.12)",
      }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
            style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)" }}
          >
            <Bell className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Never miss a high-confidence pick</p>
            <p className="text-xs text-white/50 mt-0.5">
              Get instant push alerts when our AI finds 80%+ confidence plays
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 text-xs font-bold rounded-lg transition-all hover:scale-105"
            style={{
              background: "#39ff14",
              color: "#0a0a0f",
              boxShadow: "0 0 12px rgba(57,255,20,0.2)",
            }}
          >
            Enable Alerts
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationToggle() {
  const { isAuthenticated } = useAuth();
  const { state, subscribe, unsubscribe, isSupported, isSubscribed, isLoading } = usePushNotifications();

  if (!isAuthenticated || !isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) toast.success("Push notifications disabled");
    } else {
      const success = await subscribe();
      if (success) toast.success("Push notifications enabled!");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all"
      style={{
        background: isSubscribed ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isSubscribed ? "rgba(57,255,20,0.25)" : "rgba(255,255,255,0.08)"}`,
        color: isSubscribed ? "#39ff14" : "rgba(255,255,255,0.5)",
      }}
    >
      {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
      {isSubscribed ? "Alerts On" : "Enable Alerts"}
    </button>
  );
}
