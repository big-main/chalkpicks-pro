import React from "react";

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "premium" | "accent" | "gold" | "blue" | "red";
  interactive?: boolean;
}

/**
 * Premium broadcast-style card — ChalkPicks 5-color brand system.
 * dark/gold/green/red/blue — high contrast sports analytics aesthetic.
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
      background: "linear-gradient(145deg, rgba(18,20,30,0.95) 0%, rgba(13,15,20,0.98) 100%)",
      border: "1px solid rgba(212,160,23,0.15)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
    },
    premium: {
      background: "linear-gradient(145deg, rgba(20,22,32,0.97) 0%, rgba(13,15,20,0.99) 100%)",
      border: "1px solid rgba(57,255,20,0.3)",
      boxShadow: "0 4px 32px rgba(57,255,20,0.08), 0 0 0 1px rgba(57,255,20,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    accent: {
      background: "linear-gradient(145deg, rgba(22,18,10,0.97) 0%, rgba(13,15,20,0.99) 100%)",
      border: "1px solid rgba(240,184,0,0.3)",
      boxShadow: "0 4px 32px rgba(212,160,23,0.1), inset 0 1px 0 rgba(240,184,0,0.06)",
    },
    gold: {
      background: "linear-gradient(145deg, rgba(24,20,8,0.97) 0%, rgba(13,15,20,0.99) 100%)",
      border: "1px solid rgba(240,184,0,0.4)",
      boxShadow: "0 4px 32px rgba(212,160,23,0.15), 0 0 60px rgba(212,160,23,0.05), inset 0 1px 0 rgba(240,184,0,0.08)",
    },
    blue: {
      background: "linear-gradient(145deg, rgba(10,16,30,0.97) 0%, rgba(13,15,20,0.99) 100%)",
      border: "1px solid rgba(59,130,246,0.3)",
      boxShadow: "0 4px 32px rgba(59,130,246,0.1), inset 0 1px 0 rgba(96,165,250,0.06)",
    },
    red: {
      background: "linear-gradient(145deg, rgba(24,8,8,0.97) 0%, rgba(13,15,20,0.99) 100%)",
      border: "1px solid rgba(255,59,59,0.3)",
      boxShadow: "0 4px 32px rgba(255,59,59,0.1), inset 0 1px 0 rgba(255,107,107,0.06)",
    },
  };

  const hoverColors: Record<string, { border: string; shadow: string }> = {
    default: {
      border: "rgba(240,184,0,0.4)",
      shadow: "0 8px 40px rgba(212,160,23,0.12), 0 0 0 1px rgba(240,184,0,0.08)",
    },
    premium: {
      border: "rgba(57,255,20,0.55)",
      shadow: "0 8px 40px rgba(57,255,20,0.15), 0 0 0 1px rgba(57,255,20,0.08)",
    },
    accent: {
      border: "rgba(240,184,0,0.55)",
      shadow: "0 8px 40px rgba(212,160,23,0.18), 0 0 0 1px rgba(240,184,0,0.1)",
    },
    gold: {
      border: "rgba(240,184,0,0.65)",
      shadow: "0 8px 40px rgba(212,160,23,0.25), 0 0 60px rgba(212,160,23,0.08)",
    },
    blue: {
      border: "rgba(96,165,250,0.55)",
      shadow: "0 8px 40px rgba(59,130,246,0.18), 0 0 0 1px rgba(96,165,250,0.08)",
    },
    red: {
      border: "rgba(255,107,107,0.55)",
      shadow: "0 8px 40px rgba(255,59,59,0.18), 0 0 0 1px rgba(255,107,107,0.08)",
    },
  };

  const baseStyle = variantStyles[variant];
  const hoverStyle = hoverColors[variant];

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLDivElement;
    el.style.borderColor = hoverStyle.border;
    el.style.boxShadow = hoverStyle.shadow;
    el.style.transform = "translateY(-2px)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLDivElement;
    el.style.borderColor = "";
    el.style.boxShadow = (baseStyle.boxShadow as string) || "none";
    el.style.transform = "translateY(0)";
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-300 ${className}`}
      style={{
        ...baseStyle,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        ...style,
      }}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      {children}
    </div>
  );
}
