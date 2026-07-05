import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

const NAV_PATHS = ["/", "/picks", "/ev-finder", "/performance", "/account-settings"];

interface SwipeNavigationOptions {
  /** Minimum horizontal distance (px) to trigger a swipe. Default: 60 */
  threshold?: number;
  /** Maximum vertical drift (px) allowed before cancelling. Default: 80 */
  verticalThreshold?: number;
  /** Minimum swipe velocity (px/ms) required. Default: 0.2 */
  minVelocity?: number;
  /** Whether to fire haptic feedback on swipe (Android). Default: true */
  haptic?: boolean;
  /** Only activate on mobile (max 768px). Default: true */
  mobileOnly?: boolean;
}

export function useSwipeNavigation(options: SwipeNavigationOptions = {}) {
  const {
    threshold = 60,
    verticalThreshold = 80,
    minVelocity = 0.2,
    haptic = true,
    mobileOnly = true,
  } = options;

  const [location, navigate] = useLocation();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwiping = useRef(false);

  const getCurrentIndex = useCallback(() => {
    const exact = NAV_PATHS.indexOf(location);
    if (exact !== -1) return exact;
    // Match prefix for nested routes (e.g. /picks/123 → /picks)
    for (let i = NAV_PATHS.length - 1; i >= 0; i--) {
      if (NAV_PATHS[i] !== "/" && location.startsWith(NAV_PATHS[i])) return i;
    }
    return -1;
  }, [location]);

  useEffect(() => {
    if (mobileOnly && window.innerWidth >= 768) return;

    const onTouchStart = (e: TouchEvent) => {
      // Ignore multi-touch
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      isSwiping.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
      // If vertical drift is too large, cancel
      if (dy > verticalThreshold) {
        touchStartRef.current = null;
        return;
      }
      // Mark as horizontal swipe in progress to suppress vertical scroll
      if (Math.abs(dx) > 12 && dy < 30) {
        isSwiping.current = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      const dt = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(dx) / dt;

      touchStartRef.current = null;
      isSwiping.current = false;

      // Reject if vertical drift too large
      if (dy > verticalThreshold) return;
      // Reject if too short or too slow
      if (Math.abs(dx) < threshold && velocity < minVelocity) return;
      // Need at least threshold OR sufficient velocity
      if (Math.abs(dx) < threshold * 0.4 && velocity < minVelocity * 2) return;

      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;

      const direction = dx < 0 ? 1 : -1; // swipe left = next, swipe right = prev
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= NAV_PATHS.length) return;

      // Haptic feedback on Android
      if (haptic && "vibrate" in navigator) {
        navigator.vibrate(8);
      }

      navigate(NAV_PATHS[nextIndex]);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [threshold, verticalThreshold, minVelocity, haptic, mobileOnly, getCurrentIndex, navigate]);
}
