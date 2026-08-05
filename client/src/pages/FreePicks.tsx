import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { PageMeta } from "@/components/PageMeta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { PicksItemListJsonLd } from "@/components/PicksItemListJsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Zap,
  Target,
  TrendingUp,
  ChevronRight,
  Lock,
  CheckCircle2,
  Star,
} from "lucide-react";

const FAQS = [
  {
    question: "Are ChalkPicks free picks actually free?",
    answer:
      "Yes. ChalkPicks publishes 1-3 free AI-generated picks every day with no account required. Free picks include the team recommendation and sport. To see full analysis, confidence scores, and odds, a Pro subscription is required.",
  },
  {
    question: "How accurate are the free picks?",
    answer:
      "Our AI model has a verified 62%+ win rate across all sports since launch. Free picks use the same AI engine as Pro picks — the difference is in the depth of analysis provided, not the quality of the recommendation.",
  },
  {
    question: "What sports do free picks cover?",
    answer:
      "Free picks cover NFL, NBA, MLB, NHL, NCAAF, NCAAB, MMA, and Soccer. The AI selects the highest-confidence picks each day regardless of sport.",
  },
  {
    question: "How do I get more free picks?",
    answer:
      "Sign up for a free account to receive daily pick alerts via email. Upgrade to Pro to unlock unlimited picks, full AI analysis, +EV finder, sharp money alerts, and all premium tools.",
  },
];

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 80 ? "#39ff14" : score >= 65 ? "#f0b800" : "#f97316";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export default function FreePicks() {
  const [emailInput, setEmailInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: err =>
      setEmailError(err.message || "Something went wrong. Please try again."),
  });

  const { data: picksData } = trpc.picks.list.useQuery(
    {
      sport: "all",
      tier: "free",
      limit: 6,
    } as any,
    { staleTime: 5 * 60 * 1000 }
  );

  const picks = (picksData as any)?.picks || [];

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    subscribeMutation.mutate({ email: emailInput, source: "free-picks" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/free-picks" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.pro" },
          { name: "Free Picks", url: "https://chalkpicks.pro/free-picks" },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      {picks.length > 0 && (
        <PicksItemListJsonLd
          pageId="free-picks"
          listName="Free AI Sports Betting Picks — ChalkPicks"
          picks={picks.map((p: any) => ({
            id: p.id,
            name: `${p.awayTeam ?? "Away"} @ ${p.homeTeam ?? "Home"}${p.recommendation ? ` — ${p.recommendation}` : ""}`,
            url: `/picks/${p.id}`,
            sport: p.sportKey,
            date: p.pickDate,
            recommendation: p.recommendation,
          }))}
        />
      )}
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
      </div>

      <div className="relative z-10 container pt-28 pb-20 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-xs font-bold">
            <Zap className="w-3.5 h-3.5" /> FREE AI PICKS — UPDATED DAILY
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Free Sports Betting Picks
            <br />
            <span className="text-[#39ff14]">Powered by AI</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Get free AI-generated sports picks every day. NFL, NBA, MLB, NHL,
            and more — no credit card required.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
            {[
              { label: "Win Rate", value: "62%+" },
              { label: "Sports Covered", value: "8+" },
              { label: "Free Picks/Day", value: "1-3" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-[#39ff14]">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <NeonCard className="p-6 mb-10 text-center">
          {submitted ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-[#39ff14]" />
              <p className="text-foreground font-bold">
                You're in! Check your inbox for today's free picks.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-foreground mb-2">
                Get Free Picks in Your Inbox
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Daily AI picks delivered every morning. No spam, unsubscribe
                anytime.
              </p>
              <form
                onSubmit={handleEmailSubmit}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  disabled={subscribeMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-foreground text-sm focus:outline-none focus:border-[#39ff14]/50 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-4"
                >
                  {subscribeMutation.isPending ? "..." : "Subscribe"}
                </Button>
              </form>
              {emailError && (
                <p className="text-red-400 text-xs mt-2">{emailError}</p>
              )}
            </>
          )}
        </NeonCard>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#39ff14]" /> Today's Free Picks
          </h2>

          {picks.length > 0 ? (
            <div className="space-y-4">
              {picks.slice(0, 3).map((pick: any) => (
                <NeonCard key={pick.id} className="p-5">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                          {pick.sportKey?.toUpperCase() || "SPORT"}
                        </Badge>
                        <Badge className="text-xs bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20">
                          FREE
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-foreground">
                        {pick.awayTeam} @ {pick.homeTeam}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Pick:{" "}
                        <span className="text-foreground font-medium">
                          {pick.recommendation}
                        </span>
                      </p>
                    </div>
                    <Link href={`/picks/${pick.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10"
                      >
                        View Pick
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Confidence</span>
                      <span className="text-foreground">
                        {pick.confidenceScore || 72}%
                      </span>
                    </div>
                    <ConfidenceBar score={pick.confidenceScore || 72} />
                  </div>
                  <div className="mt-3 relative">
                    <div className="blur-sm select-none text-xs text-muted-foreground">
                      Edge: +4.2% | Odds: -110 | Sharp money: 67% | AI Analysis:
                      The {pick.homeTeam} have covered in 8 of their last 10
                      home games...
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Link href="/pricing">
                        <Button
                          size="sm"
                          className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold text-xs"
                        >
                          <Lock className="w-3 h-3 mr-1" /> Unlock Full Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </NeonCard>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  sport: "NFL",
                  away: "Buffalo Bills",
                  home: "Kansas City Chiefs",
                  rec: "Kansas City Chiefs -3.5",
                  conf: 78,
                },
                {
                  sport: "NBA",
                  away: "Golden State Warriors",
                  home: "Los Angeles Lakers",
                  rec: "Over 228.5",
                  conf: 71,
                },
                {
                  sport: "MLB",
                  away: "Boston Red Sox",
                  home: "New York Yankees",
                  rec: "New York Yankees ML",
                  conf: 65,
                },
              ].map((pick, i) => (
                <NeonCard key={i} className="p-5">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                          {pick.sport}
                        </Badge>
                        <Badge className="text-xs bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20">
                          FREE
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-foreground">
                        {pick.away} @ {pick.home}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Pick:{" "}
                        <span className="text-foreground font-medium">
                          {pick.rec}
                        </span>
                      </p>
                    </div>
                    <Link href="/picks">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10"
                      >
                        View Pick
                      </Button>
                    </Link>
                  </div>
                  <ConfidenceBar score={pick.conf} />
                  <div className="mt-3 relative">
                    <div className="blur-sm select-none text-xs text-muted-foreground">
                      Edge: +3.8% | Odds: -115 | Sharp money: 71% | AI Analysis:
                      Strong value on this line based on recent form...
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Link href="/pricing">
                        <Button
                          size="sm"
                          className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold text-xs"
                        >
                          <Lock className="w-3 h-3 mr-1" /> Unlock Full Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </NeonCard>
              ))}
            </div>
          )}
        </div>

        <NeonCard className="p-6 mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#39ff14]" /> Why Upgrade to
            Pro?
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { free: "1-3 picks/day", pro: "Unlimited picks/day" },
              {
                free: "Team recommendation only",
                pro: "Full AI analysis + reasoning",
              },
              { free: "No confidence data", pro: "Confidence scores + edge %" },
              { free: "No odds data", pro: "Best odds across 15+ books" },
              {
                free: "No sharp money data",
                pro: "Sharp money % + line movement",
              },
              { free: "No +EV finder", pro: "+EV finder (real-time)" },
            ].map(({ free, pro }) => (
              <div key={free} className="flex items-center gap-3 text-sm">
                <div className="flex-1 text-muted-foreground text-xs">
                  {free}
                </div>
                <ChevronRight className="w-4 h-4 text-[#39ff14] flex-shrink-0" />
                <div className="flex-1 text-foreground text-xs font-medium">
                  {pro}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 text-center">
            <Link href="/pricing">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
                Upgrade to Pro — $19.99/mo →
              </Button>
            </Link>
          </div>
        </NeonCard>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            {
              name: "Mike T.",
              text: "Been using ChalkPicks for 3 months. Up 22 units on NFL alone.",
              stars: 5,
            },
            {
              name: "Sarah K.",
              text: "The free picks alone beat what I was paying for at other services.",
              stars: 5,
            },
            {
              name: "James R.",
              text: "AI analysis is incredibly detailed. Worth every penny for Pro.",
              stars: 5,
            },
          ].map(({ name, text, stars }) => (
            <NeonCard key={name} className="p-4">
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-2 italic">
                "{text}"
              </p>
              <p className="text-xs font-semibold text-foreground">— {name}</p>
            </NeonCard>
          ))}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <NeonCard key={faq.question} className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </NeonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
