import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import NeonCard from "@/components/NeonCard";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Clock, Hash, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function Verify() {
  const [, params] = useRoute("/verify/:hash");
  const hash = params?.hash ?? "";

  const { data, isLoading, error } = trpc.clv.verifyByHash.useQuery(
    { hash },
    { enabled: hash.length >= 16 }
  );

  const { data: skill } = trpc.clv.modelSkill.useQuery();
  const entry = data?.found ? data.entry : null;

  useEffect(() => {
    document.title = entry
      ? `Verified · ${entry.recommendation} | ChalkPicks`
      : "Pick Verification | ChalkPicks";
  }, [entry]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container max-w-2xl pt-28 pb-20 relative z-10">
        <Link
          href="/performance"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#39ff14] mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Performance
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#39ff14]/10 border border-[#39ff14]/20">
            <Shield className="w-6 h-6 text-[#39ff14]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pick Verification</h1>
            <p className="text-sm text-white/45">
              Immutable pre-game lock · public proof
            </p>
          </div>
        </div>

        {skill && skill.gradedPicks > 0 && (
          <NeonCard className="p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">
                Model CLV Skill
              </p>
              <p className="text-2xl font-bold text-[#39ff14]">
                {skill.skillRating}
              </p>
            </div>
            <div className="text-right text-sm text-white/50">
              <p>
                {skill.gradedPicks} graded · avg CLV {skill.avgClv ?? "—"}%
              </p>
              <Badge className="mt-1 bg-slate-700/50 text-slate-200">
                {skill.tier}
              </Badge>
            </div>
          </NeonCard>
        )}

        <NeonCard className="p-6">
          <div className="flex items-center gap-2 mb-4 text-xs text-white/40 font-mono break-all">
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            {hash || "—"}
          </div>

          {isLoading && (
            <p className="text-white/50 text-sm">Looking up ledger…</p>
          )}

          {error && (
            <p className="text-red-400 text-sm">
              Could not reach verification service.
            </p>
          )}

          {!isLoading && data && !data.found && (
            <div className="text-center py-8">
              <p className="text-white/60 mb-2">
                No public ledger entry for this hash.
              </p>
              <p className="text-xs text-white/35">
                Hashes are created when picks are published pre-game.
              </p>
            </div>
          )}

          {entry && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-lg font-bold text-white">
                    {entry.awayTeam} @ {entry.homeTeam}
                  </p>
                  <p className="text-[#39ff14] font-semibold mt-1">
                    {entry.recommendation}
                  </p>
                  <p className="text-xs text-white/40 mt-1 uppercase">
                    {entry.sportKey}
                  </p>
                </div>
                <ResultBadge result={String(entry.result)} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta
                  label="Locked at"
                  value={fmt(entry.lockedAt)}
                  icon={<Clock className="w-3.5 h-3.5" />}
                />
                <Meta label="Game start" value={fmt(entry.gameStartAt)} />
                <Meta
                  label="Line at lock"
                  value={
                    entry.lineAtLock !== null ? String(entry.lineAtLock) : "—"
                  }
                />
                <Meta
                  label="Closing line"
                  value={
                    entry.closingLine !== null
                      ? String(entry.closingLine)
                      : "Pending"
                  }
                />
                <Meta
                  label="CLV"
                  value={
                    entry.clvValue !== null
                      ? `${Number(entry.clvValue).toFixed(2)}%`
                      : "Pending"
                  }
                />
                <Meta label="Graded" value={fmt(entry.gradedAt)} />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-[#39ff14]">
                <CheckCircle2 className="w-4 h-4" />
                Snapshot hashed pre-game · cannot be edited without invalidating
                this proof
              </div>

              {entry.pickId !== null && (
                <Link
                  href={`/picks/${entry.pickId}`}
                  className="text-sm text-white/50 hover:text-[#39ff14]"
                >
                  View pick →
                </Link>
              )}
            </div>
          )}
        </NeonCard>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    win: "bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/30",
    loss: "bg-red-500/15 text-red-400 border-red-500/30",
    push: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    pending: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    void: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };
  return (
    <Badge className={`border ${colors[result] ?? colors.pending}`}>
      {result.toUpperCase()}
    </Badge>
  );
}

function Meta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/35 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-white/80 mt-0.5">{value}</p>
    </div>
  );
}

function fmt(v: unknown): string {
  if (!v) return "—";
  try {
    return new Date(v as string).toLocaleString();
  } catch {
    return String(v);
  }
}
