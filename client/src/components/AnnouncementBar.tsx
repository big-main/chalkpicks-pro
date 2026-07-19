import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, CheckCircle, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const TYPE_STYLES = {
  info: {
    bar: "bg-blue-600 text-white",
    icon: Info,
  },
  warning: {
    bar: "bg-amber-500 text-white",
    icon: AlertTriangle,
  },
  success: {
    bar: "bg-emerald-600 text-white",
    icon: CheckCircle,
  },
  promo: {
    bar: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
    icon: Tag,
  },
};

export function AnnouncementBar() {
  const { data: announcements } = trpc.notifications.getActiveAnnouncements.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_announcements");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const dismiss = (id: number) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem("dismissed_announcements", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const visible = (announcements ?? []).filter((a) => !dismissed.has(a.id));

  if (!visible.length) return null;

  // Show only the first active announcement
  const announcement = visible[0];
  const styles = TYPE_STYLES[announcement.type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.info;
  const Icon = styles.icon;

  return (
    <div className={cn("w-full py-2 px-4 flex items-center justify-center gap-3 text-sm font-medium relative z-50", styles.bar)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-center max-w-2xl">
        {announcement.title}
        {announcement.body && announcement.body !== announcement.title && (
          <span className="ml-1 opacity-90">— {announcement.body}</span>
        )}
        {announcement.ctaText && announcement.ctaUrl && (
          <a
            href={announcement.ctaUrl}
            className="ml-2 underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
          >
            {announcement.ctaText} →
          </a>
        )}
      </span>
      <button
        onClick={() => dismiss(announcement.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
