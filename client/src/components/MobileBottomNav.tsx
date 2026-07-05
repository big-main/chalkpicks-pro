import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Home, TrendingUp, Zap, BarChart3, User, Bell
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home", color: "#39ff14" },
  { path: "/picks", icon: TrendingUp, label: "Picks", color: "#39ff14" },
  { path: "/ev-finder", icon: Zap, label: "+EV", color: "#f0b800" },
  { path: "/performance", icon: BarChart3, label: "Stats", color: "#60a5fa" },
  { path: "/account-settings", icon: User, label: "Account", color: "#a855f7" },
];

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const activeItem = NAV_ITEMS.find((item) => isActive(item.path));
  const activeColor = activeItem?.color ?? "#39ff14";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      {/* Floating pill container */}
      <div className="pointer-events-auto mx-3 mb-3">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-20 transition-all duration-500"
          style={{ background: activeColor }}
        />

        {/* Main bar */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "rgba(6, 6, 14, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: `0 -2px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          }}
        >
          {/* Top accent line that follows active color */}
          <div
            className="h-[1px] w-full transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeColor}50, transparent)`,
            }}
          />

          {/* Nav items */}
          <div className="flex items-center justify-around px-1 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const showBadge = item.path === "/account-settings" && notifCount && notifCount.count > 0;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[56px] rounded-xl"
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {/* Active background pill */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="bottomNavActivePill"
                        className="absolute inset-0 rounded-xl"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                          background: `${item.color}10`,
                          border: `1px solid ${item.color}20`,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon container */}
                  <div className="relative">
                    <motion.div
                      animate={active ? {
                        filter: `drop-shadow(0 0 6px ${item.color}80)`,
                      } : {
                        filter: "none",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon
                        className="w-[22px] h-[22px] transition-colors duration-300"
                        style={{ color: active ? item.color : "rgba(255,255,255,0.35)" }}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                    </motion.div>

                    {/* Notification badge */}
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: "#ff3b3b", boxShadow: "0 0 6px rgba(255,59,59,0.6)" }}
                      >
                        {notifCount!.count > 9 ? "9+" : notifCount!.count}
                      </motion.span>
                    )}
                  </div>

                  {/* Label */}
                  <motion.span
                    animate={{ color: active ? item.color : "rgba(255,255,255,0.3)" }}
                    transition={{ duration: 0.25 }}
                    className="text-[10px] font-semibold tracking-wide leading-none"
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
