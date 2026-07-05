import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Copy, Share2, TrendingUp, Gift, Users, CheckCircle2,
  Twitter, Link2, DollarSign, Zap, Trophy, ArrowRight,
  Clock, Star
} from "lucide-react";

function ShareCard({ code, link, discount }: { code: string; link: string; discount: number }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === "code" ? "Code copied!" : "Link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const shareTwitter = () => {
    const text = `🏆 Get ${discount}% off ChalkPicks Pro — AI-powered sports betting picks with 73%+ win rate. Use my code: ${code}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, "_blank");
  };

  return (
    <NeonCard className="p-6 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[rgba(57,255,20,0.04)] blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.15)] flex items-center justify-center">
          <Share2 className="w-4 h-4 text-brand-green" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-white">Your Share Card</h3>
          <p className="text-xs text-white/40">{discount}% discount for your referrals</p>
        </div>
      </div>

      {/* Code display */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
        style={{
          background: "rgba(57, 255, 20, 0.04)",
          border: "1px solid rgba(57, 255, 20, 0.15)",
        }}
      >
        <span className="font-mono text-lg font-bold text-brand-green tracking-widest">{code}</span>
        <button
          onClick={() => copy(code, "code")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: copied === "code" ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.05)",
            color: copied === "code" ? "#39ff14" : "rgba(255,255,255,0.6)",
          }}
        >
          {copied === "code" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === "code" ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Link display */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <span className="text-xs text-white/40 truncate max-w-[200px]">{link}</span>
        <button
          onClick={() => copy(link, "link")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
          style={{
            background: copied === "link" ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.05)",
            color: copied === "link" ? "#39ff14" : "rgba(255,255,255,0.6)",
          }}
        >
          {copied === "link" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied === "link" ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={shareTwitter}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(29, 161, 242, 0.08)",
            border: "1px solid rgba(29, 161, 242, 0.2)",
            color: "#1da1f2",
          }}
        >
          <Twitter className="w-4 h-4" />
          Share on X
        </button>
        <button
          onClick={() => copy(link, "link")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(57, 255, 20, 0.06)",
            border: "1px solid rgba(57, 255, 20, 0.15)",
            color: "#39ff14",
          }}
        >
          <Link2 className="w-4 h-4" />
          Copy Link
        </button>
      </div>
    </NeonCard>
  );
}

export default function Referral() {
  const { user } = useAuth();
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
      toast.success("Referral code created!");
    },
  });

  const claimReward = trpc.referral.claimReward.useMutation({
    onSuccess: () => {
      myRewards.refetch();
      toast.success("Reward claimed!");
    },
  });

  const getReferralLink = (code: string) => `${window.location.origin}?ref=${code}`;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Sign in to access referrals</h1>
        </div>
      </div>
    );
  }

  const statItems = stats.data ? [
    { label: "Total Referrals", value: stats.data.totalReferrals, sub: `${stats.data.activeReferrals} active`, icon: Users, color: "#39ff14" },
    { label: "Total Earned", value: `$${stats.data.totalCommission.toFixed(2)}`, sub: `$${stats.data.earnedCommission.toFixed(2)} claimed`, icon: DollarSign, color: "#f0b800" },
    { label: "Pending", value: `$${stats.data.pendingCommission.toFixed(2)}`, sub: "Waiting to be earned", icon: Clock, color: "#a855f7" },
    { label: "Active Codes", value: myCodes.data?.length ?? 0, sub: "Referral codes", icon: Zap, color: "#60a5fa" },
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Navbar />

      <div className="container pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full glass-card-static text-xs font-semibold">
            <Gift className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-white/60">Earn While You Win</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mb-3">
            Referral <span className="text-emerald-gradient">Program</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl">
            Share ChalkPicks with friends and earn commissions on every subscription they purchase. No cap on earnings.
          </p>
        </motion.div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { step: "1", title: "Create a Code", desc: "Generate your unique referral code below", icon: Zap, color: "#39ff14" },
            { step: "2", title: "Share the Link", desc: "Send your link to friends or post on social", icon: Share2, color: "#f0b800" },
            { step: "3", title: "Earn Commission", desc: "Get paid when they subscribe to any plan", icon: DollarSign, color: "#a855f7" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NeonCard key={item.step} className="p-5 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${item.color}10`, border: `1px solid ${item.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: item.color }}>Step {item.step}</div>
                <h3 className="font-display text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-white/40">{item.desc}</p>
              </NeonCard>
            );
          })}
        </div>

        {/* Stats */}
        {statItems.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statItems.map((stat) => {
              const Icon = stat.icon;
              return (
                <NeonCard key={stat.label} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-xs text-white/50">{stat.label}</span>
                  </div>
                  <div className="font-display text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-white/35 mt-0.5">{stat.sub}</div>
                </NeonCard>
              );
            })}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {/* Share Cards */}
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-gold" />
              Your Referral Codes
            </h2>

            {myCodes.isLoading ? (
              <NeonCard className="p-6 text-center text-white/40">Loading codes...</NeonCard>
            ) : myCodes.data && myCodes.data.length > 0 ? (
              <div className="space-y-4">
                {myCodes.data.map((code: any) => (
                  <ShareCard
                    key={code.id}
                    code={code.code}
                    link={getReferralLink(code.code)}
                    discount={code.discountPercentage}
                  />
                ))}
              </div>
            ) : (
              <NeonCard className="p-8 text-center">
                <Share2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 mb-4">No referral codes yet</p>
                <button
                  onClick={() => setShowGenerateForm(true)}
                  className="btn-premium text-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Create Your First Code
                </button>
              </NeonCard>
            )}

            {/* Generate form */}
            {showGenerateForm ? (
              <NeonCard className="p-5 mt-4">
                <h3 className="font-display text-sm font-bold text-white mb-4">Create New Code</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Discount % for your referrals</label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                      className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-white rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateCode.mutate({ discountPercentage })}
                      disabled={generateCode.isPending}
                      className="btn-premium text-sm flex-1"
                    >
                      {generateCode.isPending ? "Generating..." : "Generate Code"}
                    </button>
                    <Button
                      onClick={() => setShowGenerateForm(false)}
                      variant="outline"
                      className="border-[rgba(255,255,255,0.1)] text-white/60 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </NeonCard>
            ) : myCodes.data && myCodes.data.length > 0 ? (
              <button
                onClick={() => setShowGenerateForm(true)}
                className="mt-4 btn-outline-premium w-full justify-center text-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Create Another Code
              </button>
            ) : null}
          </div>

          {/* Rewards */}
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-brand-green" />
              Your Rewards
            </h2>

            {myRewards.isLoading ? (
              <NeonCard className="p-6 text-center text-white/40">Loading rewards...</NeonCard>
            ) : myRewards.data && myRewards.data.length > 0 ? (
              <div className="space-y-3">
                {myRewards.data.map((reward: any) => (
                  <NeonCard key={reward.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.15)" }}
                        >
                          <Star className="w-4 h-4 text-brand-green" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white capitalize">{reward.rewardType}</div>
                          <div className="text-xs text-white/40">
                            {reward.claimedAt ? `Claimed ${new Date(reward.claimedAt).toLocaleDateString()}` : "Unclaimed"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl font-bold text-brand-green">${reward.rewardAmount}</div>
                        <div
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: reward.status === "earned" ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.05)",
                            color: reward.status === "earned" ? "#39ff14" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {reward.status}
                        </div>
                      </div>
                    </div>
                    {reward.status === "earned" && (
                      <button
                        onClick={() => claimReward.mutate({ rewardId: reward.id })}
                        disabled={claimReward.isPending}
                        className="btn-premium w-full justify-center text-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {claimReward.isPending ? "Claiming..." : "Claim Reward"}
                      </button>
                    )}
                  </NeonCard>
                ))}
              </div>
            ) : (
              <NeonCard className="p-8 text-center">
                <Gift className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 mb-2">No rewards yet</p>
                <p className="text-xs text-white/30">Start referring friends to earn commissions</p>
              </NeonCard>
            )}
          </div>
        </div>

        {/* Referral history table */}
        <div>
          <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-blue" />
            Referral History
          </h2>

          {myReferrals.isLoading ? (
            <NeonCard className="p-6 text-center text-white/40">Loading...</NeonCard>
          ) : myReferrals.data && myReferrals.data.length > 0 ? (
            <NeonCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["User", "Status", "Commission", "Date"].map((h) => (
                        <th key={h} className="text-left py-3.5 px-5 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myReferrals.data.map((ref: any) => (
                      <tr key={ref.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td className="py-3.5 px-5 text-white/80">{ref.referredUser?.email || "Unknown"}</td>
                        <td className="py-3.5 px-5">
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: ref.status === "active" ? "rgba(57,255,20,0.08)" : ref.status === "pending" ? "rgba(240,184,0,0.08)" : "rgba(255,59,59,0.08)",
                              color: ref.status === "active" ? "#39ff14" : ref.status === "pending" ? "#f0b800" : "#ff3b3b",
                            }}
                          >
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-brand-green">${ref.commissionEarned || "0.00"}</td>
                        <td className="py-3.5 px-5 text-white/40">{new Date(ref.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </NeonCard>
          ) : (
            <NeonCard className="p-8 text-center">
              <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 mb-2">No referrals yet</p>
              <p className="text-xs text-white/30">Share your code to start tracking referrals</p>
              <button
                onClick={() => setShowGenerateForm(true)}
                className="mt-4 btn-premium text-sm"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </NeonCard>
          )}
        </div>
      </div>
    </div>
  );
}
