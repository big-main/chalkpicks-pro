import { motion } from "framer-motion";
import { Store, TrendingUp, Users, Zap, Globe, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResellerProgram() {
  const benefits = [
    {
      icon: <Store className="w-6 h-6" />,
      title: "White-Label Platform",
      description: "Rebrand ChalkPicks with your logo, colors, and domain",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "30% Revenue Share",
      description: "Earn 30% of all subscription revenue from your customers",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Dedicated Support",
      description: "Get priority onboarding and ongoing technical support",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Setup",
      description: "Launch your branded platform in less than 24 hours",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Custom Domain",
      description: "Use your own domain with full white-label branding",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track revenue, customer growth, and performance metrics",
    },
  ];

  const tiers = [
    {
      name: "Starter",
      revenue: "30%",
      minCustomers: "0",
      setup: "Free",
      features: ["White-label platform", "Up to 100 customers", "Email support"],
    },
    {
      name: "Professional",
      revenue: "35%",
      minCustomers: "100+",
      setup: "Free",
      features: [
        "White-label platform",
        "Unlimited customers",
        "Priority support",
        "Custom integrations",
      ],
    },
    {
      name: "Enterprise",
      revenue: "40%",
      minCustomers: "1000+",
      setup: "Custom",
      features: [
        "White-label platform",
        "Unlimited customers",
        "24/7 dedicated support",
        "Custom API integrations",
        "Co-marketing opportunities",
      ],
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            White-Label Reseller Program
          </h1>
          <p className="text-muted-foreground text-lg">
            Build your own sports betting analytics brand and earn recurring revenue
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border-purple-400/20 p-6 h-full">
                <div className="text-purple-400 mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Tiers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Revenue Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`glass-card p-8 h-full flex flex-col ${
                    idx === 1 ? "border-purple-400/40 ring-1 ring-purple-400/30" : "border-purple-400/20"
                  }`}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {tier.minCustomers} {tier.minCustomers === "0" ? "customers" : "+ customers"}
                  </p>

                  <div className="mb-6">
                    <p className="text-4xl font-bold text-purple-400 mb-1">{tier.revenue}</p>
                    <p className="text-sm text-muted-foreground">Revenue share</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground">Setup Fee</p>
                    <p className="text-xl font-semibold text-foreground">{tier.setup}</p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-purple-400 mt-1">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full btn-premium">Apply Now</Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Apply", desc: "Submit your application" },
              { step: 2, title: "Setup", desc: "Configure your white-label brand" },
              { step: 3, title: "Launch", desc: "Go live with your platform" },
              { step: 4, title: "Earn", desc: "Collect 30-40% recurring revenue" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="glass-card border-purple-400/20 p-4 text-center">
                  <div className="w-10 h-10 bg-purple-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-400 font-bold">{item.step}</span>
                  </div>
                  <p className="font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button className="btn-premium px-8 py-3 text-lg">
            Start Your Reseller Journey
          </Button>
          <p className="text-muted-foreground text-sm mt-4">
            Questions? Email us at partners@chalkpicks.live
          </p>
        </motion.div>
      </div>
    </div>
  );
}
