import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Share2, TrendingUp, Gift, Users } from "lucide-react";

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(10);

  const myCodes = trpc.referral.getMyCodes.useQuery();
  const stats = trpc.referral.getStats.useQuery();
  const myReferrals = trpc.referral.getMyReferrals.useQuery();
  const myRewards = trpc.referral.getMyRewards.useQuery();

  const generateCode = trpc.referral.generateCode.useMutation({
    onSuccess: () => {
      myCodes.refetch();
      setShowGenerateForm(false);
      setDiscountPercentage(10);
    },
  });

  const claimReward = trpc.referral.claimReward.useMutation({
    onSuccess: () => {
      myRewards.refetch();
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReferralLink = (code: string) => {
    return `${window.location.origin}?ref=${code}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Sign in to access referrals</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Referral Program</h1>
          <p className="text-brand-blue">Earn commissions by referring friends</p>
        </div>

        {/* Stats Grid */}
        {stats.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-green" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.data.totalReferrals}</div>
                <p className="text-xs text-brand-green">{stats.data.activeReferrals} active</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-brand-blue" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.data.totalCommission.toFixed(2)}</div>
                <p className="text-xs text-brand-blue">${stats.data.earnedCommission.toFixed(2)} claimed</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.data.pendingCommission.toFixed(2)}</div>
                <p className="text-xs text-purple-400">Waiting to be earned</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{myCodes.data?.length || 0}</div>
                <p className="text-xs text-slate-400">Active referral codes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generate Code Section */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Generate Referral Code</CardTitle>
            <CardDescription>Create a new code to share with friends</CardDescription>
          </CardHeader>
          <CardContent>
            {!showGenerateForm ? (
              <Button
                onClick={() => setShowGenerateForm(true)}
                className="bg-brand-green/80 hover:bg-brand-green text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Create New Code
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Discount Percentage</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      generateCode.mutate({
                        discountPercentage,
                      })
                    }
                    disabled={generateCode.isPending}
                    className="bg-brand-green/80 hover:bg-brand-green text-white"
                  >
                    {generateCode.isPending ? "Generating..." : "Generate"}
                  </Button>
                  <Button
                    onClick={() => setShowGenerateForm(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Codes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Referral Codes</h2>
          {myCodes.isLoading ? (
            <div className="text-slate-400">Loading...</div>
          ) : myCodes.data && myCodes.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCodes.data.map((code: any) => (
                <Card key={code.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white font-mono text-lg">{code.code}</CardTitle>
                    <CardDescription>{code.discountPercentage}% discount</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-slate-300">
                      <p>Redemptions: {code.currentRedemptions} / {code.maxRedemptions || "∞"}</p>
                      {code.expiresAt && (
                        <p>Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(getReferralLink(code.code))}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center text-slate-400">
                No referral codes yet. Create one to get started!
              </CardContent>
            </Card>
          )}
        </div>

        {/* My Referrals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Referrals</h2>
          {myReferrals.isLoading ? (
            <div className="text-slate-400">Loading...</div>
          ) : myReferrals.data && myReferrals.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">User</th>
                    <th className="text-left py-3 px-4 text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300">Commission</th>
                    <th className="text-left py-3 px-4 text-slate-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myReferrals.data.map((ref: any) => (
                    <tr key={ref.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-white">{ref.referredUser?.email || "Unknown"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            ref.status === "active"
                              ? "bg-brand-green/10 text-brand-green"
                              : ref.status === "pending"
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">${ref.commissionEarned || "0.00"}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center text-slate-400">
                No referrals yet. Share your code to get started!
              </CardContent>
            </Card>
          )}
        </div>

        {/* My Rewards */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Your Rewards</h2>
          {myRewards.isLoading ? (
            <div className="text-slate-400">Loading...</div>
          ) : myRewards.data && myRewards.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRewards.data.map((reward: any) => (
                <Card key={reward.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">{reward.rewardType}</CardTitle>
                    <CardDescription>${reward.rewardAmount}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-slate-300">
                      <p>Status: {reward.status}</p>
                      {reward.claimedAt && (
                        <p>Claimed: {new Date(reward.claimedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    {reward.status === "earned" && (
                      <Button
                        onClick={() => claimReward.mutate({ rewardId: reward.id })}
                        disabled={claimReward.isPending}
                        className="w-full bg-brand-green/80 hover:bg-brand-green text-white"
                      >
                        {claimReward.isPending ? "Claiming..." : "Claim Reward"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center text-slate-400">
                No rewards yet. Keep referring to earn!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
