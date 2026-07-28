import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2, Server } from "lucide-react";

interface DeploymentStatus {
  projectName: string;
  status: "ACTIVE" | "FAILED" | "DEPLOYING";
  lastDeployment: string;
  deploymentUrl: string;
  healthCheck: "passing" | "failing" | "unknown";
  environment: string;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const MOCK_STATUS: DeploymentStatus = {
  projectName: "ChalkPicks-Pro",
  status: "ACTIVE",
  lastDeployment: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  deploymentUrl: "https://www.chalkpicks.live",
  healthCheck: "passing",
  environment: "production",
};

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

export default function RailwayStatusWidget() {
  const [status, setStatus] = useState<DeploymentStatus>(MOCK_STATUS);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setStatus({ ...MOCK_STATUS, lastDeployment: new Date(Date.now() - Math.random() * 3600000).toISOString() });
    setRefreshing(false);
  };

  const sc = statusConfig[status.status];
  const hc = healthConfig[status.healthCheck];
  const HealthIcon = hc.icon;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-foreground">Backup Deployment</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-7 px-2 text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-2.5">
        {/* Project Name */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Project</span>
          <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
            {status.projectName}
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Status</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.border} border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${status.status === "DEPLOYING" ? "animate-pulse" : ""}`} />
            {sc.label}
          </div>
        </div>

        {/* Environment */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Environment</span>
          <span className="text-xs text-foreground capitalize">{status.environment}</span>
        </div>

        {/* Health Check */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Health Check</span>
          <div className={`flex items-center gap-1 text-xs ${hc.color}`}>
            <HealthIcon className="w-3.5 h-3.5" />
            {hc.label}
          </div>
        </div>

        {/* Last Deployment */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Last Deploy</span>
          <span className="text-xs text-foreground">{timeAgo(status.lastDeployment)}</span>
        </div>

        {/* URL */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">URL</span>
          <a
            href={status.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#39ff14] hover:underline"
          >
            {status.deploymentUrl.replace("https://", "")}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Note */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-[10px] text-slate-600">
          Primary deployment: Manus (chalkpicks.live) · This is the backup Railway mirror
        </p>
      </div>
    </div>
  );
}
