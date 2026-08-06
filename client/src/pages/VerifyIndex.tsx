/**
 * /verify — Public Pick Ledger Index
 * Shows the 10 most recent hash-locked picks with verification links.
 * No login required — this is a trust/transparency page.
 */
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import {
  Shield,
  ExternalLink,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { formatSportLabel } from "@/lib/badges";
import { PageMeta } from "@/components/PageMeta";
import { FaqJsonLd } from "@/components/seo/schema-jsonld";

const FAQ_ITEMS = [
  {
    question: "What is the ChalkPicks Pick Ledger?",
    answer:
      "The Pick Ledger is an immutable record of every pick published before the game starts. Each pick is SHA-256 hashed at publish time so no one can alter it retroactively.",
  },
  {
    question: "How do I verify a pick?",
    answer:
      "Click any pick's hash link to open its verification page. You'll see the exact recommendation, odds, and confidence score that were locked in before the game — plus the final result once graded.",
  },
  {
    question: "Why does this matter?",
    answer:
      "Most picks sites can claim any win rate they want. The Pick Ledger proves our picks existed before the game, making our track record independently verifiable.",
  },
  {
    question: "Can I verify a pick I received?",
    answer:
      "Yes. If you have a pick's hash (shown on the pick card), visit /verify/{hash} to confirm it was locked before game time.",
  },
];

function resultBadge(result: string | null) {
  if (!result || result === "pending") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
        PENDING
      </span>
    );
  }
  if (result === "win") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
        WIN
      </span>
    );
  }
  if (result === "loss") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
        LOSS
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/25">
      {result.toUpperCase()}
    </span>
  );
}

export default function VerifyIndex() {
  const { data, isLoading } = trpc.clv.getRecentLedger.useQuery({ limit: 10 });
  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta pathname="/verify" />
      <FaqJsonLd faqs={FAQ_ITEMS} />
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-bold tracking-widest rounded-full bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.2)] text-[#39ff14]">
            <Shield className="w-3 h-3" /> IMMUTABLE LEDGER
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">
            Pick <span className="text-emerald-gradient">Verification</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            Every pick is SHA-256 hashed before the game starts. Click any entry
            to verify the exact recommendation, odds, and confidence score that
            were locked in — no retroactive edits possible.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: <Shield className="w-5 h-5 text-[#39ff14]" />,
              title: "Pre-game lock",
              desc: "Picks are hashed the moment they're published, before any game starts.",
            },
            {
              icon: <CheckCircle2 className="w-5 h-5 text-[#39ff14]" />,
              title: "Public hash",
              desc: "The SHA-256 hash is publicly visible and independently verifiable.",
            },
            {
              icon: <Clock className="w-5 h-5 text-[#39ff14]" />,
              title: "Graded after",
              desc: "Results are added after the game — the original pick content never changes.",
            },
          ].map(s => (
            <div
              key={s.title}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(57,255,20,0.04)",
                border: "1px solid rgba(57,255,20,0.12)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {s.icon}
                <span className="font-bold text-sm">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent picks */}
        <h2 className="text-xl font-bold mb-4">10 Most Recent Locked Picks</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="p-12 text-center rounded-xl"
            style={{
              background: "rgba(57,255,20,0.04)",
              border: "1px solid rgba(57,255,20,0.12)",
            }}
          >
            <HelpCircle className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-bold mb-2">No ledger entries yet</p>
            <p className="text-sm text-muted-foreground">
              Picks will appear here once they're published and locked.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry: any) => (
              <Link
                key={entry.contentHash}
                href={`/verify/${entry.contentHash}`}
              >
                <div
                  className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Sport + teams */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest rounded-full bg-[rgba(57,255,20,0.08)] text-[#39ff14] border border-[rgba(57,255,20,0.2)]">
                          {formatSportLabel(entry.sportKey)}
                        </span>
                        {resultBadge(entry.result)}
                        <span className="text-xs text-muted-foreground">
                          {entry.lockedAt
                            ? new Date(entry.lockedAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="font-bold text-sm">
                        {entry.awayTeam} @ {entry.homeTeam}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">
                        {entry.recommendation}
                      </div>
                    </div>

                    {/* Hash + verify link */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-[10px] font-mono text-muted-foreground bg-black/30 px-2 py-1 rounded hidden sm:block">
                        {entry.contentHash?.slice(0, 12)}…
                      </code>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#39ff14]">
                        Verify <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">How Verification Works</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <h3 className="font-bold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
