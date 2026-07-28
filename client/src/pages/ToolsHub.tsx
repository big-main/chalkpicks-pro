import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Calculator, DollarSign, Shield, Layers, Target, TrendingUp, Sigma, Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  {
    href: "/tools/odds-calculator",
    label: "Odds Calculator",
    icon: Calculator,
    desc: "Convert American, decimal, and fractional odds instantly. Calculate implied probability and payout.",
    color: "#39ff14",
  },
  {
    href: "/tools/roi-calculator",
    label: "ROI Calculator",
    icon: DollarSign,
    desc: "Calculate return on investment, profit/loss, and long-term performance across your betting history.",
    color: "#f0b800",
  },
  {
    href: "/tools/bankroll-manager",
    label: "Bankroll Manager",
    icon: Shield,
    desc: "Set unit sizes, track deposits and withdrawals, and visualize bankroll growth over time.",
    color: "#60a5fa",
  },
  {
    href: "/tools/parlay-calculator",
    label: "Parlay Calculator",
    icon: Layers,
    desc: "Add multiple legs and instantly calculate combined odds, true probability, and potential payout.",
    color: "#06b6d4",
  },
  {
    href: "/tools/kelly-calculator",
    label: "Kelly Calculator",
    icon: Target,
    desc: "Calculate optimal bet sizing using the Kelly Criterion to maximize bankroll growth.",
    color: "#a855f7",
  },
  {
    href: "/tools/ev-calculator",
    label: "EV Calculator",
    icon: TrendingUp,
    desc: "Calculate expected value on any bet by comparing market odds to true probabilities.",
    color: "#ec4899",
  },
  {
    href: "/tools/devig-calculator",
    label: "Devig Calculator",
    icon: Sigma,
    desc: "Remove the sportsbook's vig from any line to find the true no-vig probability and fair odds.",
    color: "#14b8a6",
  },
  {
    href: "/bet-calculator",
    label: "Bet Calculator",
    icon: Zap,
    desc: "All-in-one calculator for odds conversion, Kelly Criterion, and bet sizing.",
    color: "#f97316",
  },
];

export default function ToolsHub() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 800px 600px at 50% 30%, rgba(57, 255, 20, 0.08) 0%, rgba(57, 255, 20, 0.02) 40%, transparent 100%)",
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Sports Betting <span className="text-[#39ff14]">Power Tools</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Free calculators and tools for professional sports bettors. Calculate odds, ROI, Kelly Criterion, parlays, and more.
            </p>
          </motion.div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                >
                  <Link href={tool.href}>
                    <a className="group relative h-full block">
                      <div
                        className="relative h-full p-5 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:from-white/8 transition-all duration-300 cursor-pointer overflow-hidden"
                        style={{
                          borderColor: `${tool.color}20`,
                          background: `linear-gradient(135deg, ${tool.color}05 0%, transparent 100%)`,
                        }}
                      >
                        {/* Glow on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, ${tool.color}10 0%, transparent 70%)`,
                          }}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                            style={{ background: `${tool.color}15`, color: tool.color }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <h3 className="font-bold text-white mb-2 text-sm">{tool.label}</h3>
                          <p className="text-xs text-white/50 line-clamp-3 mb-4">{tool.desc}</p>

                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: tool.color }}>
                            Open Tool
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-[rgba(57,255,20,0.02)] to-transparent relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Professional Bettors
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              All tools are free forever. No signup required. Calculate faster, bet smarter.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Calculations",
                desc: "Real-time odds conversion, Kelly sizing, and EV calculations at your fingertips.",
              },
              {
                title: "No Signup Required",
                desc: "Use any tool without creating an account. All calculations are done locally in your browser.",
              },
              {
                title: "Mobile Friendly",
                desc: "Access all tools on your phone at the sportsbook. Optimized for speed and accuracy.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[rgba(57,255,20,0.1)] flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#39ff14]" />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute animate-orb"
            style={{
              bottom: "-30%", left: "30%",
              width: "60vw", height: "60vw",
              background: "radial-gradient(ellipse, rgba(57, 255, 20, 0.06) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Level Up Your Betting?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Get AI-powered picks, real-time +EV alerts, and advanced analytics with a ChalkPicks subscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/picks">
                <Button className="bg-[#39ff14] text-black hover:bg-[#39ff14]/90 px-8 py-3 text-base font-semibold">
                  View Today's Picks
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 py-3 text-base font-semibold">
                  See Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
