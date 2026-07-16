import { motion } from "framer-motion";
import { Crown, Zap, MessageSquare, TrendingUp, Bell, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ElitePlusTier() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "SMS Alerts",
      description: "Real-time SMS notifications for new picks and steam moves",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Priority Picks",
      description: "Access to picks 30 minutes before public release",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "1-on-1 Coaching",
      description: "Weekly strategy calls with professional bettors",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Custom Alerts",
      description: "Set up alerts for specific sports, leagues, and odds ranges",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Exclusive Discord",
      description: "Private community with top 1% of bettors",
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "VIP Support",
      description: "24/7 priority customer support via chat and email",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Elite+ Tier
            </h1>
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-muted-foreground text-lg">
            For serious bettors who want the absolute best edge
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-12"
        >
          <Card className="glass-card border-yellow-400/30 p-8 text-center">
            <p className="text-muted-foreground mb-2">Monthly Subscription</p>
            <p className="text-5xl font-bold text-yellow-400 mb-1">$99</p>
            <p className="text-sm text-muted-foreground mb-6">/month, cancel anytime</p>
            <Button className="w-full btn-premium mb-4">
              Upgrade to Elite+
            </Button>
            <p className="text-xs text-muted-foreground">
              30-day money-back guarantee if not satisfied
            </p>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border-green-400/20 p-6 h-full hover:border-green-400/40 transition-all">
                <div className="text-yellow-400 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Plan Comparison</h2>
          <Card className="glass-card border-green-400/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-400/20">
                    <th className="text-left p-4 text-foreground font-semibold">Feature</th>
                    <th className="text-center p-4 text-foreground font-semibold">Free</th>
                    <th className="text-center p-4 text-foreground font-semibold">Pro</th>
                    <th className="text-center p-4 text-yellow-400 font-semibold">Elite+</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Daily Picks", free: "✓", pro: "✓", elite: "✓" },
                    { feature: "+EV Finder", free: "✓", pro: "✓", elite: "✓" },
                    { feature: "Email Alerts", free: "✗", pro: "✓", elite: "✓" },
                    { feature: "SMS Alerts", free: "✗", pro: "✗", elite: "✓" },
                    { feature: "Priority Picks", free: "✗", pro: "✗", elite: "✓" },
                    { feature: "1-on-1 Coaching", free: "✗", pro: "✗", elite: "✓" },
                    { feature: "Custom Alerts", free: "✗", pro: "✗", elite: "✓" },
                    { feature: "Private Discord", free: "✗", pro: "✗", elite: "✓" },
                    { feature: "24/7 Support", free: "✗", pro: "✗", elite: "✓" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-green-400/10 hover:bg-white/5">
                      <td className="p-4 text-foreground">{row.feature}</td>
                      <td className="p-4 text-center text-muted-foreground">{row.free}</td>
                      <td className="p-4 text-center text-green-400">{row.pro}</td>
                      <td className="p-4 text-center text-yellow-400 font-semibold">{row.elite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button className="btn-premium px-8 py-3 text-lg">
            Start Your Elite+ Trial
          </Button>
          <p className="text-muted-foreground text-sm mt-4">
            No credit card required. 30-day free trial.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
