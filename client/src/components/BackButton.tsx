import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global back button — shows on all pages except homepage.
 * Uses browser history when available, falls back to homepage.
 */
export function BackButton() {
  const [location, navigate] = useLocation();

  // Don't show on homepage
  if (location === "/") return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="fixed top-20 left-4 z-40 gap-1.5 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity backdrop-blur-sm bg-background/50 border border-border/30 shadow-sm md:top-24 md:left-6"
      style={{ color: "rgba(200,200,220,0.8)" }}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}

export default BackButton;
