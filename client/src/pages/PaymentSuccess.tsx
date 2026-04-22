import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Trophy, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activated, setActivated] = useState(false);

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

  const tierLabels: Record<string, string> = {
    daily: "Daily Pass",
    monthly: "Monthly Pro",
    yearly: "Annual Elite",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="container max-w-lg py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>

          <h1 className="font-display text-4xl tracking-wider mb-3">
            WELCOME TO <span className="text-gold-gradient">PRO</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Your <strong className="text-foreground">{tierLabels[tier] ?? "Premium"}</strong> subscription is now active. Time to find your edge.
          </p>

          <Card className="bg-card border-border mb-6">
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🎯", label: "AI Picks", sub: "Unlocked" },
                  { icon: "📊", label: "Backtesting", sub: tier !== "daily" ? "Unlocked" : "N/A" },
                  { icon: "🔔", label: "Daily Alerts", sub: "Active" },
                ].map(f => (
                  <div key={f.label} className="text-center bg-secondary/50 rounded-lg p-3">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="text-xs font-semibold text-foreground">{f.label}</div>
                    <div className="text-xs text-accent">{f.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/picks">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold glow-gold">
                <Zap className="w-4 h-4 mr-2" /> View Today's Picks
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-border text-foreground">
                <Trophy className="w-4 h-4 mr-2" /> My Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
