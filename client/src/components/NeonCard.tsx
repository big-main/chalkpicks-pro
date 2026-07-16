import React from "react";

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "premium" | "accent" | "gold" | "blue" | "red";
  interactive?: boolean;
  glow?: boolean;
}

/**
 * Premium glassmorphism card — ChalkPicks luxury design system.
 * Refined glass effect with subtle borders and depth.
 */
export default function NeonCard({
  children,
  className = "",
  style = {},
  variant = "default",
  interactive = true,
  glow = false,
}: NeonCardProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
    },
    premium: {
      background: "linear-gradient(135deg, rgba(57, 255, 20, 0.03) 0%, rgba(255, 255, 255, 0.02) 100%)",
      border: "1px solid rgba(57, 255, 20, 0.15)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(57, 255, 20, 0.03)",
    },
    accent: {
      background: "linear-gradient(135deg, rgba(212, 160, 23, 0.03) 0%, rgba(255, 255, 255, 0.02) 100%)",
      border: "1px solid rgba(212, 160, 23, 0.15)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(212, 160, 23, 0.03)",
    },
    gold: {
      background: "linear-gradient(135deg, rgba(212, 160, 23, 0.05) 0%, rgba(240, 184, 0, 0.02) 100%)",
      border: "1px solid rgba(240, 184, 0, 0.25)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(212, 160, 23, 0.05)",
    },
    blue: {
      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(255, 255, 255, 0.02) 100%)",
      border: "1px solid rgba(59, 130, 246, 0.15)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.03)",
    },
    red: {
      background: "linear-gradient(135deg, rgba(255, 59, 59, 0.03) 0%, rgba(255, 255, 255, 0.02) 100%)",
      border: "1px solid rgba(255, 59, 59, 0.15)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 59, 59, 0.03)",
    },
  };

  const hoverColors: Record<string, { border: string; shadow: string }> = {
    default: {
      border: "rgba(255, 255, 255, 0.15)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(57, 255, 20, 0.03)",
    },
    premium: {
      border: "rgba(57, 255, 20, 0.3)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(57, 255, 20, 0.08)",
    },
    accent: {
      border: "rgba(212, 160, 23, 0.3)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(212, 160, 23, 0.08)",
    },
    gold: {
      border: "rgba(240, 184, 0, 0.45)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 50px rgba(212, 160, 23, 0.12)",
    },
    blue: {
      border: "rgba(96, 165, 250, 0.3)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(59, 130, 246, 0.08)",
    },
    red: {
      border: "rgba(255, 107, 107, 0.3)",
      shadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 59, 59, 0.08)",
    },
  };

  const baseStyle = variantStyles[variant];
  const hoverStyle = hoverColors[variant];

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = e.currentTarget as HTMLDivElement;
    el.style.borderColor = hoverStyle.border;
    el.style.boxShadow = hoverStyle.shadow;
    el.style.transform = "translateY(-4px)";
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
      className={`relative overflow-hidden rounded-xl transition-all duration-300 ${className}`}
      style={{
        ...baseStyle,
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        ...(glow && { animation: "glowPulse 3s infinite" }),
        ...style,
      }}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      {children}
    </div>
  );
}
