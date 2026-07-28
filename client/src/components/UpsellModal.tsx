import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lock, Zap, CheckCircle2, Crown, Star } from "lucide-react";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier?: string;
}

const PLANS = [
  {
    name: "Basic",
    price: "$9.99",
    period: "/mo",
    color: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
    icon: Star,
    features: ["5 AI picks/day", "Basic EV calculator", "Email alerts"],
    cta: "Get Basic",
    ctaClass: "border-blue-400/30 text-blue-400 hover:bg-blue-400/10",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/mo",
    color: "text-[#39ff14]",
    border: "border-[#39ff14]/30",
    bg: "bg-[#39ff14]/5",
    icon: Zap,
    features: ["Unlimited AI picks", "+EV finder", "Sharp money alerts"],
    cta: "Get Pro",
    ctaClass: "bg-[#39ff14] hover:bg-[#32e012] text-black font-bold",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Elite",
    price: "$59.99",
    period: "/yr",
    color: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
    icon: Crown,
    features: ["Everything in Pro", "Strategy builder", "Priority support"],
    cta: "Get Elite",
    ctaClass: "border-amber-400/30 text-amber-400 hover:bg-amber-400/10",
    variant: "outline" as const,
  },
];

export default function UpsellModal({ isOpen, onClose, featureName, requiredTier = "Pro" }: UpsellModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0f0a 0%, #0d1a0d 50%, #0a0f0a 100%)",
          border: "1px solid rgba(57,255,20,0.2)",
          boxShadow: "0 0 60px rgba(57,255,20,0.1)",
        }}
      >
        {/* Top accent */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #39ff14, transparent)" }} />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          {/* Lock icon */}
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
            <Lock className="w-7 h-7 text-[#39ff14]" />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Unlock {featureName}</h2>
          <p className="text-slate-400 text-sm mb-6">
            This feature requires a <span className="text-[#39ff14] font-semibold">{requiredTier}</span> subscription. Choose a plan to get access.
          </p>

          {/* Plans */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative p-4 rounded-xl border ${plan.border} ${plan.bg} text-left`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-[#39ff14] text-black border-0 px-2">
                      Popular
                    </Badge>
                  )}
                  <Icon className={`w-4 h-4 ${plan.color} mb-2`} />
                  <p className={`text-sm font-bold ${plan.color}`}>{plan.name}</p>
                  <p className="text-white font-bold text-lg leading-none">
                    {plan.price}<span className="text-xs text-slate-500 font-normal">{plan.period}</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                        <CheckCircle2 className={`w-3 h-3 ${plan.color} mt-0.5 flex-shrink-0`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" onClick={onClose}>
                    <Button size="sm" variant={plan.variant} className={`w-full mt-3 text-xs h-8 ${plan.ctaClass}`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
