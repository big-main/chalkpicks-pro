import { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import { Brain, Lock, Filter, RefreshCw, Zap, Sparkles, ArrowUpDown, SlidersHorizontal, X, ChevronDown, Bell, BellOff, Crown } from "lucide-react";
import { toast } from "sonner";
import SharePickCard from "@/components/SharePickCard";

const PICK_TYPE_LABELS: Record<string, string> = {
  moneyline: "Moneyline",
  spread: "Spread",
  over_under: "Over/Under",
  player_prop: "Player Prop",
  parlay: "Parlay",
};

const SORT_OPTIONS = [
  { value: "confidence_desc", label: "Highest Confidence", icon: "🎯" },
  { value: "confidence_asc", label: "Lowest Confidence", icon: "🎯" },
  { value: "edge_desc", label: "Highest Edge", icon: "⚡" },
  { value: "edge_asc", label: "Lowest Edge", icon: "⚡" },
  { value: "newest", label: "Newest First", icon: "🕐" },
  { value: "oldest", label: "Oldest First", icon: "🕐" },
  { value: "odds_best", label: "Best Odds", icon: "💰" },
];

type SortOption = typeof SORT_OPTIONS[number]["value"];

const SPORTSBOOKS = [
  { value: "all", label: "All Books" },
  { value: "DraftKings", label: "DraftKings" },
  { value: "FanDuel", label: "FanDuel" },
  { value: "BetMGM", label: "BetMGM" },
  { value: "Caesars", label: "Caesars" },
  { value: "PointsBet", label: "PointsBet" },
  { value: "BetRivers", label: "BetRivers" },
  { value: "WynnBET", label: "WynnBET" },
  { value: "Barstool", label: "Barstool" },
];

interface FilterState {
  sport: string;
  tier: string;
  pickType: string;
  result: string;
  minConfidence: number;
  minEdge: number;
  sortBy: SortOption;
  sportsbook: string;
}

const DEFAULT_FILTERS: FilterState = {
  sport: "all",
  tier: "all",
  pickType: "all",
  result: "all",
  minConfidence: 0,
  minEdge: 0,
  sortBy: "confidence_desc",
  sportsbook: "all",
};

function getStoredFilters(): FilterState {
  try {
    const stored = localStorage.getItem("chalkpicks_pick_filters");
    if (stored) return { ...DEFAULT_FILTERS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_FILTERS;
}

function storeFilters(filters: FilterState) {
  try {
    localStorage.setItem("chalkpicks_pick_filters", JSON.stringify(filters));
  } catch {}
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-accent" : score >= 70 ? "bg-primary" : "bg-yellow-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className={`font-bold ${score >= 80 ? "text-accent" : "text-primary"}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PickCard({ pick, isPremiumUser, rank }: { pick: any; isPremiumUser: boolean; rank?: number }) {
  const isFreeUser = !isPremiumUser;
  const resultClass = pick.result === "win" ? "badge-win" : pick.result === "loss" ? "badge-loss" : pick.result === "push" ? "badge-push" : "badge-pending";
  const isTopPick = rank !== undefined && rank < 3;

  // Signal badges
  const signals: { label: string; className: string }[] = [];
  if (pick.confidenceScore >= 85) signals.push({ label: "HIGH ROI", className: "signal-high-roi" });
  if (pick.edgeScore >= 7) signals.push({ label: "SHARP", className: "signal-sharp" });
  if (pick.edgeScore >= 5 && pick.confidenceScore >= 75) signals.push({ label: "VALUE", className: "signal-value" });

  const topPickStyle = isTopPick ? {
    border: "1px solid rgba(255,215,0,0.5)",
    boxShadow: "0 0 16px rgba(255,215,0,0.12), inset 0 0 24px rgba(255,215,0,0.03)",
  } : {};

  const topPickLabels = ["🥇 Top Pick", "🥈 #2 Pick", "🥉 #3 Pick"];

  if (isFreeUser) {
    return (
      <Card className="bg-card border-border h-full relative overflow-hidden" style={topPickStyle}>
        {isTopPick && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #ffd700, #ffb300, transparent)" }} />
        )}
        <CardContent className="p-5">
          {isTopPick && (
            <div className="flex items-center gap-1.5 mb-3">
              <Crown className="w-3.5 h-3.5" style={{ color: "#ffd700" }} />
              <span className="text-xs font-bold" style={{ color: "#ffd700" }}>{topPickLabels[rank!]}</span>
            </div>
          )}
          <div className="space-y-4">
            <div className="font-bold text-foreground text-lg leading-tight">{pick.recommendation}</div>
            <div className="text-xs text-muted-foreground">{pick.awayTeam} @ {pick.homeTeam}</div>
            <div className="p-3 bg-primary/20 border border-primary/40 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs text-primary font-medium">Upgrade to see odds, confidence & analysis</span>
            </div>
            <button
              onClick={() => window.location.href = "/pricing"}
              className="w-full px-4 py-2 btn-cta text-white text-xs font-medium rounded-lg transition-colors"
            >
              START FREE TRIAL
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/picks/${pick.id}`}>
      <Card className="bg-card border-border card-hover cursor-pointer h-full relative overflow-hidden group" style={topPickStyle}>
        {isTopPick && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #ffd700, #ffb300, transparent)" }} />
        )}
        {!isTopPick && pick.isFeatured && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        )}
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isTopPick && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.25)" }}>
                  <Crown className="w-3 h-3" /> {topPickLabels[rank!]}
                </span>
              )}
              <Badge className={`text-xs ${pick.tier === "premium" ? "badge-premium" : "badge-free"} border-0`}>
                {pick.tier === "premium" ? "⭐ Premium" : "Free"}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase font-medium bg-secondary px-2 py-0.5 rounded">
                {pick.sportKey}
              </span>
              <span className="text-xs text-muted-foreground">{PICK_TYPE_LABELS[pick.pickType] ?? pick.pickType}</span>
            </div>
            <Badge className={`text-xs ${resultClass} border-0 capitalize`}>{pick.result}</Badge>
          </div>

          {/* Signal badges */}
          {signals.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {signals.map((s) => (
                <span key={s.label} className={s.className}>{s.label}</span>
              ))}
            </div>
          )}

          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">{pick.awayTeam} @ {pick.homeTeam}</div>
            <div className="font-bold text-foreground text-lg leading-tight">{pick.recommendation}</div>
            {pick.odds && (
              <div className="text-sm text-muted-foreground mt-0.5 font-medium">
                {pick.odds > 0 ? `+${pick.odds}` : pick.odds}
              </div>
            )}
            {pick.bookmakerName && (
              <div className="text-xs mt-1" style={{ color: "#f0b800" }}>
                📚 Best at {pick.bookmakerName}
              </div>
            )}
          </div>

          <ConfidenceBar score={pick.confidenceScore} />

          {pick.edgeScore && (
            <div className="mt-3 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Edge Score:</span>
              <span className="text-xs font-bold text-primary">{pick.edgeScore}/10</span>
            </div>
          )}

          {pick.aiAnalysis ? (
            <div className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {pick.aiAnalysis}
            </div>
          ) : null}

          {pick.keyFactors && Array.isArray(pick.keyFactors) && pick.keyFactors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {(pick.keyFactors as string[]).slice(0, 2).map((f: string, i: number) => (
                <span key={i} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-end" onClick={e => e.preventDefault()}>
            <SharePickCard pick={pick} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GeneratePickDialog({ open, onClose, onGenerated, sports }: {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
  sports: { key: string; name: string; icon: string }[];
}) {
  const [matchup, setMatchup] = useState("");
  const [genSport, setGenSport] = useState("nfl");
  const [context, setContext] = useState("");

  const generateAI = trpc.picks.generateAI.useMutation({
    onSuccess: () => {
      toast.success("AI pick generated! Refreshing picks...");
      setMatchup("");
      setContext("");
      onClose();
      onGenerated();
    },
    onError: (err) => toast.error(err.message || "Generation failed"),
  });

  const handleSubmit = () => {
    if (!matchup.trim()) {
      toast.error("Please enter a matchup (e.g. Chiefs vs Raiders)");
      return;
    }
    generateAI.mutate({ sportKey: genSport, matchup: matchup.trim(), context: context.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Generate AI Pick
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Sport</Label>
            <Select value={genSport} onValueChange={setGenSport}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Matchup</Label>
            <Input
              placeholder="e.g. Chiefs vs Raiders"
              value={matchup}
              onChange={(e) => setMatchup(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Context (optional)</Label>
            <Textarea
              placeholder="Any additional context..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="mt-1 text-xs min-h-20"
            />
          </div>
          <Button onClick={handleSubmit} disabled={generateAI.isPending} className="w-full h-8 text-xs">
            {generateAI.isPending ? "Generating..." : "Generate Pick"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterBar({
  filters,
  setFilters,
  sports,
  activeFilterCount,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  sports: { key: string; name: string; icon: string }[] | undefined;
  activeFilterCount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    storeFilters(next);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    storeFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Primary controls row — always visible */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort dropdown */}
        <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
          <SelectTrigger className="w-52 h-9 text-xs" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.15)" }}>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <SelectValue placeholder="Sort by..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2"><span>{opt.icon}</span><span>{opt.label}</span></span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sport filter */}
        <Select value={filters.sport} onValueChange={(v) => updateFilter("sport", v)}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports?.map((s: any) => (
              <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sportsbook filter */}
        <Select value={filters.sportsbook} onValueChange={(v) => updateFilter("sportsbook", v)}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SPORTSBOOKS.map((b) => (
              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tier filter */}
        <Select value={filters.tier} onValueChange={(v) => updateFilter("tier", v)}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Picks</SelectItem>
            <SelectItem value="free">Free Picks</SelectItem>
            <SelectItem value="premium">Premium Picks</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 relative"
          onClick={() => setExpanded(!expanded)}
          style={expanded ? { background: "rgba(0,255,135,0.08)", borderColor: "rgba(0,255,135,0.3)" } : {}}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-xs">More</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-background">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={resetFilters}>
            <X className="w-3 h-3" /> Clear All
          </Button>
        )}
      </div>

      {/* Expanded advanced filters */}
      {expanded && (
        <Card className="border-border" style={{ background: "rgba(0,255,135,0.02)", borderColor: "rgba(0,255,135,0.1)" }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bet Type */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bet Type</Label>
                <Select value={filters.pickType} onValueChange={(v) => updateFilter("pickType", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(PICK_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Result */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Result</Label>
                <Select value={filters.result} onValueChange={(v) => updateFilter("result", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="win">Wins Only</SelectItem>
                    <SelectItem value="loss">Losses Only</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="push">Pushes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Confidence */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Min Confidence: <span className="text-primary font-bold">{filters.minConfidence}%</span>
                </Label>
                <Slider
                  value={[filters.minConfidence]}
                  onValueChange={([v]) => updateFilter("minConfidence", v)}
                  min={0} max={95} step={5}
                  className="mt-2"
                />
              </div>

              {/* Min Edge */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Min Edge Score: <span className="text-primary font-bold">{filters.minEdge}/10</span>
                </Label>
                <Slider
                  value={[filters.minEdge]}
                  onValueChange={([v]) => updateFilter("minEdge", v)}
                  min={0} max={9} step={1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Quick filter presets */}
            <div className="mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground mr-3">Quick presets:</span>
              <div className="inline-flex gap-2 flex-wrap mt-1">
                <button
                  onClick={() => { const next = { ...filters, minConfidence: 80, minEdge: 5, sortBy: "confidence_desc" as SortOption }; setFilters(next); storeFilters(next); }}
                  className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.25)", color: "#00ff87" }}
                >🔥 High Confidence (80%+)</button>
                <button
                  onClick={() => { const next = { ...filters, minEdge: 7, sortBy: "edge_desc" as SortOption }; setFilters(next); storeFilters(next); }}
                  className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)", color: "#ff6b35" }}
                >⚡ Sharp Plays (Edge 7+)</button>
                <button
                  onClick={() => { const next = { ...filters, result: "win", sortBy: "confidence_desc" as SortOption }; setFilters(next); storeFilters(next); }}
                  className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: "#f0b800" }}
                >✅ Winners Only</button>
                <button
                  onClick={() => { const next = { ...filters, pickType: "player_prop", sortBy: "edge_desc" as SortOption }; setFilters(next); storeFilters(next); }}
                  className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: "#d4a017" }}
                >🏀 Player Props</button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Push notification opt-in button
function PushNotificationButton({ isPremiumUser }: { isPremiumUser: boolean }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery();
  const { data: statusData } = trpc.push.getStatus.useQuery(undefined, { enabled: isPremiumUser });
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  useEffect(() => {
    if (statusData) setSubscribed(statusData.subscribed);
  }, [statusData]);

  const handleToggle = useCallback(async () => {
    if (!isPremiumUser) {
      toast.error("Push notifications require an active subscription");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }
    setLoading(true);
    try {
      if (subscribed) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
        }
        setSubscribed(false);
        toast.success("Push notifications disabled");
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Please allow notifications in your browser settings");
          setLoading(false);
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const publicKey = vapidData?.publicKey;
        if (!publicKey) {
          toast.error("Push service not configured");
          setLoading(false);
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        const json = sub.toJSON();
        await subscribeMutation.mutateAsync({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          userAgent: navigator.userAgent.slice(0, 200),
        });
        setSubscribed(true);
        toast.success("🔔 You'll be notified when high-confidence picks drop!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update notification settings");
    }
    setLoading(false);
  }, [subscribed, isPremiumUser, vapidData, subscribeMutation, unsubscribeMutation]);

  if (!isPremiumUser) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-2"
      onClick={handleToggle}
      disabled={loading}
      style={subscribed ? { background: "rgba(0,255,135,0.08)", borderColor: "rgba(0,255,135,0.3)", color: "#00ff87" } : {}}
      title={subscribed ? "Disable pick alerts" : "Get notified for 85%+ confidence picks"}
    >
      {subscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
      <span className="text-xs hidden sm:inline">{subscribed ? "Alerts On" : "Get Alerts"}</span>
    </Button>
  );
}

export default function Picks() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(getStoredFilters);
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: picksData, isLoading, refetch } = trpc.picks.list.useQuery({
    sportKey: filters.sport === "all" ? undefined : filters.sport,
    tier: filters.tier === "all" ? undefined : (filters.tier as "free" | "premium" | "all"),
  });
  const { data: sports } = trpc.picks.sports.useQuery();

  const isPremiumUser = !!(user?.subscriptionTier && user.subscriptionTier !== "free");

  // Count active filters (beyond defaults)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sport !== "all") count++;
    if (filters.tier !== "all") count++;
    if (filters.pickType !== "all") count++;
    if (filters.result !== "all") count++;
    if (filters.minConfidence > 0) count++;
    if (filters.minEdge > 0) count++;
    if (filters.sortBy !== "confidence_desc") count++;
    if (filters.sportsbook !== "all") count++;
    return count;
  }, [filters]);

  // Client-side filtering and sorting
  const filteredAndSortedPicks = useMemo(() => {
    if (!picksData?.picks) return [];
    let picks = [...picksData.picks];

    // Apply client-side filters
    if (filters.pickType !== "all") picks = picks.filter((p: any) => p.pickType === filters.pickType);
    if (filters.result !== "all") picks = picks.filter((p: any) => p.result === filters.result);
    if (filters.minConfidence > 0) picks = picks.filter((p: any) => (p.confidenceScore || 0) >= filters.minConfidence);
    if (filters.minEdge > 0) picks = picks.filter((p: any) => (p.edgeScore || 0) >= filters.minEdge);
    if (filters.sportsbook !== "all") picks = picks.filter((p: any) =>
      p.bookmakerName?.toLowerCase().includes(filters.sportsbook.toLowerCase()) ||
      p.aiAnalysis?.toLowerCase().includes(filters.sportsbook.toLowerCase())
    );

    // Sort
    picks.sort((a: any, b: any) => {
      switch (filters.sortBy) {
        case "confidence_desc": return (b.confidenceScore || 0) - (a.confidenceScore || 0);
        case "confidence_asc": return (a.confidenceScore || 0) - (b.confidenceScore || 0);
        case "edge_desc": return (b.edgeScore || 0) - (a.edgeScore || 0);
        case "edge_asc": return (a.edgeScore || 0) - (b.edgeScore || 0);
        case "newest": return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest": return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "odds_best": return (b.odds || 0) - (a.odds || 0);
        default: return 0;
      }
    });

    return picks;
  }, [picksData?.picks, filters]);

  // Top 3 picks by combined confidence + edge score (pinned to top when no active filters)
  const topPickIds = useMemo(() => {
    if (!picksData?.picks) return new Set<number>();
    const sorted = [...picksData.picks]
      .filter((p: any) => p.result === "pending" || !p.result)
      .sort((a: any, b: any) => {
        const scoreA = (a.confidenceScore || 0) * 0.7 + (a.edgeScore || 0) * 3;
        const scoreB = (b.confidenceScore || 0) * 0.7 + (b.edgeScore || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 3);
    return new Set(sorted.map((p: any) => p.id));
  }, [picksData?.picks]);

  // When no active filters, pin top picks to the front
  const displayPicks = useMemo(() => {
    const hasActiveFilters = activeFilterCount > 0;
    if (hasActiveFilters) return filteredAndSortedPicks;
    const top = filteredAndSortedPicks.filter((p: any) => topPickIds.has(p.id));
    const rest = filteredAndSortedPicks.filter((p: any) => !topPickIds.has(p.id));
    return [...top, ...rest];
  }, [filteredAndSortedPicks, topPickIds, activeFilterCount]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2rem", textTransform: "uppercase", color: "white" }}>
              AI <span style={{ background: "linear-gradient(135deg, #f0b800 0%, #39ff14 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Picks</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Confidence-scored predictions across all sports</p>
          </div>
          <div className="flex items-center gap-3">
            <PushNotificationButton isPremiumUser={isPremiumUser} />
            <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9 gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {user?.role === "admin" && (
              <Button onClick={() => setGenerateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 h-9">
                <Brain className="w-4 h-4" /> Generate
              </Button>
            )}
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sports={sports}
          activeFilterCount={activeFilterCount}
        />

        {/* Results count */}
        {!isLoading && picksData?.picks && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              Showing <span className="text-primary font-bold">{displayPicks.length}</span> of {picksData.picks.length} picks
              {activeFilterCount > 0 && (
                <span className="ml-2 text-primary/70">({activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Sorted by: <span className="text-foreground font-medium">{SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label}</span>
            </p>
          </div>
        )}

        {/* Top Picks label */}
        {!isLoading && activeFilterCount === 0 && topPickIds.size > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4" style={{ color: "#ffd700" }} />
            <span className="text-xs font-bold" style={{ color: "#ffd700" }}>Today's Top Picks</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.3), transparent)" }} />
          </div>
        )}

        {/* Picks grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">Loading picks...</p>
          </div>
        ) : displayPicks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPicks.map((pick: any, idx: number) => {
              const rank = activeFilterCount === 0 && topPickIds.has(pick.id) ? idx : undefined;
              return <PickCard key={pick.id} pick={pick} isPremiumUser={isPremiumUser} rank={rank} />;
            })}
          </div>
        ) : (
          <Card className="bg-card border-border p-8 text-center">
            <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-3">No picks match your current filters.</p>
            <Button variant="outline" size="sm" onClick={() => { setFilters(DEFAULT_FILTERS); storeFilters(DEFAULT_FILTERS); }}>
              Reset Filters
            </Button>
          </Card>
        )}
      </div>

      <GeneratePickDialog open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={() => refetch()} sports={sports || []} />
    </div>
  );
}
