import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { FAQPageJsonLd } from "@/components/SportsEventJsonLd";
import { Calculator, ArrowRight, Info } from "lucide-react";
import { Link } from "wouter";

function americanToImplied(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function impliedToAmerican(prob: number): number {
  if (prob >= 0.5) return Math.round(-100 * prob / (1 - prob));
  return Math.round(100 * (1 - prob) / prob);
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

const FAQS = [
  { question: "What is devigging (removing the vig)?", answer: "Devigging removes the bookmaker's built-in margin (vig/juice) from odds to reveal the true fair probability. Standard -110/-110 odds imply 52.38% for each side (total 104.76%), but the true probability is 50/50. The extra 4.76% is the vig." },
  { question: "How does proportional normalization work?", answer: "Proportional normalization divides each outcome's implied probability by the total implied probability. For -110/-110: each side is 52.38% / 104.76% = 50%. This is the industry-standard method used by sharp bettors and professional handicappers." },
  { question: "Why is devigging important for +EV betting?", answer: "To find +EV (positive expected value) bets, you need to know the true probability. If the fair probability is 50% but a sportsbook offers +105 (implied 48.8%), that's a +EV bet because you're getting better odds than the true probability suggests." },
  { question: "Which book should I use as the reference for devigging?", answer: "Use the sharpest book (lowest hold/vig) as your reference. Pinnacle is the gold standard. If unavailable, use the book with the tightest spread between sides. Our +EV Finder automatically uses the sharpest available book." },
];

export default function DevigCalculator() {
  const [odds1, setOdds1] = useState("-110");
  const [odds2, setOdds2] = useState("-110");
  const [odds3, setOdds3] = useState("");
  const [result, setResult] = useState<{
    fairProbs: number[];
    fairOdds: string[];
    hold: number;
    totalImplied: number;
  } | null>(null);

  useEffect(() => {
    document.title = "Free Devig Calculator | Remove Vig & Find Fair Odds | ChalkPicks";
  }, []);

  function calculate() {
    const oddsArr: number[] = [parseFloat(odds1), parseFloat(odds2)];
    if (odds3) oddsArr.push(parseFloat(odds3));
    if (oddsArr.some(isNaN) || oddsArr.some(o => o === 0)) return;

    const impliedProbs = oddsArr.map(americanToImplied);
    const totalImplied = impliedProbs.reduce((sum, p) => sum + p, 0);
    const fairProbs = impliedProbs.map(p => p / totalImplied);
    const fairOdds = fairProbs.map(p => formatOdds(impliedToAmerican(p)));
    const hold = (totalImplied - 1) * 100;

    setResult({ fairProbs, fairOdds, hold, totalImplied });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FAQPageJsonLd faqs={FAQS} pageId="devig-calculator" />

      <section className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Devig Calculator</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Remove the bookmaker's vig (juice) from any odds to find the true fair probability and no-vig line. 
            Essential for +EV betting and identifying mispriced lines.
          </p>

          {/* Calculator */}
          <div className="bg-card rounded-xl p-6 border border-border mb-8">
            <h2 className="font-semibold text-lg mb-4">Enter Odds (American Format)</h2>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Outcome 1</label>
                <input
                  type="text"
                  value={odds1}
                  onChange={(e) => setOdds1(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="-110"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Outcome 2</label>
                <input
                  type="text"
                  value={odds2}
                  onChange={(e) => setOdds2(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="-110"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Outcome 3 (optional)</label>
                <input
                  type="text"
                  value={odds3}
                  onChange={(e) => setOdds3(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Draw odds"
                />
              </div>
            </div>
            <button
              onClick={calculate}
              className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Remove Vig
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-card rounded-xl p-6 border border-border mb-8">
              <h3 className="font-semibold text-lg mb-4">Results</h3>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Book Hold (Vig)</p>
                  <p className="text-2xl font-bold text-red-400">{result.hold.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Total implied: {(result.totalImplied * 100).toFixed(2)}%</p>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Method</p>
                  <p className="text-lg font-semibold">Proportional Normalization</p>
                  <p className="text-xs text-muted-foreground mt-1">Industry standard devig method</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Outcome</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Fair Probability</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Fair Odds (No-Vig)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.fairProbs.map((prob, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 font-medium">Outcome {i + 1}</td>
                        <td className="py-3 text-right font-mono">{(prob * 100).toFixed(2)}%</td>
                        <td className="py-3 text-right font-mono font-semibold text-green-500">{result.fairOdds[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Compare these fair odds against what sportsbooks are offering. If a book offers better odds than the fair line, that's a <strong className="text-foreground">+EV bet</strong>.
                    <Link href="/ev-finder" className="text-primary hover:underline ml-1">Try our +EV Finder →</Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Devig Calculator FAQ</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 text-center p-8 bg-card rounded-xl border border-border">
            <h2 className="text-xl font-bold mb-2">Want Automated +EV Detection?</h2>
            <p className="text-muted-foreground mb-4">Our +EV Finder automatically deviggs every market across 15+ sportsbooks in real-time.</p>
            <Link href="/ev-finder" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Try +EV Finder <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
