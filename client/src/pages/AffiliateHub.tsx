import { useRouter } from "wouter";
import { motion } from "framer-motion";
import { Copy, Share2, TrendingUp, Users, DollarSign, Gift } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRouter } from "wouter";

export default function AffiliateHub() {
  const { user } = useAuth();
  const [, setLocation] = useRouter();
  const [copied, setCopied] = useState(false);

  if (!user) {
    setLocation("/");
    return null;
  }

  const affiliateLink = `https://chalkpicks.live?ref=${user.id}`;
  const referralCode = `CHALK${user.id}`;
  const totalEarnings = 2847.5; // Mock data
  const totalReferrals = 23;
  const pendingEarnings = 342.0;
  const commissionRate = 0.2; // 20%

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `Join me on ChalkPicks! Get AI-powered sports betting picks with 73%+ win rate. Use code ${referralCode} for 15% off 🎯`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateLink)}`,
      "_blank"
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-3">Affiliate Hub</h1>
          <p className="text-lg text-muted-foreground">Earn 20% commission on every referral. Build passive income.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {/* Total Earnings */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-green-400 mt-2">+$124.50 this month</p>
            </Card>
          </motion.div>

          {/* Total Referrals */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total Referrals</h3>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalReferrals}</p>
              <p className="text-xs text-blue-400 mt-2">+3 this week</p>
            </Card>
          </motion.div>

          {/* Pending Earnings */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">${pendingEarnings.toFixed(2)}</p>
              <p className="text-xs text-yellow-400 mt-2">Pays out monthly</p>
            </Card>
          </motion.div>

          {/* Commission Rate */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Commission</h3>
                <Gift className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{(commissionRate * 100).toFixed(0)}%</p>
              <p className="text-xs text-purple-400 mt-2">Per referral</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Share Card */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <Card className="glass-card p-8 border border-green-400/20">
            <h2 className="text-2xl font-bold text-foreground mb-6">Share Your Link</h2>

            {/* Affiliate Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Your Affiliate Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={affiliateLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-background/50 border border-green-400/30 rounded-lg text-foreground text-sm font-mono"
                />
                <Button
                  onClick={handleCopyLink}
                  className="btn-premium gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-background/50 border border-green-400/30 rounded-lg text-foreground text-sm font-mono text-center"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-premium gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleShareTwitter} className="flex-1 btn-premium gap-2">
                <Share2 className="w-4 h-4" />
                Share on Twitter
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Share2 className="w-4 h-4" />
                Share on Facebook
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Recent Referrals</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-400/20">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Referral</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tier</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Commission</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "User #2847", tier: "Monthly Pro", commission: 5.99, date: "Jul 4", status: "Active" },
                    { name: "User #2846", tier: "Annual VIP", commission: 19.99, date: "Jul 3", status: "Active" },
                    { name: "User #2845", tier: "Daily Pass", commission: 0.99, date: "Jul 2", status: "Active" },
                    { name: "User #2844", tier: "Monthly Pro", commission: 5.99, date: "Jul 1", status: "Active" },
                    { name: "User #2843", tier: "Annual VIP", commission: 19.99, date: "Jun 30", status: "Active" },
                  ].map((referral, i) => (
                    <tr key={i} className="border-b border-green-400/10 hover:bg-green-400/5 transition-colors">
                      <td className="py-3 px-4 text-foreground">{referral.name}</td>
                      <td className="py-3 px-4 text-foreground">{referral.tier}</td>
                      <td className="py-3 px-4 text-green-400 font-semibold">${referral.commission.toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{referral.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-400 text-xs font-medium">
                          {referral.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
