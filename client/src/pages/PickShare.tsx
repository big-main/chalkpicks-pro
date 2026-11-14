import { useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import ConfidenceBar from "@/components/ConfidenceBar";
import { Brain, Zap, Target, TrendingUp } from "lucide-react";

export default function PickShare() {
  const { id } = useParams<{ id: string }>();
  const { data: pick, isLoading } = trpc.picks.byId.useQuery({
    id: parseInt(id ?? "0"),
  });

  // Update OG meta tags dynamically
  useEffect(() => {
    if (!pick) return;

    const title = `${pick.recommendation} - ${pick.awayTeam} vs ${pick.homeTeam} | ChalkPicks`;
    const description = `${pick.confidenceScore}% confidence pick on ${pick.recommendation} at ${pick.odds && pick.odds > 0 ? "+" : ""}${pick.odds}. ${pick.keyFactors || "AI-powered sports pick."}`;
    const imageUrl = `https://chalkpicks.pro/og-pick-${pick.id}.png`;

    // Update title
    document.title = title;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Update OG tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateOGTag("og:title", title);
    updateOGTag("og:description", description);
    updateOGTag("og:image", imageUrl);
    updateOGTag("og:type", "website");
    updateOGTag("og:url", window.location.href);

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateTwitterTag("twitter:card", "summary_large_image");
    updateTwitterTag("twitter:title", title);
    updateTwitterTag("twitter:description", description);
    updateTwitterTag("twitter:image", imageUrl);
    updateTwitterTag("twitter:site", "@chalkpickspro");
  }, [pick]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container">
          <div className="max-w-2xl mx-auto space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pick) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container text-center">
          <h2 className="font-display text-3xl">Pick not found</h2>
        </div>
      </div>
    );
  }

  const resultClass =
    pick?.result === "win"
      ? "badge-win"
      : pick?.result === "loss"
        ? "badge-loss"
        : pick?.result === "push"
          ? "badge-push"
          : "badge-pending";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="container py-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Share Card */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#39ff14] via-[#39ff14]/60 to-transparent" />
              <CardContent className="p-8">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <Badge
                    className={`text-xs ${pick.tier === "premium" ? "badge-premium" : "badge-free"} border-0`}
                  >
                    {pick.tier === "premium" ? "⭐ Premium" : "Free"}
                  </Badge>
                  <span className="text-xs text-muted-foreground uppercase font-medium bg-secondary px-2 py-0.5 rounded">
                    {pick.sportKey}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pick.pickType?.replace("_", "/")}
                  </span>
                  <Badge
                    className={`text-xs ${resultClass} border-0 capitalize ml-auto`}
                  >
                    {pick.result}
                  </Badge>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-muted-foreground mb-2">
                    {pick.awayTeam} @ {pick.homeTeam}
                  </div>
                  <h1 className="font-display text-5xl tracking-wider text-foreground mb-3">
                    {pick.recommendation}
                  </h1>
                  {pick.odds && (
                    <div className="text-2xl text-[#39ff14] font-bold">
                      {pick.odds > 0 ? `+${pick.odds}` : pick.odds}
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-[#39ff14]" />
                      <span className="text-xs text-muted-foreground">
                        Confidence
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#39ff14]">
                      {pick.confidenceScore || 0}%
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#f0b800]" />
                      <span className="text-xs text-muted-foreground">
                        +EV Edge
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#f0b800]">
                      +{Number(pick.edgeScore || 0).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#60a5fa]" />
                      <span className="text-xs text-muted-foreground">
                        Kelly Bet
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#60a5fa]">
                      2.1%
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#06b6d4]" />
                      <span className="text-xs text-muted-foreground">
                        Exp. ROI
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#06b6d4]">
                      14.2%
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-sm text-muted-foreground mb-4">
                    Get access to all AI picks, steam alerts, and advanced
                    analytics
                  </p>
                  <a
                    href="/pricing"
                    className="inline-block px-6 py-2 rounded-lg bg-[#39ff14] text-black font-semibold hover:bg-[#39ff14]/90 transition-colors"
                  >
                    View Pricing
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
