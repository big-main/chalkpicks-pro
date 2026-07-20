import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ConfidenceBarProps {
  score: number;
  /** Show label row above the bar. Defaults to true. */
  showLabel?: boolean;
  /** Height class. Defaults to "h-1.5" */
  height?: string;
  /** Extra className on the wrapper div */
  className?: string;
  /** Delay before animation starts (ms). Defaults to 100. */
  delay?: number;
}

function getTooltipText(score: number): string {
  if (score >= 90)
    return `Elite confidence (${score}%) — Our model's strongest signal. Historical win rate on 90%+ picks exceeds 72%. High-conviction play.`;
  if (score >= 80)
    return `High confidence (${score}%) — Strong model agreement across multiple data sources. Recommended unit size: 2–3 units.`;
  if (score >= 65)
    return `Moderate confidence (${score}%) — Positive edge detected but with some uncertainty. Recommended unit size: 1–2 units.`;
  return `Lower confidence (${score}%) — Marginal edge. Proceed with reduced stake or skip. Recommended unit size: 0.5–1 unit.`;
}

/**
 * Animated confidence bar that smoothly fills from 0 → score on mount.
 * Color: green ≥80%, amber 65–79%, red <65%.
 * Tooltip: hover shows explanation of the percentage.
 * Pulse glow: scores ≥90% get a subtle animated glow (strongest picks).
 */
export default function ConfidenceBar({
  score,
  showLabel = true,
  height = "h-1.5",
  className = "",
  delay = 100,
}: ConfidenceBarProps) {
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isElite = score >= 90;

  const color =
    score >= 80
      ? "var(--cp-green, #22c55e)"
      : score >= 65
      ? "var(--cp-gold, #f59e0b)"
      : "var(--cp-red, #ef4444)";

  const textColor =
    score >= 80
      ? "text-green-400"
      : score >= 65
      ? "text-amber-400"
      : "text-red-400";

  const glowColor =
    score >= 80
      ? "rgba(34,197,94,0.45)"
      : score >= 65
      ? "rgba(245,158,11,0.45)"
      : "rgba(239,68,68,0.45)";

  useEffect(() => {
    setWidth(0);
    timerRef.current = setTimeout(() => {
      setWidth(score);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [score, delay]);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-muted-foreground cursor-help select-none">
                Confidence
                <Info className="w-3 h-3 opacity-50" />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs text-xs leading-relaxed"
            >
              {getTooltipText(score)}
            </TooltipContent>
          </Tooltip>
          <span className={`font-bold ${textColor}`}>
            {score}%
            {isElite && (
              <span className="ml-1 text-[10px] font-black tracking-wider text-green-400 animate-pulse">
                ★ TOP PICK
              </span>
            )}
          </span>
        </div>
      )}

      {/* Bar wrapper — pulse glow ring for elite picks */}
      <div
        className={`${height} bg-secondary rounded-full overflow-hidden relative`}
        style={
          isElite
            ? {
                boxShadow: `0 0 8px 2px ${glowColor}`,
                animation: "cp-pulse-glow 2s ease-in-out infinite",
              }
            : undefined
        }
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: isElite ? `0 0 6px 1px ${glowColor}` : undefined,
          }}
        />
      </div>
    </div>
  );
}
