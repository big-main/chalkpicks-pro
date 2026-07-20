import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";

export function LiveResultsTicker() {
  const { data } = trpc.picks.recentSettled.useQuery({ limit: 10 }, {
    refetchInterval: 60000,
  });

  if (!data?.picks || data.picks.length === 0) return null;

  const results = data.picks;
  const wins = results.filter(p => p.result === "win").length;
  const losses = results.filter(p => p.result === "loss").length;

  return (
    <section className="py-3 border-b border-white/5 bg-[rgba(57,255,20,0.02)] overflow-hidden">
      <div className="container">
        <div className="flex items-center gap-4">
          {/* Record badge */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="live-dot" />
            <span className="text-xs font-mono font-bold text-white/80">
              Recent: <span className="text-[#39ff14]">{wins}W</span>-<span className="text-red-400">{losses}L</span>
            </span>
          </div>

          {/* Scrolling ticker */}
          <div className="flex-1 overflow-hidden relative">
            <motion.div
              className="flex gap-4 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...results, ...results].map((pick, i) => {
                const isWin = pick.result === "win";
                const isPush = pick.result === "push";
                return (
                  <div
                    key={`${pick.id}-${i}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5"
                  >
                    {isWin ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#39ff14]" />
                    ) : isPush ? (
                      <Minus className="w-3.5 h-3.5 text-yellow-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="text-xs text-white/60">
                      {pick.homeTeam} vs {pick.awayTeam}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isWin ? "text-[#39ff14]" : isPush ? "text-yellow-400" : "text-red-400"}`}>
                      {isWin ? "W" : isPush ? "P" : "L"}
                    </span>
                    <span className="text-xs text-white/40">
                      ({(pick.odds ?? 0) > 0 ? "+" : ""}{pick.odds ?? "-"})
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Link to track record */}
          <Link href="/performance" className="flex-shrink-0">
            <span className="text-xs text-primary hover:text-primary/80 font-medium hidden sm:inline">
              Full Record →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
