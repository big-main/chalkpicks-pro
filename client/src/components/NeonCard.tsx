import React from "react";

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "premium" | "accent";
  interactive?: boolean;
}

/**
 * Premium neon-styled card component with glassmorphism effect.
 * Supports multiple visual variants and interactive hover states.
 */
export default function NeonCard({
  children,
  className = "",
  style = {},
  variant = "default",
  interactive = true,
}: NeonCardProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "rgba(12, 12, 28, 0.85)",
      border: "1px solid rgba(0, 255, 136, 0.12)",
      boxShadow: "0 0 20px rgba(0,255,136,0.02)",
    },
    premium: {
      background: "linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,212,255,0.03) 100%)",
      border: "1px solid rgba(0, 255, 136, 0.25)",
      boxShadow: "0 0 30px rgba(0,255,136,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    accent: {
      background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(0,212,255,0.04) 100%)",
      border: "1px solid rgba(168,85,247,0.2)",
      boxShadow: "0 0 25px rgba(168,85,247,0.05)",
    },
  };

  const baseStyle = variantStyles[variant];

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLDivElement;
    el.style.borderColor = variant === "premium" ? "rgba(0,255,136,0.5)" : "rgba(0,255,136,0.3)";
    el.style.boxShadow =
      variant === "premium"
        ? "0 0 40px rgba(0,255,136,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
        : "0 0 20px rgba(0,255,136,0.12)";
    el.style.transform = "translateY(-2px)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLDivElement;
    const borderColor = typeof baseStyle.border === "string" ? baseStyle.border : "rgba(0,255,136,0.12)";
    el.style.borderColor = borderColor;
    el.style.boxShadow = (baseStyle.boxShadow as string) || "none";
    el.style.transform = "translateY(0)";
  };

  return (
    <div
      className={`relative overflow-hidden rounded-md transition-all duration-300 ${className}`}
      style={{
        ...baseStyle,
        backdropFilter: "blur(12px)",
        ...style,
      }}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      {children}
    </div>
  );
}
