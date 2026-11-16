import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DataIntelligence() {
  const [, setLocation] = useLocation();
  const { data: me } = trpc.auth.me.useQuery();
  const health = trpc.stats.providerHealth.useQuery(undefined, {
    enabled: me?.role === "admin",
    refetchInterval: 60_000,
    retry: false,
  });
  const providerYear = new Date().getUTCFullYear();
  const providerDate = new Date().toISOString().slice(0, 10);
  const collegeGames = trpc.stats.collegeFootballGames.useQuery(
    { year: providerYear },
    { enabled: me?.role === "admin", staleTime: 10 * 60_000, retry: false }
  );
  const nbaGames = trpc.stats.nbaProviderGames.useQuery(
    { date: providerDate },
    { enabled: me?.role === "admin", staleTime: 2 * 60_000, retry: false }
  );

  useEffect(() => {
    if (me !== undefined && (!me || me.role !== "admin")) setLocation("/");
  }, [me, setLocation]);

  if (!me || me.role !== "admin") return null;
  const providers = health.data ?? [];
  const healthy = providers.filter(
    provider => provider.status === "healthy"
  ).length;
  const missing = providers.filter(
    provider => provider.status === "missing_key"
  ).length;
  const failed = providers.filter(
    provider => provider.status === "error"
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f4ee] px-4 py-8 text-[#17243a] md:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#9a6b43]">
              ChalkPicks / Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Data Intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Live connection checks for optional sports-data providers. Keys
              stay server-side and are never displayed.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void health.refetch();
              void collegeGames.refetch();
              void nbaGames.refetch();
            }}
            disabled={
              health.isFetching ||
              collegeGames.isFetching ||
              nbaGames.isFetching
            }
            className="border-slate-300 bg-white text-slate-800"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${health.isFetching ? "animate-spin" : ""}`}
            />
            Refresh checks
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Healthy providers"
            value={healthy}
            detail="Successful live API checks"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <Metric
            label="Keys missing"
            value={missing}
            detail="Awaiting secure configuration"
            icon={<ShieldAlert className="h-5 w-5" />}
          />
          <Metric
            label="Provider errors"
            value={failed}
            detail="Configured but unreachable/rejected"
            icon={<CircleAlert className="h-5 w-5" />}
          />
        </section>

        <Card className="border-[#e4dfd3] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Provider connections</CardTitle>
            <CardDescription>
              Every status comes from a server-side request or an explicit
              missing-key state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.isLoading && (
              <p className="text-sm text-slate-500">
                Checking provider connections…
              </p>
            )}
            {health.error && (
              <p className="text-sm text-red-700">
                Unable to load provider health. Confirm administrator access and
                retry.
              </p>
            )}
            {providers.map(provider => (
              <div
                key={provider.provider}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-[#f4f1e9] p-2">
                    <Activity className="h-5 w-5 text-[#9a6b43]" />
                  </div>
                  <div>
                    <div className="font-semibold">{provider.provider}</div>
                    <p className="mt-1 text-sm text-slate-500">
                      {provider.message}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {provider.checkedAt
                        ? new Date(provider.checkedAt).toLocaleString()
                        : "Not checked"}
                      {provider.latencyMs !== null
                        ? ` · ${provider.latencyMs} ms`
                        : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    provider.status === "healthy"
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                      : provider.status === "missing_key"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                  }
                >
                  {provider.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            ))}
            {!health.isLoading && providers.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <WifiOff className="h-4 w-4" />
                No provider checks returned.
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          <SnapshotCard
            title="College football games"
            detail={`CFBD · ${providerYear} season`}
            loading={collegeGames.isLoading || collegeGames.isFetching}
            error={collegeGames.error?.message}
            count={
              collegeGames.data?.available
                ? collegeGames.data.data.length
                : null
            }
            fetchedAt={
              collegeGames.data?.available
                ? collegeGames.data.fetchedAt
                : undefined
            }
            freshUntil={
              collegeGames.data?.available
                ? collegeGames.data.freshUntil
                : undefined
            }
          />
          <SnapshotCard
            title="NBA games today"
            detail={`BALLDONTLIE · ${providerDate}`}
            loading={nbaGames.isLoading || nbaGames.isFetching}
            error={nbaGames.error?.message}
            count={nbaGames.data?.available ? nbaGames.data.data.length : null}
            fetchedAt={
              nbaGames.data?.available ? nbaGames.data.fetchedAt : undefined
            }
            freshUntil={
              nbaGames.data?.available ? nbaGames.data.freshUntil : undefined
            }
          />
        </section>

        <Card className="border-[#e4dfd3] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Connected capabilities</CardTitle>
            <CardDescription>
              Optional adapters added without replacing the primary odds
              providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">CollegeFootballData:</strong>{" "}
              authenticated college-football game retrieval by season and
              optional week with a 10-minute cache.
            </p>
            <p>
              <strong className="text-slate-900">BALLDONTLIE:</strong> NBA games
              by date with a 2-minute cache. Player game stats remain plan-gated
              by the provider.
            </p>
            <p>
              <strong className="text-slate-900">Integrity:</strong> provider
              failures return explicit errors or unavailable states. No sample
              scores, synthetic stats, or client-visible keys.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SnapshotCard({
  title,
  detail,
  count,
  loading,
  error,
  fetchedAt,
  freshUntil,
}: {
  title: string;
  detail: string;
  count: number | null;
  loading: boolean;
  error?: string;
  fetchedAt?: string;
  freshUntil?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const isStale = Boolean(freshUntil && Date.parse(freshUntil) <= now);
  return (
    <Card className="border-[#e4dfd3] bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-3xl font-bold">
          {loading ? "…" : error || count === null ? "Unavailable" : count}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {error ? "Provider request failed; no fallback data shown." : detail}
        </p>
        {fetchedAt && (
          <p
            className={`mt-2 text-xs ${isStale ? "text-amber-700" : "text-emerald-700"}`}
          >
            {isStale ? "Stale snapshot" : "Fresh snapshot"} · retrieved{" "}
            {new Date(fetchedAt).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-[#e4dfd3] bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="rounded-xl bg-[#f4f1e9] p-3 text-[#9a6b43]">{icon}</div>
      </CardContent>
    </Card>
  );
}
