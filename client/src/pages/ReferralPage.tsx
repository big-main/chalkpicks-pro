import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Copy,
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export function ReferralPage() {
  const [, setLocation] = useLocation();
  const { data: meData } = trpc.auth.me.useQuery();
  const user = meData;
  const [copied, setCopied] = useState(false);

  // Redirect non-authenticated users
  useEffect(() => {
    if (user !== undefined && !user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch referral stats
  const { data: refStats } = trpc.referral.getStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch referrals list
  const { data: myReferrals } = trpc.referral.getMyReferrals.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  // Fetch rewards
  const { data: myRewards } = trpc.referral.getMyRewards.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  if (user === undefined) {
    return null;
  }

  if (!user) {
    return null;
  }

  const referralLink = `https://chalkpicks.pro?ref=${user.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">Earn with ChalkPicks</h1>
          <p className="text-lg text-muted-foreground">
            Share your referral link and earn rewards when friends subscribe
          </p>
        </motion.div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-[#39ff14]/20 bg-gradient-to-br from-[#39ff14]/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#39ff14]" />
                Your Referral Link
              </CardTitle>
              <CardDescription>
                Share this link to earn 1 month free for each referral that
                subscribes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 text-sm font-mono"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share on Twitter, Discord, or anywhere your friends hang out
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#39ff14]">
                {refStats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {refStats?.activeReferrals || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#f0b800]">
                ${(refStats?.totalCommission || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${(refStats?.earnedCommission || 0).toFixed(2)} claimed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#60a5fa]">
                ${(refStats?.pendingCommission || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting claim
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rewards List */}
        {myRewards && myRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Available Rewards</CardTitle>
                <CardDescription>Claim your earned rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRewards.map((reward: any) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-[#39ff14]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {reward.status === "claimed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Gift className="w-5 h-5 text-[#39ff14]" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {reward.rewardType === "free_month"
                              ? "1 Month Free"
                              : "Reward"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reward.status === "claimed"
                              ? "Claimed"
                              : "Ready to claim"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#39ff14]">
                          ${reward.rewardAmount}
                        </p>
                        {reward.status !== "claimed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 text-xs"
                          >
                            Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referrals List */}
        {myReferrals && myReferrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>
                  People who joined through your link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium">
                          Email
                        </th>
                        <th className="text-left py-2 px-2 font-medium">
                          Status
                        </th>
                        <th className="text-left py-2 px-2 font-medium">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReferrals.map((ref: any) => (
                        <tr key={ref.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">{ref.referredUserEmail}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${ref.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {(!myReferrals || myReferrals.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-12"
          >
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No referrals yet. Share your link to get started!
            </p>
            <Button onClick={handleCopyLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
