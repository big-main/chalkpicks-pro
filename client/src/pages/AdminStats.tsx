import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import RailwayStatusWidget from "@/components/RailwayStatusWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminStats() {
  const [, setLocation] = useLocation();
  const { data: meData } = trpc.auth.me.useQuery();
  const user = meData;

  // Redirect non-admins
  useEffect(() => {
    if (user !== undefined && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Fetch real-time stats
  const { data: stats, isLoading } = trpc.system.siteStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user list
  const { data: usersData } = trpc.admin.getUsers.useQuery({ limit: 100, offset: 0 }, {
    refetchInterval: 60000, // Refresh every minute
  });
  const users = usersData?.users || [];

  if (user === undefined || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const totalUsers = stats?.totalMembers || 0;
  const paidSubscribers = stats?.paidSubscribers || 0;
  const picksToday = stats?.picksToday || 0;
  const winRate = stats?.winRate || 0;
  const newsletterSubs = stats?.newsletterSubscribers || 0;
  const totalPicksGenerated = stats?.totalPicksGenerated || 0;

  const newSignupsToday = users.filter((u: any) => {
    const createdAt = new Date(u.createdAt);
    const today = new Date();
    return (
      createdAt.getFullYear() === today.getFullYear() &&
      createdAt.getMonth() === today.getMonth() &&
      createdAt.getDate() === today.getDate()
    );
  }).length || 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Real-time platform metrics</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{paidSubscribers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalUsers > 0 ? Math.round((paidSubscribers / totalUsers) * 100) : 0}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Picks Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{picksToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Released today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">All-time record</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Signups Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newSignupsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Fresh registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Newsletter Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newsletterSubs}</div>
              <p className="text-xs text-muted-foreground mt-1">Email list size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Picks Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPicksGenerated}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time picks</p>
            </CardContent>
          </Card>
        </div>

        {/* Deployment Status */}
        <div className="mb-8">
          <RailwayStatusWidget />
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium">Email</th>
                    <th className="text-left py-2 px-2 font-medium">Tier</th>
                    <th className="text-left py-2 px-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.subscriptionTier === "free" ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"}`}>
                          {u.subscriptionTier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
