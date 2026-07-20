import type { ReactNode } from "react";

export function PremiumCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

export function EdgeBadge({ edge }: { edge: number }) {
  const positive = edge > 0;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
      {positive ? "+" : ""}{edge.toFixed(1)}% Edge
    </span>
  );
}
