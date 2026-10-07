import { lazy, Suspense, useEffect, useState } from "react";

const WebMCPTools = lazy(() =>
  import("@/components/WebMCPTools").then(m => ({ default: m.WebMCPTools }))
);
const SocialProofTicker = lazy(() =>
  import("@/components/SocialProofTicker").then(m => ({
    default: m.SocialProofTicker,
  }))
);
const MobileBottomNav = lazy(() =>
  import("@/components/MobileBottomNav").then(m => ({
    default: m.MobileBottomNav,
  }))
);
const AiChatWidget = lazy(() =>
  import("@/components/AiChatWidget").then(m => ({ default: m.AiChatWidget }))
);
const ExitIntentPopup = lazy(() => import("@/components/ExitIntentPopup"));

export default function DeferredGlobalWidgets() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(enable, { timeout: 2500 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const id = globalThis.setTimeout(enable, 1200);
    return () => globalThis.clearTimeout(id);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <WebMCPTools />
      <SocialProofTicker />
      <MobileBottomNav />
      <AiChatWidget />
      <ExitIntentPopup />
    </Suspense>
  );
}
