import { lazy, Suspense, useEffect, useRef, useState } from "react";

const HorizontalScrollTicker = lazy(
  () => import("@/components/HorizontalScrollTicker")
);

export default function DeferredHomeTicker() {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinelRef} className="min-h-[104px]">
      {visible ? (
        <Suspense
          fallback={
            <div
              className="h-[104px] animate-pulse bg-white/[0.02]"
              aria-hidden="true"
            />
          }
        >
          <HorizontalScrollTicker />
        </Suspense>
      ) : null}
    </div>
  );
}
