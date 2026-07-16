import { motion } from "framer-motion";
import { Star, TrendingUp, Users } from "lucide-react";
import { Card } from "./ui/card";

interface PickOfTheWeekProps {
  sport: string;
  recommendation: string;
  confidence: number;
  roi: number;
  wins: number;
  totalPicks: number;
  pickedBy: string;
}

export function PickOfTheWeek({
  sport,
  recommendation,
  confidence,
  roi,
  wins,
  totalPicks,
  pickedBy,
}: PickOfTheWeekProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-3xl -z-10" />

      <Card className="glass-card p-8 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
        {/* Header with star icon */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-foreground">Pick of the Week</h3>
        </div>

        {/* Main pick content */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">Sport</p>
          <p className="text-3xl font-bold text-foreground mb-4">{sport}</p>

          <p className="text-lg text-yellow-400 font-semibold mb-2">{recommendation}</p>
          <p className="text-sm text-muted-foreground">Picked by {pickedBy}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-background/30 rounded-lg border border-yellow-400/20">
          {/* Confidence */}
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{confidence}%</p>
            <p className="text-xs text-muted-foreground mt-1">Confidence</p>
          </div>

          {/* ROI */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-3xl font-bold text-green-400">+{roi}%</p>
            </div>
            <p className="text-xs text-muted-foreground">ROI</p>
          </div>

          {/* Win Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-5 h-5 text-blue-400" />
              <p className="text-3xl font-bold text-blue-400">{wins}/{totalPicks}</p>
            </div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          View All This Week's Picks
        </motion.button>
      </Card>
    </motion.div>
  );
}
