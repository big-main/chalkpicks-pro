import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface RealtimeStat {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  color: string;
}

export default function RealtimeStats() {
  const [stats, setStats] = useState<RealtimeStat[]>([
    { label: "Win Rate", value: "92%", change: "+2.1%", changeType: "up", color: "#00ff88" },
    { label: "Avg ROI", value: "+18.4%", change: "+0.8%", changeType: "up", color: "#00d4ff" },
    { label: "Active Users", value: "12,847", change: "+342", changeType: "up", color: "#a855f7" },
    { label: "Picks Today", value: "847", change: "+89", changeType: "up", color: "#00ff88" },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) =>
        prev.map((stat) => {
          // Randomly update values slightly
          if (Math.random() > 0.7) {
            const numValue = parseFloat(stat.value.replace(/[^0-9.-]/g, ""));
            const change = (Math.random() - 0.5) * 0.5;
            const newValue = numValue + change;
            const changeStr = change > 0 ? `+${change.toFixed(1)}` : `${change.toFixed(1)}`;
            return {
              ...stat,
              change: changeStr,
              changeType: change > 0 ? "up" : change < 0 ? "down" : "neutral",
            };
          }
          return stat;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-2">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-2 rounded-md transition-all hover:scale-105"
          style={{
            background: `rgba(${stat.color === "#00ff88" ? "0,255,136" : stat.color === "#00d4ff" ? "0,212,255" : "168,85,247"},0.05)`,
            border: `1px solid ${stat.color}33`,
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 truncate">{stat.label}</p>
              <p
                className="text-sm font-bold truncate"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
            {stat.change && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {stat.changeType === "up" ? (
                  <TrendingUp className="w-3 h-3" style={{ color: "#00ff88" }} />
                ) : stat.changeType === "down" ? (
                  <TrendingDown className="w-3 h-3" style={{ color: "#ff6b6b" }} />
                ) : (
                  <Activity className="w-3 h-3" style={{ color: stat.color }} />
                )}
                <span
                  className="text-[10px] font-bold"
                  style={{
                    color: stat.changeType === "up" ? "#00ff88" : stat.changeType === "down" ? "#ff6b6b" : stat.color,
                  }}
                >
                  {stat.change}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
