import { useEffect, useRef, useState } from "react";

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

/**
 * Animated confidence bar that smoothly fills from 0 → score on mount.
 * Color: green ≥80%, amber 65–79%, red <65%.
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

  useEffect(() => {
    // Reset to 0 first so re-mounts re-animate
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
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`font-bold ${textColor}`}>{score}%</span>
        </div>
      )}
      <div className={`${height} bg-secondary rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
