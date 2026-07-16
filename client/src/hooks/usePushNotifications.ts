import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type PushState = "unsupported" | "denied" | "prompt" | "subscribed" | "unsubscribed" | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: statusData, refetch: refetchStatus } = trpc.push.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const subscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => refetchStatus(),
  });
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation({
    onSuccess: () => refetchStatus(),
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (!isAuthenticated) {
      setState("unsubscribed");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setState("denied");
      return;
    }

    if (statusData?.subscribed) {
      setState("subscribed");
    } else {
      setState("unsubscribed");
    }
  }, [isAuthenticated, statusData]);

  const subscribe = useCallback(async () => {
    if (!vapidData?.publicKey) {
      setError("Push notifications not configured");
      return false;
    }

    try {
      setState("loading");
      setError(null);

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setError("Notification permission denied");
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid subscription data");
      }

      // Save to server
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });

      setState("subscribed");
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to subscribe");
      setState("unsubscribed");
      return false;
    }
  }, [vapidData, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    try {
      setState("loading");
      setError(null);

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
      }

      setState("unsubscribed");
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to unsubscribe");
      return false;
    }
  }, [unsubscribeMutation]);

  return {
    state,
    error,
    subscribe,
    unsubscribe,
    isSupported: state !== "unsupported",
    isSubscribed: state === "subscribed",
    isLoading: state === "loading",
  };
}
