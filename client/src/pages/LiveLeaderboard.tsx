import { motion } from "framer-motion";
import { Trophy, TrendingUp, Zap, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  username: string;
  winRate: number;
  roi: number;
  profit: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  picks: number;
  streak: number;
  prize?: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "ProBettor",
    winRate: 73,
    roi: 28.5,
    profit: 12450,
    tier: "platinum",
    picks: 487,
    streak: 12,
    prize: 500,
  },
  {
    rank: 2,
    username: "PickMaster",
    winRate: 71,
    roi: 26.2,
    profit: 11200,
    tier: "gold",
    picks: 423,
    streak: 8,
    prize: 300,
  },
  {
    rank: 3,
    username: "OddsWizard",
    winRate: 69,
    roi: 24.8,
    profit: 9850,
    tier: "gold",
    picks: 398,
    streak: 6,
    prize: 150,
  },
  {
    rank: 4,
    username: "VolumeTrader",
    winRate: 68,
    roi: 22.1,
    profit: 8920,
    tier: "silver",
    picks: 356,
    streak: 5,
    prize: 75,
  },
  {
    rank: 5,
    username: "DataDriven",
    winRate: 67,
    roi: 21.5,
    profit: 8450,
    tier: "silver",
    picks: 342,
    streak: 4,
    prize: 25,
  },
];

const tierColors = {
  bronze: "from-amber-600 to-amber-700",
  silver: "from-slate-400 to-slate-500",
  gold: "from-yellow-400 to-yellow-500",
  platinum: "from-cyan-300 to-blue-400",
};

const tierBadges = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "👑",
};

export default function LiveLeaderboard() {
  const [selectedTab, setSelectedTab] = useState<"weekly" | "monthly" | "alltime">("weekly");
  const [userRank, setUserRank] = useState(42);

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
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Live Leaderboard
            </h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-muted-foreground text-lg">
            Top performers compete for weekly prize pools ($500/week)
          </p>
        </motion.div>

        {/* Prize Pool Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { rank: "🥇 1st", prize: "$500" },
            { rank: "🥈 2nd", prize: "$300" },
            { rank: "🥉 3rd", prize: "$150" },
            { rank: "4-5th", prize: "$50 each" },
          ].map((item, i) => (
            <Card key={i} className="glass-card p-4 text-center border-green-400/20">
              <p className="text-sm text-muted-foreground">{item.rank}</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{item.prize}</p>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-green-400/20 pb-4">
          {["weekly", "monthly", "alltime"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTab === tab
                  ? "bg-green-400/20 text-green-400 border border-green-400/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {mockLeaderboard.map((entry, idx) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-card p-4 border border-green-400/20 hover:border-green-400/40 transition-all cursor-pointer group ${
                entry.rank <= 3 ? "ring-1 ring-yellow-400/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Rank & User */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-center w-12">
                    <span className="text-2xl">{tierBadges[entry.tier]}</span>
                    <p className="text-xs text-muted-foreground font-bold">#{entry.rank}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.picks} picks • {entry.streak} streak
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:grid grid-cols-3 gap-6 flex-1">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-bold text-green-400">{entry.winRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className="text-lg font-bold text-blue-400">+{entry.roi}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Profit</p>
                    <p className="text-lg font-bold text-emerald-400">${entry.profit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Prize */}
                {entry.prize && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p className="text-xl font-bold text-yellow-400">${entry.prize}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Your Rank */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-card p-6 border border-blue-400/30 text-center"
        >
          <p className="text-muted-foreground mb-2">Your Current Rank</p>
          <p className="text-4xl font-bold text-blue-400 mb-4">#{userRank}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-lg font-bold text-green-400">65%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className="text-lg font-bold text-blue-400">+18.5%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profit</p>
              <p className="text-lg font-bold text-emerald-400">$4,250</p>
            </div>
          </div>
          <Button className="btn-premium">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Your Stats
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
