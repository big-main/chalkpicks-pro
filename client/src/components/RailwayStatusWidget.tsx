import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2, Server, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusConfig = {
  ACTIVE: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400", label: "Active" },
  FAILED: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", dot: "bg-red-400", label: "Failed" },
  DEPLOYING: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", dot: "bg-amber-400", label: "Deploying" },
};

const healthConfig = {
  passing: { color: "text-emerald-400", icon: CheckCircle2, label: "Passing" },
  failing: { color: "text-red-400", icon: AlertCircle, label: "Failing" },
  unknown: { color: "text-slate-400", icon: AlertCircle, label: "Unknown" },
};

// Map raw Railway status to display badge
const rawStatusBadge: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: "Success", color: "text-emerald-400" },
  BUILDING: { label: "Building", color: "text-amber-400" },
  DEPLOYING: { label: "Deploying", color: "text-amber-400" },
  SLEEPING: { label: "Sleeping", color: "text-blue-400" },
  FAILED: { label: "Failed", color: "text-red-400" },
  CRASHED: { label: "Crashed", color: "text-red-400" },
  REMOVED: { label: "Removed", color: "text-slate-400" },
};

export default function RailwayStatusWidget() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.railway.status.useQuery(undefined, {
    refetchInterval: 30_000, // auto-refresh every 30s
    retry: 1,
  });

  const redeploy = trpc.railway.redeploy.useMutation({
    onSuccess: () => {
      toast.success("Railway redeploy triggered");
      setTimeout(() => utils.railway.status.invalidate(), 3000);
    },
    onError: (e) => toast.error(`Redeploy failed: ${e.message}`),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Loading Railway status...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-400">Railway API unavailable</span>
      </div>
    );
  }

  const sc = statusConfig[data.status];
  const hc = healthConfig[data.healthCheck];
  const HealthIcon = hc.icon;
  const rawBadge = rawStatusBadge[data.latestStatus] ?? { label: data.latestStatus, color: "text-slate-400" };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-foreground">Railway Backup</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => utils.railway.status.invalidate()}
            className="h-7 px-2 text-slate-400 hover:text-white"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => redeploy.mutate()}
            disabled={redeploy.isPending || data.status === "DEPLOYING"}
            className="h-7 px-2 text-slate-400 hover:text-amber-400"
            title="Trigger redeploy"
          >
            {redeploy.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Project */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Project</span>
          <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
            {data.projectName}
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Status</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.border} border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${data.status === "DEPLOYING" ? "animate-pulse" : ""}`} />
            {sc.label}
          </div>
        </div>

        {/* Raw Railway status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Deploy State</span>
          <span className={`text-xs font-medium ${rawBadge.color}`}>{rawBadge.label}</span>
        </div>

        {/* Health */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Health Check</span>
          <div className={`flex items-center gap-1 text-xs ${hc.color}`}>
            <HealthIcon className="w-3.5 h-3.5" />
            {hc.label}
          </div>
        </div>

        {/* Last Deploy */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Last Deploy</span>
          <span className="text-xs text-foreground">{timeAgo(data.lastDeployment)}</span>
        </div>

        {/* URL */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">URL</span>
          <a
            href={data.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#39ff14] hover:underline"
          >
            {data.deploymentUrl.replace("https://", "")}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Recent deployments */}
      {data.deployments.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-[10px] text-slate-500 mb-1.5">Recent deployments</p>
          <div className="space-y-1">
            {data.deployments.slice(0, 3).map((d: { id: string; status: string; createdAt: string; updatedAt: string; url: string | null }) => {
              const rb = rawStatusBadge[d.status] ?? { label: d.status, color: "text-slate-400" };
              return (
                <div key={d.id} className="flex items-center justify-between">
                  <span className={`text-[10px] ${rb.color}`}>{rb.label}</span>
                  <span className="text-[10px] text-slate-600">{timeAgo(d.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-[10px] text-slate-600">
          Primary: Manus (chalkpicks.live) · Backup: Railway · Auto-refreshes every 30s
        </p>
      </div>
    </div>
  );
}
