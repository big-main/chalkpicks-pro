import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Star, TrendingUp, TrendingDown } from "lucide-react";

export default function FeedbackAnalytics() {
  const { data: analytics, isLoading } = trpc.feedback.getFeedbackAnalytics.useQuery();
  const { data: topPicks } = trpc.feedback.getTopRatedPicks.useQuery({ limit: 10, minFeedback: 3 });
  const { data: worstPicks } = trpc.feedback.getWorstRatedPicks.useQuery({ limit: 10, minFeedback: 3 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sentimentData = analytics && (analytics.sentimentBreakdown as any).positive !== undefined
    ? [
        { name: "Positive", value: (analytics.sentimentBreakdown as any).positive, fill: "#22c55e" },
        { name: "Neutral", value: (analytics.sentimentBreakdown as any).neutral, fill: "#6b7280" },
        { name: "Negative", value: (analytics.sentimentBreakdown as any).negative, fill: "#ef4444" },
      ]
    : [];

  const ratingData = analytics && analytics.ratingDistribution
    ? [
        { rating: "5 Stars", count: (analytics.ratingDistribution as any)[5] || 0 },
        { rating: "4 Stars", count: (analytics.ratingDistribution as any)[4] || 0 },
        { rating: "3 Stars", count: (analytics.ratingDistribution as any)[3] || 0 },
        { rating: "2 Stars", count: (analytics.ratingDistribution as any)[2] || 0 },
        { rating: "1 Star", count: (analytics.ratingDistribution as any)[1] || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 container">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Feedback Analytics</h1>
            <p className="text-muted-foreground">Community insights on AI-generated picks</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Feedback</p>
                    <p className="text-3xl font-bold text-foreground">{analytics?.totalFeedback || 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
                    <p className="text-3xl font-bold text-foreground">{analytics?.avgRating.toFixed(1) || "0"}</p>
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.round(analytics?.avgRating || 0) ? "fill-gold text-gold" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Positive Sentiment</p>
                    <p className="text-3xl font-bold text-brand-green">
                      {analytics && (analytics.sentimentBreakdown as any).positive ? Math.round(((analytics.sentimentBreakdown as any).positive / analytics.totalFeedback) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-brand-green opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="rating" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Rated Picks */}
          {topPicks && topPicks.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-green" />
                  Top Rated Picks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPicks.map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <div>
                        <p className="font-semibold text-foreground">{pick.recommendation}</p>
                        <p className="text-xs text-muted-foreground">{pick.sportKey}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-1 justify-end mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.round((pick as any).avgRating) ? "fill-gold text-gold" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{(pick as any).feedbackCount} ratings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worst Rated Picks */}
          {worstPicks && worstPicks.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-brand-red" />
                  Picks Needing Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {worstPicks.map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30">
                      <div>
                        <p className="font-semibold text-foreground">{pick.recommendation}</p>
                        <p className="text-xs text-muted-foreground">{pick.sportKey}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-1 justify-end mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.round((pick as any).avgRating) ? "fill-red-400 text-brand-red" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{(pick as any).feedbackCount} ratings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
