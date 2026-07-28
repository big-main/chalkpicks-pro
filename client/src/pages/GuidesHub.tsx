import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { PageMeta } from "@/components/PageMeta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, TrendingUp, Calculator, DollarSign, BarChart3,
  Repeat, Layers, PiggyBank, ChevronRight, Clock, Zap, Brain
} from "lucide-react";

const GUIDES = [
  {
    icon: DollarSign,
    title: "How to Bet on NFL",
    description: "Learn the fundamentals of NFL betting including point spreads, moneylines, and totals. Understand how to read NFL odds and find value in the market.",
    difficulty: "Beginner",
    readTime: "8 min",
    slug: "how-to-bet-on-nfl",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: TrendingUp,
    title: "What is +EV Betting",
    description: "Discover how positive expected value (+EV) betting works and why it's the foundation of long-term profitable sports betting. Learn to identify +EV opportunities.",
    difficulty: "Intermediate",
    readTime: "10 min",
    slug: "what-is-ev-betting",
    color: "text-[#39ff14]",
    bg: "bg-[#39ff14]/10",
    border: "border-[#39ff14]/20",
  },
  {
    icon: Calculator,
    title: "Kelly Criterion Explained",
    description: "Master the Kelly Criterion formula for optimal bankroll sizing. Learn how to calculate the exact percentage of your bankroll to bet on each play.",
    difficulty: "Intermediate",
    readTime: "7 min",
    slug: "kelly-criterion-explained",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
  {
    icon: BookOpen,
    title: "How to Read Betting Odds",
    description: "Understand American, Decimal, and Fractional odds formats. Learn to convert between formats and calculate implied probability from any odds.",
    difficulty: "Beginner",
    readTime: "6 min",
    slug: "how-to-read-betting-odds",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: BarChart3,
    title: "What is CLV (Closing Line Value)",
    description: "Learn why closing line value is the best predictor of long-term betting success. Understand how sharp bettors use CLV to measure their edge.",
    difficulty: "Advanced",
    readTime: "9 min",
    slug: "closing-line-value-clv",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: Repeat,
    title: "Arbitrage Betting Guide",
    description: "Learn how to profit from arbitrage opportunities by betting both sides of a game at different sportsbooks. Includes risk-free arbitrage strategies.",
    difficulty: "Intermediate",
    readTime: "11 min",
    slug: "arbitrage-betting-guide",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: Layers,
    title: "Parlay Betting Strategy",
    description: "Discover when parlays make sense and when to avoid them. Learn correlation-aware parlay building and how to use same-game parlays profitably.",
    difficulty: "Intermediate",
    readTime: "8 min",
    slug: "parlay-betting-strategy",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
  {
    icon: PiggyBank,
    title: "Bankroll Management 101",
    description: "Build a sustainable betting bankroll with proven money management strategies. Learn unit sizing, stop-loss rules, and how to track your performance.",
    difficulty: "Beginner",
    readTime: "7 min",
    slug: "bankroll-management-101",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
];

const FAQS = [
  {
    question: "What is the best sports betting strategy for beginners?",
    answer:
      "The best strategy for beginners is flat betting (wagering the same amount on every bet), focusing on one or two sports you know well, and tracking every bet. Start with 1-2% of your bankroll per bet and focus on finding +EV opportunities rather than chasing big parlays.",
  },
  {
    question: "How do I find value bets in sports betting?",
    answer:
      "Value bets occur when the sportsbook's implied probability is lower than your estimated true probability. Use sharp market odds (Pinnacle, Circa) as a reference, look for line discrepancies across books, and use tools like the ChalkPicks +EV finder to identify value automatically.",
  },
  {
    question: "What win rate do I need to be profitable at -110 odds?",
    answer:
      "At standard -110 odds (American), you need to win at least 52.4% of your bets to break even. To be profitable, aim for 54%+ win rate. The break-even win rate varies by odds — use our ROI calculator to find your specific break-even point.",
  },
  {
    question: "Is sports betting profitable long-term?",
    answer:
      "Yes, but only for a small percentage of bettors who apply disciplined bankroll management, focus on +EV plays, and track their performance rigorously. Using AI-powered tools like ChalkPicks to identify edges significantly improves your chances of long-term profitability.",
  },
];

const difficultyColor = (d: string) =>
  d === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
  d === "Intermediate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
  "bg-red-500/10 text-red-400 border-red-500/20";

export default function GuidesHub() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta pathname="/guides" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Sports Betting Guides", url: "https://chalkpicks.live/guides" },
        ]}
      />
      <FaqJsonLd faqs={FAQS} />
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[radial-gradient(ellipse,rgba(57,255,20,0.04)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 container pt-28 pb-20 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-xs font-bold">
            <Brain className="w-3.5 h-3.5" /> FREE EDUCATION
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sports Betting Guides<br />
            <span className="text-[#39ff14]">&amp; Strategy</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From beginner fundamentals to advanced sharp betting strategies. Everything you need to bet smarter and build a profitable edge.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
          {[
            { value: "8", label: "Free Guides" },
            { value: "52%+", label: "Win Rate Needed" },
            { value: "100%", label: "Free Forever" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
              <p className="text-2xl font-bold text-[#39ff14]">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link key={guide.slug} href={`/blog/${guide.slug}`}>
                <NeonCard className="p-5 h-full hover:border-[#39ff14]/30 transition-all duration-200 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-lg ${guide.bg} border ${guide.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${guide.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-[10px] border ${difficultyColor(guide.difficulty)}`}>
                      {guide.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {guide.readTime}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground mb-2 group-hover:text-[#39ff14] transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{guide.description}</p>
                  <div className={`text-xs font-semibold ${guide.color} flex items-center gap-1 mt-auto`}>
                    Read Guide <ChevronRight className="w-3 h-3" />
                  </div>
                </NeonCard>
              </Link>
            );
          })}
        </div>

        {/* Tools CTA */}
        <div className="mb-16 p-8 rounded-2xl text-center" style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.12)" }}>
          <Zap className="w-10 h-10 text-[#39ff14] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Put Your Knowledge to Work</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Use our free betting calculators to apply these strategies in real time — odds converter, Kelly calculator, EV calculator, and more.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/tools">
              <Button className="bg-[#39ff14] hover:bg-[#32e012] text-black font-bold px-8">
                Free Betting Tools →
              </Button>
            </Link>
            <Link href="/picks">
              <Button variant="outline" className="border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10">
                View AI Picks
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq) => (
              <NeonCard key={faq.question} className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-[#39ff14] mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
              </NeonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
