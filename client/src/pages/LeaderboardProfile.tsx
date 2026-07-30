import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import {
  Trophy,
  TrendingUp,
  Target,
  Flame,
  BarChart2,
  ArrowLeft,
  Share2,
  ExternalLink,
} from "lucide-react";

const LOGO_URL =
  "https://manuscdn.com/asset/file/iemcxn6n83gp6xpsdnjlq/lOhHHWJHEFXjYrXZqEAXSV?e=1753574400&s=IVBMKLpFcBCfFmBqWvbvtQ";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </motion.div>
  );
}

export default function LeaderboardProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";

  const { data: profile, isLoading } = trpc.leaderboard.getByUsername.useQuery(
    { displayName: username },
    { enabled: !!username }
  );

  const handleShare = () => {
    const url = `${window.location.origin}/leaderboard/${encodeURIComponent(username)}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${username}'s ChalkPicks Pro Stats`,
          text: `Check out ${username}'s betting record on ChalkPicks Pro — ${parseFloat(String(profile?.winRate ?? 0)).toFixed(1)}% win rate, +${parseFloat(String(profile?.roi ?? 0)).toFixed(1)}% ROI`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          // toast handled by sonner
        })
        .catch(() => {});
    }
  };

  const streakLabel = profile?.streak
    ? Number(profile.streak) > 0
      ? `🔥 ${profile.streak}W Streak`
      : `❄️ ${Math.abs(Number(profile.streak))}L Streak`
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#080814" }}>
      <SEO
        title={
          profile
            ? `${profile.displayName} — ChalkPicks Pro Leaderboard`
            : "Bettor Profile — ChalkPicks Pro"
        }
        description={
          profile
            ? `${profile.displayName} has a ${parseFloat(String(profile.winRate ?? 0)).toFixed(1)}% win rate and +${parseFloat(String(profile.roi ?? 0)).toFixed(1)}% ROI on ChalkPicks Pro. Rank #${profile.rank}.`
            : "View this bettor's public stats on ChalkPicks Pro."
        }
        canonicalPath={`/leaderboard/${encodeURIComponent(username)}`}
      />
      <Navbar />

      {/* Logo hero */}
      <div className="flex justify-center pt-8 pb-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
          style={{ width: 160, height: 80 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${LOGO_URL})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 55%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 55%, transparent 100%)",
            }}
          />
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/leaderboard">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-white/50 hover:text-white gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Leaderboard
          </Button>
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#39ff14", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {!isLoading && !profile && (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Profile not found
            </h2>
            <p className="text-white/50 mb-6">
              No bettor found with the username{" "}
              <span className="text-white font-mono">@{username}</span>
            </p>
            <Link href="/leaderboard">
              <Button style={{ background: "#39ff14", color: "#080814" }}>
                View Leaderboard
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && profile && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header card */}
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2"
                      style={{
                        background: "rgba(57,255,20,0.1)",
                        borderColor: "#39ff14",
                        color: "#39ff14",
                      }}
                    >
                      {(profile.displayName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        {profile.displayName ?? username}
                      </h1>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {profile.rank && (
                          <Badge
                            variant="outline"
                            className="border-yellow-500/40 text-yellow-400 text-xs"
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            Rank #{profile.rank}
                          </Badge>
                        )}
                        {profile.badge && (
                          <Badge
                            variant="outline"
                            className="border-white/20 text-white/70 text-xs"
                          >
                            {profile.badge}
                          </Badge>
                        )}
                        {streakLabel && (
                          <Badge
                            variant="outline"
                            className="border-orange-500/40 text-orange-400 text-xs"
                          >
                            {streakLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="border-white/20 text-white/70 hover:text-white gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </Button>
                    <Link href="/pricing">
                      <Button
                        size="sm"
                        style={{ background: "#39ff14", color: "#080814" }}
                        className="gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Join ChalkPicks
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Win Rate"
                value={`${parseFloat(String(profile.winRate ?? 0)).toFixed(1)}%`}
                icon={Target}
                color="#39ff14"
              />
              <StatCard
                label="ROI"
                value={`+${parseFloat(String(profile.roi ?? 0)).toFixed(1)}%`}
                icon={TrendingUp}
                color="#3b82f6"
              />
              <StatCard
                label="Total Bets"
                value={profile.totalBets ?? "—"}
                icon={BarChart2}
                color="#a855f7"
              />
              <StatCard
                label="Wins"
                value={profile.wins ?? "—"}
                icon={Trophy}
                color="#f59e0b"
              />
              <StatCard
                label="Losses"
                value={profile.losses ?? "—"}
                icon={Flame}
                color="#ef4444"
              />
              <StatCard
                label="Total Profit"
                value={
                  profile.totalProfit
                    ? `$${profile.totalProfit.toLocaleString()}`
                    : "—"
                }
                icon={TrendingUp}
                color="#10b981"
              />
            </div>

            {/* CTA */}
            <Card className="border-[#39ff14]/20 bg-[#39ff14]/5">
              <CardContent className="p-5 text-center">
                <p className="text-white/70 text-sm mb-3">
                  Want to track your own record and appear on the leaderboard?
                </p>
                <Link href="/pricing">
                  <Button
                    style={{ background: "#39ff14", color: "#080814" }}
                    className="font-semibold"
                  >
                    Get Premium Access
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
