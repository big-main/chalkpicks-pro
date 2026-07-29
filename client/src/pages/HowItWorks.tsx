import {
  ArrowLeft,
  Database,
  Cpu,
  CheckCircle,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { FaqJsonLd } from "@/components/seo/schema-jsonld";
import { AIModelFlowDiagram } from "@/components/AIModelFlowDiagram";

// Platform flow nodes for the How It Works page
const PLATFORM_FLOW_NODES = [
  {
    id: "odds",
    label: "Odds API",
    x: 50,
    y: 60,
    color: "#3b82f6",
    description: "15+ sportsbooks polled every 60s",
  },
  {
    id: "data",
    label: "Data Lake",
    x: 200,
    y: 60,
    color: "#8b5cf6",
    description: "50K+ data points/day stored",
  },
  {
    id: "ensemble",
    label: "AI Ensemble",
    x: 350,
    y: 60,
    color: "#f59e0b",
    description: "4 models vote on each game",
  },
  {
    id: "filter",
    label: "Edge Filter",
    x: 500,
    y: 60,
    color: "#10b981",
    description: "Only EV > 3% passes",
  },
  {
    id: "ledger",
    label: "Pick Ledger",
    x: 650,
    y: 60,
    color: "#ef4444",
    description: "SHA-256 hash locked",
  },
  {
    id: "delivery",
    label: "You",
    x: 800,
    y: 60,
    color: "#06b6d4",
    description: "Push notification + dashboard",
  },
];

const PLATFORM_FLOW_EDGES = [
  { from: "odds", to: "data" },
  { from: "data", to: "ensemble" },
  { from: "ensemble", to: "filter" },
  { from: "filter", to: "ledger" },
  { from: "ledger", to: "delivery" },
];

const steps = [
  {
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "1. Data Ingestion",
    description:
      "Every 60 seconds, our system pulls real-time odds from 15+ regulated sportsbooks via The Odds API. We also ingest injury reports, weather data, team schedules, and public betting percentages.",
    detail:
      "Over 50,000 data points processed per day across NFL, NBA, MLB, NHL, NCAAF, NCAAB, MMA, and soccer.",
  },
  {
    icon: Cpu,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "2. AI Model Scoring",
    description:
      "Our ensemble of specialized models analyzes each game independently. The Elo engine calculates power ratings, the odds model identifies mispriced lines, and the situational model accounts for context.",
    detail:
      "Each model votes on the optimal side. Only games where models agree AND expected value exceeds 3% are published.",
  },
  {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "3. Lock & Verify",
    description:
      "Qualifying picks are locked to our immutable Pick Ledger with a SHA-256 cryptographic hash. This proves the pick existed before game start — no retroactive editing possible.",
    detail:
      "Every pick includes: team, line at lock, confidence score, edge rating, and full AI analysis.",
  },
  {
    icon: Bell,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "4. Delivery & Alerts",
    description:
      "Picks are published to your dashboard, sent via push notification, and posted to our social channels. Premium members get real-time steam move alerts and line movement notifications.",
    detail:
      "Morning picks drop by 9 AM ET. Live alerts fire within 30 seconds of sharp money detection.",
  },
];

const faqs = [
  {
    question: "How many picks does ChalkPicks publish per day?",
    answer:
      "Typically 3-8 picks per day across all sports. We prioritize quality over quantity — only games with clear edges are published. Some days may have fewer picks if the market is efficient.",
  },
  {
    question: "Can I verify that picks weren't edited after the game?",
    answer:
      "Yes. Every pick is SHA-256 hashed before game start and committed to our public Pick Ledger. Visit /verify/:hash to independently verify any pick's authenticity and lock time.",
  },
  {
    question: "What sports does ChalkPicks cover?",
    answer:
      "NFL, NBA, MLB, NHL, NCAAF, NCAAB, MMA/UFC, and major soccer leagues. Coverage scales with season — NFL dominates fall/winter, MLB in summer.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FaqJsonLd faqs={faqs} />

      {/* Header */}
      <div className="border-b border-border/40 bg-card/50">
        <div className="container py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            How ChalkPicks Works
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-3xl">
            From raw odds data to profitable picks in four steps. No black boxes
            — full transparency on how our AI generates and verifies every
            recommendation.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="container py-12 max-w-4xl">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-border/40 hidden md:block" />
              )}
              <div className="flex gap-4 md:gap-6">
                <div className={`shrink-0 p-3 rounded-xl ${step.bg} h-fit`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{step.title}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/40">
                    <p className="text-xs text-muted-foreground italic">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Platform Flow Diagram */}
        <div className="mt-16 mb-16">
          <h2 className="text-xl font-bold mb-4">Platform Flow Diagram</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Hover over each node to see what happens at each stage of the
            pipeline.
          </p>
          <AIModelFlowDiagram
            nodes={PLATFORM_FLOW_NODES}
            edges={PLATFORM_FLOW_EDGES}
            title="ChalkPicks Platform Flow"
            height={200}
          />
        </div>

        {/* After delivery - grading */}
        <div className="mt-16 p-6 rounded-xl border border-border/60 bg-card/50">
          <h2 className="text-xl font-bold mb-4">
            After the Game: Automated Grading
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Once the game ends, our system automatically grades every pick using
            official results from ESPN and league data feeds. We record:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Result", value: "Win / Loss / Push" },
              { label: "Closing Line", value: "Final line before kickoff" },
              { label: "CLV", value: "Did we beat the close?" },
            ].map(item => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-background/50 border border-border/40 text-center"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            All results are publicly visible on our{" "}
            <Link href="/results" className="text-primary hover:underline">
              Results page
            </Link>{" "}
            and{" "}
            <Link href="/performance" className="text-primary hover:underline">
              Performance dashboard
            </Link>
            .
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to see it in action?
          </h2>
          <p className="text-muted-foreground mb-6">
            Start with free daily picks or unlock the full suite of AI tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/free-picks"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get Free Picks <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-card transition-colors"
            >
              Read Our Methodology
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div
                key={faq.question}
                className="p-4 rounded-lg border border-border/60 bg-card/50"
              >
                <h3 className="font-semibold text-sm mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
