import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface Parlay {
  id: string;
  date: Date;
  legs: number;
  wager: number;
  odds: number;
  potentialPayout: number;
  status: "pending" | "won" | "lost" | "partial";
  picks: string[];
  roi: number;
}

const mockParlays: Parlay[] = [
  {
    id: "1",
    date: new Date(Date.now() - 2 * 3600000),
    legs: 3,
    wager: 100,
    odds: 540,
    potentialPayout: 640,
    status: "won",
    picks: ["Lakers -5.5", "Chiefs ML", "Over 47.5"],
    roi: 540,
  },
  {
    id: "2",
    date: new Date(Date.now() - 5 * 3600000),
    legs: 4,
    wager: 50,
    odds: 1200,
    potentialPayout: 650,
    status: "pending",
    picks: ["Celtics +3", "Ravens ML", "Under 45", "Yankees -1.5"],
    roi: 0,
  },
  {
    id: "3",
    date: new Date(Date.now() - 24 * 3600000),
    legs: 2,
    wager: 200,
    odds: 280,
    potentialPayout: 760,
    status: "lost",
    picks: ["Mets ML", "Dodgers +2"],
    roi: -200,
  },
];

export default function ParlayTracker() {
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all");

  const filteredParlays = mockParlays.filter((p) => filter === "all" || p.status === filter);

  const stats = {
    totalWagered: mockParlays.reduce((sum, p) => sum + p.wager, 0),
    totalWon: mockParlays.filter((p) => p.status === "won").reduce((sum, p) => sum + p.potentialPayout - p.wager, 0),
    winRate: ((mockParlays.filter((p) => p.status === "won").length / mockParlays.length) * 100).toFixed(0),
    avgOdds: (mockParlays.reduce((sum, p) => sum + p.odds, 0) / mockParlays.length).toFixed(0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "text-green-400";
      case "lost":
        return "text-red-400";
      case "pending":
        return "text-blue-400";
      default:
        return "text-yellow-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "lost":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Parlay Tracker
          </h1>
          <p className="text-muted-foreground">Track all your parlays and monitor live odds</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Wagered", value: `$${stats.totalWagered}`, icon: "💰" },
            { label: "Total Won", value: `$${stats.totalWon}`, icon: "🎉" },
            { label: "Win Rate", value: `${stats.winRate}%`, icon: "📊" },
            { label: "Avg Odds", value: `+${stats.avgOdds}`, icon: "📈" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card p-4 border-green-400/20 text-center">
              <p className="text-2xl mb-2">{stat.icon}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-green-400 mt-1">{stat.value}</p>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "won", "lost"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-green-400/20 text-green-400 border border-green-400/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Parlays List */}
        <div className="space-y-4">
          {filteredParlays.map((parlay, idx) => (
            <motion.div
              key={parlay.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border-green-400/20 p-6 hover:border-green-400/40 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(parlay.status)}
                    <div>
                      <p className="font-semibold text-foreground">{parlay.legs}-Leg Parlay</p>
                      <p className="text-xs text-muted-foreground">{parlay.date.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getStatusColor(parlay.status)}`}>
                      {parlay.status === "won" ? "+" : parlay.status === "lost" ? "-" : ""}{parlay.roi}
                    </p>
                    <p className="text-xs text-muted-foreground">ROI</p>
                  </div>
                </div>

                {/* Picks */}
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Picks:</p>
                  <div className="space-y-1">
                    {parlay.picks.map((pick, i) => (
                      <p key={i} className="text-sm text-foreground">
                        {i + 1}. {pick}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Wager</p>
                    <p className="font-semibold text-foreground">${parlay.wager}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Odds</p>
                    <p className="font-semibold text-blue-400">+{parlay.odds}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Potential</p>
                    <p className="font-semibold text-green-400">${parlay.potentialPayout}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-semibold ${getStatusColor(parlay.status)}`}>
                      {parlay.status.charAt(0).toUpperCase() + parlay.status.slice(1)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
