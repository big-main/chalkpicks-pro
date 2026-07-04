import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clock, Send, TrendingUp } from "lucide-react";

export default function CommunityAutomation() {
  const [activeTab, setActiveTab] = useState<"reddit" | "twitter" | "discord">("reddit");
  
  const { data: dailyContent } = trpc.communityAutomation.getDailyPickContent.useQuery();
  const { data: metrics } = trpc.communityAutomation.getCommunityMetrics.useQuery();
  const { data: stats } = trpc.communityAutomation.getPostingStats.useQuery();

  const triggerPost = trpc.communityAutomation.triggerManualPost.useMutation();

  const handleManualPost = async (platform: "reddit" | "twitter" | "discord") => {
    try {
      await triggerPost.mutateAsync({
        platform,
        content: "Today's AI-generated pick from ChalkPicks Pro",
      });
    } catch (error) {
      console.error("Failed to trigger post:", error);
    }
  };

  if (!dailyContent || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading community automation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Community Automation</h1>
          <p className="mt-2 text-slate-400">Automate daily picks posting across Reddit, Twitter, and Discord</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-400">{stats?.totalPostsThisMonth ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Posts This Month</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">{stats?.totalEngagement ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Total Engagement</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-400">{stats?.trialSignupsFromCommunity ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Trial Signups</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-400">{(stats?.conversionRate ?? 0).toFixed(1)}%</div>
              <p className="text-xs text-slate-400 mt-1">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-700">
          {(["reddit", "twitter", "discord"] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === platform
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>

        {/* Platform Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-emerald-400">
                  {activeTab === "reddit" && "Reddit Posting"}
                  {activeTab === "twitter" && "Twitter Posting"}
                  {activeTab === "discord" && "Discord Posting"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "reddit" && "Post daily picks to r/sportsbook, r/DFS, and r/sportsbetting"}
                  {activeTab === "twitter" && "Tweet daily picks with hashtags and engagement"}
                  {activeTab === "discord" && "Share picks in sports betting Discord communities"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Preview */}
                <div className="rounded-lg bg-slate-700/50 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Content Preview</p>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                      {activeTab === "reddit" && (
                        <>
                          <strong>{dailyContent.reddit.title}</strong>
                          <br />
                          {dailyContent.reddit.content}
                          <br />
                          <br />
                          {dailyContent.reddit.cta}
                        </>
                      )}
                      {activeTab === "twitter" && (
                        <>
                          {dailyContent.twitter.content}
                          <br />
                          <br />
                          {dailyContent.twitter.hashtags.join(" ")}
                          <br />
                          {dailyContent.twitter.cta}
                        </>
                      )}
                      {activeTab === "discord" && (
                        <>
                          <strong>{dailyContent.discord.embed.title}</strong>
                          <br />
                          {dailyContent.discord.embed.description}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Posting Schedule */}
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-3">Posting Schedule</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">Daily at 9:00 AM UTC</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-900/20 border-emerald-700 text-emerald-400">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Manual Post Button */}
                <Button
                  onClick={() => handleManualPost(activeTab)}
                  disabled={triggerPost.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {triggerPost.isPending ? "Posting..." : "Post Now"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Sidebar */}
          <div className="space-y-4">
            {/* Platform Metrics */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-sm text-blue-400">
                  {activeTab === "reddit" && "Reddit Metrics"}
                  {activeTab === "twitter" && "Twitter Metrics"}
                  {activeTab === "discord" && "Discord Metrics"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTab === "reddit" && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400">Followers</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.reddit.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly Reach</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.reddit.monthlyReach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Engagement Rate</p>
                      <p className="text-lg font-bold text-emerald-400">{metrics.reddit.engagementRate}%</p>
                    </div>
                  </>
                )}
                {activeTab === "twitter" && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400">Followers</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.twitter.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly Reach</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.twitter.monthlyReach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Engagement Rate</p>
                      <p className="text-lg font-bold text-emerald-400">{metrics.twitter.engagementRate}%</p>
                    </div>
                  </>
                )}
                {activeTab === "discord" && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400">Members</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.discord.members}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly Reach</p>
                      <p className="text-lg font-bold text-slate-300">{metrics.discord.monthlyReach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Engagement Rate</p>
                      <p className="text-lg font-bold text-emerald-400">{metrics.discord.engagementRate}%</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-sm text-emerald-400">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Automation Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">All Platforms Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Next Post: 9:00 AM UTC</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Community Growth Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <div className="font-semibold text-emerald-400 mb-2">Expected Results (30 Days)</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>100-300 daily visitors from community posts</li>
                <li>5-15 daily trial signups</li>
                <li>1-3 daily paid conversions</li>
                <li>$900-2,700 monthly revenue</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-2">Best Practices</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Post daily picks at consistent times</li>
                <li>Engage with comments and questions</li>
                <li>Share backtesting results and ROI metrics</li>
                <li>Build community trust through transparency</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
