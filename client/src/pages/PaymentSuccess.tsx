import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Trophy, Zap, Sparkles, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function fireConfetti() {
  // First burst — center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#39ff14", "#d4a017", "#ffffff", "#00ff88", "#ffd700"],
  });

  // Second burst — left side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#39ff14", "#d4a017", "#ffffff"],
    });
  }, 200);

  // Third burst — right side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#39ff14", "#d4a017", "#ffffff"],
    });
  }, 400);

  // Stars burst
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 100,
      origin: { y: 0.5 },
      shapes: ["star"],
      colors: ["#ffd700", "#39ff14"],
      scalar: 1.2,
    });
  }, 600);
}

export default function PaymentSuccess() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activated, setActivated] = useState(false);
  const confettiFired = useRef(false);

  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id") ?? "";
  const tier = (searchParams.get("tier") ?? "monthly") as "daily" | "monthly" | "yearly";

  const activate = trpc.subscription.activate.useMutation({
    onSuccess: () => {
      setActivated(true);
      toast.success("Subscription activated! Welcome to ChalkPicks Pro.");
    },
    onError: () => {
      setActivated(true); // Still show success UI
    },
  });

  useEffect(() => {
    if (isAuthenticated && sessionId && !activated && !activate.isPending) {
      activate.mutate({ sessionId, tier });
    }
  }, [isAuthenticated, sessionId]);

  // Fire confetti when activation completes
  useEffect(() => {
    if (activated && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
  }, [activated]);

  const tierLabels: Record<string, string> = {
    daily: "Basic",
    monthly: "Pro",
    yearly: "Elite",
  };

  const tierIcons: Record<string, React.ReactNode> = {
    daily: <Zap className="w-6 h-6 text-yellow-400" />,
    monthly: <Crown className="w-6 h-6 text-brand-green" />,
    yearly: <Sparkles className="w-6 h-6 text-brand-gold" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="container max-w-lg py-12 text-center">
          {/* Animated success icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: "rgba(57,255,20,0.3)" }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(57,255,20,0.15), rgba(212,160,23,0.1))",
                border: "2px solid rgba(57,255,20,0.4)",
                boxShadow: "0 0 40px rgba(57,255,20,0.2), inset 0 0 20px rgba(57,255,20,0.05)",
              }}
            >
              <CheckCircle2 className="w-12 h-12 text-brand-green" />
            </div>
          </div>

          {/* Tier badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.25)",
            }}
          >
            {tierIcons[tier]}
            <span className="text-sm font-bold text-brand-green">{tierLabels[tier] ?? "Premium"} Activated</span>
          </div>

          <h1 className="font-display text-4xl tracking-wider mb-3">
            WELCOME TO <span className="text-gold-gradient">PRO</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Your edge starts now. Let's find some winners.
          </p>

          {/* Features unlocked */}
          <Card className="bg-card border-border mb-8 overflow-hidden">
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #39ff14, #d4a017, #39ff14)" }} />
            <CardContent className="p-6">
              <p className="text-xs font-bold tracking-wider text-brand-green mb-4">FEATURES UNLOCKED</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🎯", label: "AI Picks", sub: "Unlocked" },
                  { icon: "📊", label: "Analytics", sub: tier !== "daily" ? "Full Access" : "Basic" },
                  { icon: "🔔", label: "Alerts", sub: "Active" },
                  { icon: "⚡", label: "+EV Finder", sub: tier !== "daily" ? "Unlocked" : "N/A" },
                  { icon: "📈", label: "Backtesting", sub: tier !== "daily" ? "Unlocked" : "N/A" },
                  { icon: "🏆", label: "Leaderboard", sub: "Unlocked" },
                ].map(f => (
                  <div key={f.label} className="text-center rounded-lg p-3 transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="text-xs font-semibold text-foreground">{f.label}</div>
                    <div className="text-[10px] font-medium text-brand-green">{f.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/picks">
              <Button
                className="font-bold text-sm px-6 py-5"
                style={{
                  background: "#39ff14",
                  color: "#0a0a0f",
                  boxShadow: "0 0 20px rgba(57,255,20,0.3)",
                }}
              >
                <Zap className="w-4 h-4 mr-2" /> View Today's Picks
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-border text-foreground px-6 py-5">
                <Trophy className="w-4 h-4 mr-2" /> My Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Subtle reminder */}
          <p className="text-xs text-muted-foreground mt-8">
            A confirmation email has been sent to your inbox. Manage your subscription anytime in Account Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
