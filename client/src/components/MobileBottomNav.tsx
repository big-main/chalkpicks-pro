import { useLocation } from "wouter";
import { Home, TrendingUp, Wrench, BarChart3, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/picks", icon: TrendingUp, label: "Picks" },
  { path: "/tools", icon: Wrench, label: "Tools" },
  { path: "/performance", icon: BarChart3, label: "Stats" },
  { path: "/account", icon: User, label: "Account" },
];

export function MobileBottomNav() {
  const [location, navigate] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-[rgba(8,8,20,0.92)] backdrop-blur-xl border-t border-[rgba(57,255,20,0.08)]" />

      {/* Nav items */}
      <div className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? "text-[#39ff14]" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-[#39ff14]" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
