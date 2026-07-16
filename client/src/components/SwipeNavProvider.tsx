import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

const NAV_PATHS = ["/", "/picks", "/ev-finder", "/performance", "/account-settings"];
const NAV_LABELS = ["Home", "Picks", "+EV", "Stats", "Account"];
const NAV_COLORS = ["#39ff14", "#39ff14", "#f0b800", "#60a5fa", "#a855f7"];

interface SwipeHint {
  direction: "left" | "right";
  label: string;
  color: string;
}

export function SwipeNavProvider({ children }: { children: React.ReactNode }) {
  // Wire up the swipe gesture hook
  useSwipeNavigation({ threshold: 55, minVelocity: 0.18 });

  const [location] = useLocation();
  const [hint, setHint] = useState<SwipeHint | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const getCurrentIndex = useCallback(() => {
    const exact = NAV_PATHS.indexOf(location);
    if (exact !== -1) return exact;
    for (let i = NAV_PATHS.length - 1; i >= 0; i--) {
      if (NAV_PATHS[i] !== "/" && location.startsWith(NAV_PATHS[i])) return i;
    }
    return -1;
  }, [location]);

  useEffect(() => {
    if (window.innerWidth >= 768) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

      if (dy > 40 || Math.abs(dx) < 20) return;

      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;

      if (dx < -20) {
        // Swiping left → next tab
        const nextIndex = currentIndex + 1;
        if (nextIndex < NAV_PATHS.length) {
          setHint({ direction: "left", label: NAV_LABELS[nextIndex], color: NAV_COLORS[nextIndex] });
        }
      } else if (dx > 20) {
        // Swiping right → prev tab
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          setHint({ direction: "right", label: NAV_LABELS[prevIndex], color: NAV_COLORS[prevIndex] });
        }
      }
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 400);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, [getCurrentIndex]);

  // Hide hint when location changes (swipe completed)
  useEffect(() => {
    setHint(null);
  }, [location]);

  return (
    <>
      {children}

      {/* Swipe hint overlay — mobile only */}
      <AnimatePresence>
        {hint && (
          <motion.div
            key={`hint-${hint.direction}`}
            initial={{ opacity: 0, x: hint.direction === "left" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: hint.direction === "left" ? 20 : -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[60] md:hidden pointer-events-none"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              [hint.direction === "left" ? "right" : "left"]: 12,
            }}
          >
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{
                background: `${hint.color}12`,
                border: `1px solid ${hint.color}30`,
                color: hint.color,
                backdropFilter: "blur(12px)",
                boxShadow: `0 0 20px ${hint.color}20`,
              }}
            >
              {hint.direction === "right" && <ChevronLeft className="w-3.5 h-3.5" />}
              <span>{hint.label}</span>
              {hint.direction === "left" && <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
