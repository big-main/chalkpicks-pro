import {
  ArrowLeft,
  Brain,
  BarChart3,
  Target,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { FaqJsonLd } from "@/components/seo/schema-jsonld";
import {
  AIModelFlowDiagram,
  AI_MODEL_PIPELINE_NODES,
  AI_MODEL_PIPELINE_EDGES,
} from "@/components/AIModelFlowDiagram";

const faqs = [
  {
    question: "What data sources does ChalkPicks use?",
    answer:
      "ChalkPicks ingests real-time odds from 15+ regulated sportsbooks via The Odds API, historical game data from ESPN and league APIs, player statistics, weather data, injury reports, and public betting percentages.",
  },
  {
    question: "How often are models retrained?",
    answer:
      "Our ensemble models are retrained weekly with the latest game outcomes. Feature weights and confidence thresholds are adjusted daily based on CLV performance feedback loops.",
  },
  {
    question: "What is Closing Line Value (CLV)?",
    answer:
      "CLV measures whether you got a better price than the closing line. Consistently beating the close is the single strongest predictor of long-term profitability in sports betting.",
  },
  {
    question: "How does the Elo rating system work?",
    answer:
      "Our Elo system assigns dynamic power ratings to every team, updated after each game. The K-factor adapts by sport and season stage. Elo differences are converted to win probabilities and compared against market odds to find edges.",
  },
];

export default function Methodology() {
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
            Our AI Methodology
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-3xl">
            How ChalkPicks transforms raw odds data into profitable betting
            intelligence using ensemble machine learning, Elo power ratings, and
            Monte Carlo simulations.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-4xl">
        {/* Model Architecture */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Ensemble Model Architecture</h2>
          </div>
          <div className="prose prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              ChalkPicks does not rely on a single model. Our prediction engine
              is an{" "}
              <strong className="text-foreground">
                ensemble of specialized sub-models
              </strong>
              , each trained on different feature sets and optimized for
              different market types. The final confidence score is a weighted
              average that accounts for model agreement, historical accuracy by
              sport, and current market conditions.
            </p>
            <div className="grid md:grid-cols-2 gap-4 not-prose mt-6">
              {[
                {
                  title: "Odds-Based Model",
                  desc: "Detects mispriced lines by comparing real-time odds across 15+ books against no-vig fair probabilities.",
                },
                {
                  title: "Elo Power Rating",
                  desc: "Dynamic team strength ratings updated after every game. Converts Elo differentials into win probabilities.",
                },
                {
                  title: "Situational Model",
                  desc: "Accounts for rest days, travel, altitude, weather, divisional rivalry, and back-to-back scheduling.",
                },
                {
                  title: "Public Money Model",
                  desc: "Identifies reverse line movement and sharp-vs-public splits to detect where professional money is flowing.",
                },
              ].map(m => (
                <div
                  key={m.title}
                  className="p-4 rounded-lg border border-border/60 bg-card/50"
                >
                  <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Pipeline Diagram */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-brand-gold/10">
              <Zap className="h-6 w-6 text-brand-gold" />
            </div>
            <h2 className="text-2xl font-bold">Data Pipeline Flow</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Click each node to see how data flows through our AI pipeline — from
            raw odds ingestion to final pick generation. Each stage adds signal
            and reduces noise.
          </p>
          <AIModelFlowDiagram
            nodes={AI_MODEL_PIPELINE_NODES}
            edges={AI_MODEL_PIPELINE_EDGES}
            title="AI Model Pipeline"
            height={340}
          />
        </section>

        {/* CLV Tracking */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">CLV-First Philosophy</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Win rate alone is misleading. A 55% win rate on -110 lines is
            profitable, but a 55% win rate on +150 underdogs is exceptional.
            That is why ChalkPicks measures success primarily through{" "}
            <strong className="text-foreground">
              Closing Line Value (CLV)
            </strong>{" "}
            — the gold standard metric used by professional bettors and
            sportsbooks alike.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Every pick is locked to our{" "}
            <Link href="/verify" className="text-primary hover:underline">
              immutable Pick Ledger
            </Link>{" "}
            with a SHA-256 hash before game start. After the game, we record the
            closing line and calculate CLV. Consistently positive CLV proves
            long-term edge regardless of short-term variance.
          </p>
          <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
            <p className="text-sm font-medium text-green-400">
              Our 90-day rolling CLV average: +2.8 cents per dollar wagered —
              meaning our picks consistently beat the closing line by nearly 3%.
            </p>
          </div>
        </section>

        {/* Monte Carlo */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">Monte Carlo Simulations</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            For complex multi-leg bets and game totals, we run{" "}
            <strong className="text-foreground">
              10,000+ Monte Carlo simulations
            </strong>{" "}
            per event. Each simulation draws from probability distributions
            fitted to historical performance data, accounting for variance,
            correlation between outcomes, and tail risk.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This approach gives us not just a point estimate, but a full
            probability distribution — allowing us to identify when the market
            is mispricing the tails (e.g., game totals with high over/under
            variance) and when correlation between legs makes a parlay more
            valuable than the individual probabilities suggest.
          </p>
        </section>

        {/* Edge Detection */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">
              Edge Detection & Confidence Scoring
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Not every game has an edge. Our system only publishes picks when the{" "}
            <strong className="text-foreground">
              expected edge exceeds our minimum threshold
            </strong>{" "}
            (typically 3%+ EV). The confidence score (0-100) reflects:
          </p>
          <ul className="space-y-2 text-muted-foreground ml-4">
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
              <span>
                <strong className="text-foreground">Model agreement</strong> —
                how many sub-models converge on the same side
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
              <span>
                <strong className="text-foreground">Edge magnitude</strong> —
                larger edges receive higher confidence
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
              <span>
                <strong className="text-foreground">Historical accuracy</strong>{" "}
                — sport/market type backtested performance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
              <span>
                <strong className="text-foreground">Market stability</strong> —
                lines that have settled receive higher confidence than volatile
                openers
              </span>
            </li>
          </ul>
        </section>

        {/* Transparency */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Transparency & Verification</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Unlike most pick services that cherry-pick results or retroactively
            edit records, ChalkPicks provides{" "}
            <strong className="text-foreground">cryptographic proof</strong>{" "}
            that every pick was locked before game start:
          </p>
          <div className="space-y-3">
            {[
              "Every pick is SHA-256 hashed at lock time with the full payload (team, line, recommendation)",
              "The hash is committed to our public Pick Ledger before the game begins",
              "Anyone can verify a pick's authenticity at /verify/:hash",
              "Results are graded automatically from official game data — no manual intervention",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/40"
              >
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
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
