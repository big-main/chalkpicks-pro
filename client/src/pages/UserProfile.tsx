import { motion } from "framer-motion";
import { User, CreditCard, TrendingUp, Settings, LogOut, Trophy } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRouter } from "wouter";

export default function UserProfile() {
  const { user } = useAuth();
  const [, setLocation] = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    setLocation("/");
    return null;
  }

  const billingHistory = [
    { date: "2026-07-01", plan: "Monthly Pro", amount: "$29.99", status: "Paid" },
    { date: "2026-06-01", plan: "Monthly Pro", amount: "$29.99", status: "Paid" },
    { date: "2026-05-01", plan: "Monthly Pro", amount: "$29.99", status: "Paid" },
  ];

  const leaderboardStats = {
    rank: 47,
    winRate: 73.2,
    totalPicks: 156,
    profit: 2847.5,
    streak: 7,
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.name || "User"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setLocation("/account-settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 mb-8 border-b border-green-400/20"
        >
          {["overview", "billing", "leaderboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === tab
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Subscription Card */}
            <Card className="glass-card border-green-400/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Current Subscription
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plan</p>
                  <p className="text-lg font-semibold text-foreground">
                    {user.subscriptionTier || "Free"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="text-lg font-semibold text-green-400">Active</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Renews</p>
                  <p className="text-lg font-semibold text-foreground">Aug 1, 2026</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Credits</p>
                  <p className="text-lg font-semibold text-blue-400">{user.credits || 0}</p>
                </div>
              </div>
              <Button className="btn-premium mt-4">Upgrade Plan</Button>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Trophy className="w-5 h-5" />, label: "Rank", value: `#${leaderboardStats.rank}` },
                { icon: <TrendingUp className="w-5 h-5" />, label: "Win Rate", value: `${leaderboardStats.winRate}%` },
                { icon: <CreditCard className="w-5 h-5" />, label: "Profit", value: `$${leaderboardStats.profit.toFixed(2)}` },
              ].map((stat, idx) => (
                <Card key={idx} className="glass-card border-green-400/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-green-400">{stat.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card className="glass-card border-green-400/20 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Billing History</h2>
              <div className="space-y-3">
                {billingHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{entry.plan}</p>
                      <p className="text-sm text-muted-foreground">{entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">{entry.amount}</p>
                      <p className="text-sm text-muted-foreground">{entry.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card className="glass-card border-green-400/20 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Leaderboard Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Global Rank", value: `#${leaderboardStats.rank}` },
                  { label: "Win Rate", value: `${leaderboardStats.winRate}%` },
                  { label: "Total Picks", value: leaderboardStats.totalPicks },
                  { label: "Total Profit", value: `$${leaderboardStats.profit.toFixed(2)}` },
                  { label: "Current Streak", value: `${leaderboardStats.streak} W` },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-lg font-bold text-green-400">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
