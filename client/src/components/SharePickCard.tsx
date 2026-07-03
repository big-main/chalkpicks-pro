import { useState } from "react";
import { Share2, Twitter, Link2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SharePickCardProps {
  pick: {
    id: number;
    recommendation: string;
    homeTeam?: string | null;
    awayTeam?: string | null;
    sportKey: string;
    pickType: string;
    odds?: number | null;
    confidenceScore: number;
    edgeScore?: string | null;
    result: string;
    pickDate: string;
    isFeatured?: boolean;
  };
  className?: string;
}

function formatOdds(odds: number | null | undefined): string {
  if (!odds) return "—";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function sportLabel(key: string): string {
  const map: Record<string, string> = {
    americanfootball_nfl: "NFL",
    americanfootball_ncaaf: "NCAAF",
    basketball_nba: "NBA",
    basketball_ncaab: "NCAAB",
    baseball_mlb: "MLB",
    icehockey_nhl: "NHL",
    soccer_epl: "EPL",
    soccer_usa_mls: "MLS",
    tennis_atp: "ATP Tennis",
    mma_mixed_martial_arts: "MMA",
  };
  return map[key] ?? key.split("_").pop()?.toUpperCase() ?? key;
}

function confidenceColor(score: number): string {
  if (score >= 80) return "#00ff87";
  if (score >= 65) return "#ffd700";
  return "#ff6b35";
}

function resultBadge(result: string) {
  if (result === "win") return <span className="text-xs font-bold text-[#00ff87] bg-[#00ff87]/10 border border-[#00ff87]/30 px-2 py-0.5 rounded">WIN ✓</span>;
  if (result === "loss") return <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded">LOSS</span>;
  if (result === "push") return <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded">PUSH</span>;
  return <span className="text-xs font-bold text-gray-400 bg-gray-400/10 border border-gray-400/30 px-2 py-0.5 rounded">PENDING</span>;
}

export default function SharePickCard({ pick, className = "" }: SharePickCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pickUrl = `${window.location.origin}/picks/${pick.id}`;
  const matchup = pick.homeTeam && pick.awayTeam
    ? `${pick.awayTeam} @ ${pick.homeTeam}`
    : pick.recommendation;

  const tweetText = encodeURIComponent(
    `🎯 ${pick.recommendation}\n` +
    `📊 Confidence: ${pick.confidenceScore}% | Edge: ${pick.edgeScore ? `+${pick.edgeScore}%` : "—"}\n` +
    `💰 Odds: ${formatOdds(pick.odds)}\n` +
    `\nFree AI picks → ${pickUrl}\n#SportsBetting #ChalkPicks`
  );

  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pickUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={`text-gray-400 hover:text-[#00ff87] hover:bg-[#00ff87]/10 ${className}`}
      >
        <Share2 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d18] border-[#2a2a3a] max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#00ff87]" />
              Share This Pick
            </DialogTitle>
          </DialogHeader>

          {/* Pick Preview Card */}
          <div className="mx-6 my-4 rounded-xl overflow-hidden border border-[#2a2a3a] bg-gradient-to-br from-[#111118] to-[#0a0a14]">
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] bg-[#0a0a14]">
              <div className="flex items-center gap-2">
                <span className="text-[#00ff87] font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ⚡ ChalkPicks
                </span>
                <Badge className="bg-[#1a1a2a] text-gray-400 border-[#2a2a3a] text-xs">
                  {sportLabel(pick.sportKey)}
                </Badge>
                <Badge className="bg-[#1a1a2a] text-gray-400 border-[#2a2a3a] text-xs capitalize">
                  {pick.pickType.replace("_", " ")}
                </Badge>
              </div>
              {resultBadge(pick.result)}
            </div>

            {/* Matchup */}
            {pick.homeTeam && pick.awayTeam && (
              <div className="px-4 pt-3 pb-1 text-center">
                <p className="text-gray-400 text-xs mb-1">{matchup}</p>
              </div>
            )}

            {/* Recommendation */}
            <div className="px-4 py-3 text-center">
              <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {pick.recommendation}
              </p>
              {pick.odds && (
                <p className="text-[#ff6b35] font-mono font-bold text-xl mt-1">{formatOdds(pick.odds)}</p>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-[#2a2a3a] border-t border-[#2a2a3a]">
              <div className="py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Confidence</p>
                <p
                  className="text-lg font-bold font-mono"
                  style={{ color: confidenceColor(pick.confidenceScore) }}
                >
                  {pick.confidenceScore}%
                </p>
              </div>
              <div className="py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Edge</p>
                <p className="text-lg font-bold font-mono text-[#ffd700]">
                  {pick.edgeScore ? `+${parseFloat(pick.edgeScore).toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className="py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Odds</p>
                <p className="text-lg font-bold font-mono text-white">{formatOdds(pick.odds)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#0a0a14] border-t border-[#2a2a3a] text-center">
              <p className="text-xs text-gray-600">chalkpicks.live · Free AI Sports Picks</p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="px-6 pb-6 space-y-3">
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-semibold">
                <Twitter className="w-4 h-4 mr-2" />
                Share on X / Twitter
              </Button>
            </a>
            <Button
              onClick={copyLink}
              variant="outline"
              className="w-full border-[#2a2a3a] text-white hover:bg-[#1a1a2a]"
            >
              {copied ? (
                <><Check className="w-4 h-4 mr-2 text-[#00ff87]" /> Copied!</>
              ) : (
                <><Link2 className="w-4 h-4 mr-2" /> Copy Link</>
              )}
            </Button>
            <p className="text-xs text-gray-600 text-center">
              Share this pick and help grow the community 🎯
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
