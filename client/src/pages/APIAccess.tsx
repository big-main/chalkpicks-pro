import { motion } from "framer-motion";
import { Code, Zap, BarChart3, Lock } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function APIAccess() {
  const [apiKey, setApiKey] = useState("pk_live_1a2b3c4d5e6f7g8h9i0j");
  const [copied, setCopied] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    {
      method: "GET",
      path: "/api/picks",
      description: "Get all picks for a specific sport and date",
      example: "/api/picks?sport=NFL&date=2026-07-06",
    },
    {
      method: "GET",
      path: "/api/picks/:id",
      description: "Get detailed analysis for a specific pick",
      example: "/api/picks/pick_123456",
    },
    {
      method: "GET",
      path: "/api/leaderboard",
      description: "Get live leaderboard rankings and stats",
      example: "/api/leaderboard?limit=100",
    },
    {
      method: "POST",
      path: "/api/bets/track",
      description: "Track a bet and get live odds updates",
      example: "POST with bet data",
    },
    {
      method: "GET",
      path: "/api/steam-moves",
      description: "Get real-time steam move alerts",
      example: "/api/steam-moves?sport=NBA",
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            API Access
          </h1>
          <p className="text-muted-foreground">
            Build custom integrations and automate your betting workflow
          </p>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-12"
        >
          <Card className="glass-card border-blue-400/30 p-8 text-center">
            <p className="text-muted-foreground mb-2">Monthly Subscription</p>
            <p className="text-5xl font-bold text-blue-400 mb-1">$199</p>
            <p className="text-sm text-muted-foreground mb-6">/month, unlimited API calls</p>
            <Button className="w-full btn-premium mb-4">
              Enable API Access
            </Button>
            <p className="text-xs text-muted-foreground">
              Includes 1M API calls/month, webhooks, and priority support
            </p>
          </Card>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="glass-card border-green-400/20 p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Your API Key</h2>
            <div className="flex gap-2">
              <Input
                value={apiKey}
                readOnly
                className="bg-white/5 border-green-400/20 font-mono text-sm"
              />
              <Button onClick={copyApiKey} variant="outline">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep this key secret. Never commit it to version control.
            </p>
          </Card>
        </motion.div>

        {/* Documentation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">API Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-card border-green-400/20 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            endpoint.method === "GET"
                              ? "bg-blue-400/20 text-blue-400"
                              : "bg-green-400/20 text-green-400"
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                      <code className="text-xs bg-white/5 p-2 rounded block text-muted-foreground">
                        {endpoint.example}
                      </code>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            {
              icon: <Code className="w-6 h-6" />,
              title: "RESTful API",
              description: "Simple, well-documented REST endpoints for all ChalkPicks data",
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Webhooks",
              description: "Real-time webhooks for picks, wins, steam moves, and leaderboard updates",
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Analytics",
              description: "Access detailed performance metrics and historical data",
            },
            {
              icon: <Lock className="w-6 h-6" />,
              title: "Security",
              description: "OAuth 2.0, rate limiting, and IP whitelisting included",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="glass-card border-green-400/20 p-6">
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
