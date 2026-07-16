import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, Trophy } from "lucide-react";

interface WinNotification {
  id: number;
  user: string;
  type: "win" | "streak" | "parlay";
  message: string;
  amount?: string;
  timeAgo: string;
}

const SAMPLE_WINS: WinNotification[] = [
  { id: 1, user: "Mike R.", type: "win", message: "hit Lakers ML +140", amount: "+$280", timeAgo: "2m ago" },
  { id: 2, user: "Sarah K.", type: "streak", message: "7-game win streak", timeAgo: "5m ago" },
  { id: 3, user: "Jason T.", type: "parlay", message: "3-leg parlay at +340", amount: "+$680", timeAgo: "8m ago" },
  { id: 4, user: "Alex M.", type: "win", message: "hit Chiefs -3.5", amount: "+$450", timeAgo: "12m ago" },
  { id: 5, user: "Chris D.", type: "streak", message: "12-game win streak", timeAgo: "15m ago" },
  { id: 6, user: "Emma L.", type: "parlay", message: "4-leg parlay at +850", amount: "+$1,700", timeAgo: "18m ago" },
  { id: 7, user: "David W.", type: "win", message: "hit Yankees Over 8.5", amount: "+$200", timeAgo: "22m ago" },
  { id: 8, user: "Nicole P.", type: "win", message: "hit Celtics -5.5", amount: "+$550", timeAgo: "25m ago" },
  { id: 9, user: "Ryan B.", type: "parlay", message: "5-leg SGP at +1200", amount: "+$2,400", timeAgo: "30m ago" },
  { id: 10, user: "Lisa H.", type: "streak", message: "15-game win streak", timeAgo: "35m ago" },
];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SAMPLE_WINS.length);
        setIsVisible(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const notification = SAMPLE_WINS[currentIndex];
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
