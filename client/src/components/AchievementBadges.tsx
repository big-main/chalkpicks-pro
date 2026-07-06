import { motion } from "framer-motion";
import { Trophy, Flame, Target, TrendingUp, Zap, Crown } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlockedAt?: Date;
}

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.1, rotate: 5 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-4"
    >
      {achievements.map((achievement) => (
        <motion.div
          key={achievement.id}
          variants={badgeVariants}
          whileHover="hover"
          className="relative group"
          title={achievement.description}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${achievement.color} shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="text-2xl">{achievement.icon}</div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs text-foreground">
            {achievement.name}
          </div>

          {/* Unlock indicator */}
          {achievement.unlockedAt && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold text-black"
            >
              ✓
            </motion.div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export const ACHIEVEMENT_TEMPLATES: Record<string, Achievement> = {
  streak_7: {
    id: "streak_7",
    name: "7-Day Win Streak",
    description: "Win 7 consecutive picks",
    icon: <Flame className="w-8 h-8" />,
    color: "bg-red-500/20 border border-red-500/50",
  },
  streak_30: {
    id: "streak_30",
    name: "30-Day Dominator",
    description: "Win 30 consecutive picks",
    icon: <Crown className="w-8 h-8" />,
    color: "bg-yellow-500/20 border border-yellow-500/50",
  },
  picks_100: {
    id: "picks_100",
    name: "Century Club",
    description: "Track 100+ picks",
    icon: <Target className="w-8 h-8" />,
    color: "bg-blue-500/20 border border-blue-500/50",
  },
  picks_500: {
    id: "picks_500",
    name: "Pick Master",
    description: "Track 500+ picks",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "bg-purple-500/20 border border-purple-500/50",
  },
  roi_100: {
    id: "roi_100",
    name: "100% ROI",
    description: "Achieve 100% return on investment",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-green-500/20 border border-green-500/50",
  },
  top_leaderboard: {
    id: "top_leaderboard",
    name: "Top 10 Leaderboard",
    description: "Rank in top 10 of leaderboard",
    icon: <Trophy className="w-8 h-8" />,
    color: "bg-orange-500/20 border border-orange-500/50",
  },
};
