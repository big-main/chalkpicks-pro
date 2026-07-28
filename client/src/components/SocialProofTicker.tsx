import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface WinNotification {
  id: number;
  user: string;
  type: "win" | "streak" | "parlay";
  message: string;
  amount?: string;
  timeAgo: string;
}

// Fallback static data shown before DB data loads
const FALLBACK_WINS: WinNotification[] = [
  { id: 1, user: "Mike R.", type: "win", message: "hit Lakers ML +140", amount: "+$280", timeAgo: "2m ago" },
  { id: 2, user: "Sarah K.", type: "streak", message: "7-game win streak", timeAgo: "5m ago" },
  { id: 3, user: "Jason T.", type: "parlay", message: "3-leg parlay at +340", amount: "+$680", timeAgo: "8m ago" },
  { id: 4, user: "Alex M.", type: "win", message: "hit Chiefs -3.5", amount: "+$450", timeAgo: "12m ago" },
  { id: 5, user: "Chris D.", type: "streak", message: "12-game win streak", timeAgo: "15m ago" },
  { id: 6, user: "Emma L.", type: "parlay", message: "4-leg parlay at +850", amount: "+$1,700", timeAgo: "18m ago" },
  { id: 7, user: "David W.", type: "win", message: "hit Yankees Over 8.5", amount: "+$200", timeAgo: "22m ago" },
  { id: 8, user: "Nicole P.", type: "win", message: "hit Celtics -5.5", amount: "+$550", timeAgo: "25m ago" },
];

const FIRST_NAMES = ["Mike", "Sarah", "Jason", "Alex", "Chris", "Emma", "David", "Nicole", "Ryan", "Lisa", "Jake", "Mia", "Tyler", "Zoe", "Marcus", "Olivia"];
const LAST_INITIALS = ["R.", "K.", "T.", "M.", "D.", "L.", "W.", "P.", "B.", "H.", "S.", "C.", "J.", "A.", "G.", "F."];

function randomUser() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
  return `${first} ${last}`;
}

function timeAgoLabel(createdAt: string | Date) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const iconMap = {
  win: TrendingUp,
  streak: Trophy,
  parlay: Zap,
};

const colorMap = {
  win: "text-[#39ff14]",
  streak: "text-[var(--gold-bright)]",
  parlay: "text-[#39ff14]",
};

export function SocialProofTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch recent settled picks to generate real win notifications
  const { data: recentSettled } = trpc.picks.recentSettled.useQuery(
    { limit: 15 },
    { staleTime: 300_000 }
  );

  const notifications = useMemo<WinNotification[]>(() => {
    const picks = recentSettled?.picks;
    if (!picks || picks.length === 0) return FALLBACK_WINS;
    const wins = picks.filter((p: { result: string }) => p.result === "win");
    if (wins.length < 3) return FALLBACK_WINS;
    return wins.slice(0, 8).map((p: { recommendation: string | null; odds: number | null; createdAt: Date }, i: number) => ({
      id: i + 1,
      user: randomUser(),
      type: "win" as const,
      message: `hit ${p.recommendation ?? "AI pick"}`,
      amount: p.odds && p.odds > 0 ? `+$${Math.round(100 * (p.odds / 100))}` : undefined,
      timeAgo: timeAgoLabel(p.createdAt),
    }));
  }, [recentSettled]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setIsVisible(true);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, [notifications.length]);

  const notification = notifications[currentIndex % notifications.length];
  if (!notification) return null;
  const Icon = iconMap[notification.type];

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-xs">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="glass-card-static px-4 py-3 flex items-center gap-3 shadow-xl"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.2)]`}>
              <Icon className={`w-4 h-4 ${colorMap[notification.type]}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-medium truncate">{notification.user}</span>
                {notification.amount && (
                  <span className="text-[#39ff14] text-sm font-bold">{notification.amount}</span>
                )}
              </div>
              <p className="text-muted-foreground text-xs truncate">{notification.message}</p>
            </div>
            <span className="text-muted-foreground text-[10px] flex-shrink-0">{notification.timeAgo}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
