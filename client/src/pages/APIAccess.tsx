import { motion } from "framer-motion";
import { Code, Zap, BarChart3, Lock, Plus, Trash2, Copy, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FeatureGate } from "@/components/FeatureGate";

const TIER_LIMITS: Record<string, number> = { basic: 100, pro: 1000, enterprise: 10000 };
const TIER_COLORS: Record<string, string> = {
  basic: "bg-gray-700 text-gray-200",
  pro: "bg-blue-900 text-blue-200",
  enterprise: "bg-purple-900 text-purple-200",
};

function APIAccessInner() {
  const [newKeyName, setNewKeyName] = useState("");
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [newlyGenerated, setNewlyGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);

  const { data: keys = [], refetch } = trpc.apiKeys.list.useQuery();
  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => {
      setNewlyGenerated(data.key);
      refetch();
      toast.success("API Key Generated", { description: `Key created with ${TIER_LIMITS[data.tier] ?? 100} req/day limit.` });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });
  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      refetch();
      setRevokeId(null);
      toast.success("Key Revoked", { description: "API key has been permanently revoked." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    { method: "GET", path: "/api/v1/picks", description: "Get picks by sport and date", example: "/api/v1/picks?sport=NFL&date=2026-07-16" },
    { method: "GET", path: "/api/v1/odds/ev", description: "Get positive EV opportunities", example: "/api/v1/odds/ev?sport=basketball_nba&minEV=3" },
    { method: "GET", path: "/api/v1/odds/devig", description: "Devig any set of odds", example: "/api/v1/odds/devig?odds=-110,-110" },
    { method: "GET", path: "/api/v1/elo/ratings", description: "Get Elo power ratings by sport", example: "/api/v1/elo/ratings?sport=nfl" },
    { method: "GET", path: "/api/v1/leaderboard", description: "Get live leaderboard rankings", example: "/api/v1/leaderboard?limit=50" },
    { method: "POST", path: "/api/v1/bets/track", description: "Track a bet and get CLV updates", example: "POST body: { sport, team, odds, stake }" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Code className="text-primary w-7 h-7" />
          <h1 className="text-3xl font-bold">API Access</h1>
        </div>
        <p className="text-muted-foreground">
          Integrate ChalkPicks data into your own tools. Generate API keys, monitor usage, and explore endpoints.
        </p>
      </motion.div>

      {/* API Keys Section */}
      <Card className="mb-8 border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Your API Keys</CardTitle>
          <Button size="sm" onClick={() => setShowGenDialog(true)} disabled={keys.length >= 5}>
            <Plus className="w-4 h-4 mr-1" /> Generate Key
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>No API keys yet. Generate your first key to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="text-sm font-mono text-primary">{key.keyPrefix}••••••••</code>
                    <span className="text-sm text-muted-foreground">{key.name}</span>
                    <Badge className={`text-xs ${TIER_COLORS[key.tier] ?? TIER_COLORS.basic}`}>{key.tier}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{key.requestsToday}/{TIER_LIMITS[key.tier] ?? 100} today</span>
                    <span className="hidden sm:block">{key.requestsTotal} total</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRevokeId(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { tier: "basic", label: "Free Tier", limit: "100 req/day", desc: "Basic picks & odds data" },
          { tier: "pro", label: "Pro Tier", limit: "1,000 req/day", desc: "EV, CLV, devig endpoints" },
          { tier: "enterprise", label: "Enterprise", limit: "10,000 req/day", desc: "Full API access + Elo" },
        ].map((t) => (
          <Card key={t.tier} className="border border-border">
            <CardContent className="pt-5">
              <Badge className={`mb-2 ${TIER_COLORS[t.tier]}`}>{t.label}</Badge>
              <p className="font-semibold text-foreground">{t.limit}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Endpoints */}
      <Card className="border border-border mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" /> Available Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.path} className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={ep.method === "GET" ? "text-green-400 border-green-800" : "text-yellow-400 border-yellow-800"}>
                    {ep.method}
                  </Badge>
                  <code className="text-sm font-mono text-primary">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.description}</p>
                <code className="text-xs text-muted-foreground/70 mt-1 block">{ep.example}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Example */}
      <Card className="border border-border mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" /> Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Pass your API key in the <code className="text-primary">X-API-Key</code> header:</p>
          <pre className="bg-muted/30 rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto">
{`curl https://chalkpicks.live/api/v1/picks \\
  -H "X-API-Key: cp_your_key_here" \\
  -H "Content-Type: application/json"`}
          </pre>
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
          </DialogHeader>
          {newlyGenerated ? (
            <div className="space-y-4">
              <p className="text-sm text-amber-400 font-medium">⚠️ Copy this key now — it will never be shown again.</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={showKey ? newlyGenerated : newlyGenerated.slice(0, 12) + "•".repeat(20)}
                  className="font-mono text-sm"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newlyGenerated)}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowGenDialog(false); setNewlyGenerated(null); setNewKeyName(""); }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Key Name (optional)</label>
                <Input
                  placeholder="e.g. My App, n8n Workflow"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={64}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenDialog(false)}>Cancel</Button>
                <Button
                  onClick={() => generateMutation.mutate({ name: newKeyName || "Default" })}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
                  Generate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeId !== null} onOpenChange={(o) => !o && setRevokeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action is permanent. Any applications using this key will lose access immediately.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => revokeId !== null && revokeMutation.mutate({ id: revokeId })}
              disabled={revokeMutation.isPending}
            >
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function APIAccess() {
  return (
    <FeatureGate feature="clvTracker">
      <APIAccessInner />
    </FeatureGate>
  );
}
