import { useState, useEffect } from "react";
import { X, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface AnnouncementBannerProps {
  /** Storage key to remember dismissal. Change to force re-show. */
  storageKey?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Gradient style: "green" | "gold" | "purple" | "cyan" */
  variant?: "green" | "gold" | "purple" | "cyan";
}

const VARIANTS = {
  green:  "from-emerald-600/90 via-emerald-500/80 to-teal-600/90",
  gold:   "from-amber-600/90 via-yellow-500/80 to-orange-600/90",
  purple: "from-purple-700/90 via-violet-600/80 to-indigo-700/90",
  cyan:   "from-cyan-600/90 via-sky-500/80 to-blue-600/90",
};

export default function AnnouncementBanner({
  storageKey = "cp_banner_v1",
  message = "🎉 New: AI picks now include live CLV tracking & steam move alerts.",
  ctaLabel = "Explore Premium",
  ctaHref = "/pricing",
  variant = "green",
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={`w-full bg-gradient-to-r ${VARIANTS[variant]} backdrop-blur-sm border-b border-white/10 z-50 relative`}
      role="banner"
    >
      <div className="container flex items-center justify-between gap-3 py-2 px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-white truncate">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {ctaHref && ctaLabel && (
            <Link href={ctaHref}>
              <button className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-full border border-white/30">
                {ctaLabel} <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          )}
          <button
            onClick={dismiss}
            className="text-white/70 hover:text-white transition-colors p-0.5 rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
