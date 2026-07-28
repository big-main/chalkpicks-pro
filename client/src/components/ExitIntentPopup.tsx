import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { X, Target, Zap, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const SESSION_KEY = "exit_intent_shown";

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  return { mins, secs, remaining };
}

export default function ExitIntentPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const triggered = useRef(false);
  const { mins, secs } = useCountdown(900); // 15 minutes

  const isSubscribed = !!(user as any)?.subscriptionTier && (user as any)?.subscriptionTier !== "free";

  useEffect(() => {
    if (isSubscribed) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered.current) return;
      if (e.clientY < 10) {
        triggered.current = true;
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isSubscribed]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(57,255,20,0.4); } 50% { box-shadow: 0 0 0 12px rgba(57,255,20,0); } }
      `}</style>

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 50%, #0a0f0a 100%)",
          border: "1px solid rgba(57,255,20,0.3)",
          boxShadow: "0 0 60px rgba(57,255,20,0.15), inset 0 0 60px rgba(57,255,20,0.02)",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #39ff14, transparent)" }} />

        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{
              background: "rgba(57,255,20,0.1)",
              border: "2px solid rgba(57,255,20,0.3)",
              animation: "pulse-green 2s infinite",
            }}
          >
            <Target className="w-8 h-8 text-[#39ff14]" />
          </div>

          {/* Headline */}
          <div className="text-2xl mb-1">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Wait! Don't Leave<br />Empty-Handed
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Get your first month of <span className="text-[#39ff14] font-semibold">ChalkPicks Pro</span> for just{" "}
            <span className="text-white font-bold">$19.99</span> — AI picks, +EV finder, sharp money alerts, and more.
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Offer expires in</span>
            <div
              className="px-3 py-1 rounded-lg font-mono font-bold text-lg text-white"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
            >
              {mins}:{secs}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-left">
            {[
              "AI-powered daily picks",
              "+EV bet finder",
              "Sharp money alerts",
              "Line movement tracker",
              "Kelly calculator",
              "Unlimited access",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="w-3 h-3 text-[#39ff14] flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link href="/pricing" onClick={() => setVisible(false)}>
            <Button
              className="w-full h-12 text-base font-bold mb-3"
              style={{
                background: "linear-gradient(135deg, #39ff14, #32e012)",
                color: "#000",
                boxShadow: "0 0 20px rgba(57,255,20,0.4)",
              }}
            >
              Claim Offer Now →
            </Button>
          </Link>

          <button
            onClick={() => setVisible(false)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            No thanks, I'll miss out on winning picks
          </button>
        </div>
      </div>
    </div>
  );
}
