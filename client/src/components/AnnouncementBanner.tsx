import { useState } from "react";
import { X, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

interface AnnouncementBannerProps {
  /** Storage key to remember dismissal. Change to force re-show. */
  storageKey?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Gradient style: "green" | "gold" | "purple" | "cyan" */
  variant?: "green" | "gold" | "purple" | "cyan";
  /** Show only after the visitor has already visited the site once. */
  returningUsersOnly?: boolean;
}

const VARIANTS = {
  green: "from-emerald-600/90 via-emerald-500/80 to-teal-600/90",
  gold: "from-amber-600/90 via-yellow-500/80 to-orange-600/90",
  purple: "from-purple-700/90 via-violet-600/80 to-indigo-700/90",
  cyan: "from-cyan-600/90 via-sky-500/80 to-blue-600/90",
};

export default function AnnouncementBanner({
  storageKey = "cp_banner_v1",
  message = "🎉 New: AI picks now include live CLV tracking & steam move alerts.",
  ctaLabel = "Explore Premium",
  ctaHref = "/pricing",
  variant = "green",
  returningUsersOnly = false,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(() => {
    try {
      const hasVisited = localStorage.getItem("cp_site_visited_v1") === "1";
      localStorage.setItem("cp_site_visited_v1", "1");
      const dismissed = localStorage.getItem(storageKey);
      return !dismissed && (!returningUsersOnly || hasVisited);
    } catch {
      return !returningUsersOnly;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage failures; dismissal still applies for this render.
    }
    setVisible(false);
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`w-full overflow-hidden bg-gradient-to-r ${VARIANTS[variant]} backdrop-blur-sm border-b border-white/10 z-50 relative`}
          role="banner"
          aria-live="polite"
        >
          <div className="container flex min-h-9 items-center justify-between gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Zap className="h-3 w-3 flex-shrink-0 text-white sm:h-3.5 sm:w-3.5" />
              <p className="truncate text-[11px] font-medium leading-4 text-white sm:text-xs">
                {message}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              {ctaHref && ctaLabel && (
                <Link
                  href={ctaHref}
                  className="flex items-center gap-0.5 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-white/30 sm:gap-1 sm:px-2.5 sm:text-xs sm:py-1"
                >
                  {ctaLabel}{" "}
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Link>
              )}
              <button
                onClick={dismiss}
                className="rounded p-0.5 text-white/70 transition-colors hover:text-white"
                aria-label="Dismiss banner"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
