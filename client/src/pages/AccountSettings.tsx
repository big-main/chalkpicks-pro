import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { User, Mail, Lock, Bell, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Detect post-purchase redirect from Stripe Buy Button
  const searchParams = new URLSearchParams(window.location.search);
  const justSubscribed = searchParams.get("subscribed") === "true";
  const subscribedPlan = searchParams.get("plan") ?? "";
  const [showSuccessBanner, setShowSuccessBanner] = useState(justSubscribed);

  useEffect(() => {
    if (justSubscribed) {
      // Clean up URL without reload
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
      // Auto-dismiss after 8 seconds
      const t = setTimeout(() => setShowSuccessBanner(false), 8000);
      return () => clearTimeout(t);
    }
  }, [justSubscribed]);

  const logoutMutation = trpc.auth.logout.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(212,160,23,0.2)" }}>
          <CardContent className="pt-6">
            <p style={{ color: "#e8e8f0", marginBottom: "1rem" }}>Please log in to access account settings.</p>
            <Button onClick={() => setLocation("/login")} className="btn-premium">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      setLocation("/");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Post-purchase success banner */}
        {showSuccessBanner && (
          <div
            className="mb-6 flex items-start gap-4 p-5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(57,255,20,0.08) 0%, rgba(57,255,20,0.04) 100%)",
              border: "1px solid rgba(57,255,20,0.3)",
              boxShadow: "0 0 30px rgba(57,255,20,0.08)",
            }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(57,255,20,0.15)" }}>
              <CheckCircle className="w-5 h-5" style={{ color: "#39ff14" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: "#39ff14" }}>
                🎉 Payment Successful — Welcome to ChalkPicks{subscribedPlan === "monthly" ? " Monthly Pro" : subscribedPlan === "daily" ? " Daily Pass" : ""}!
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                Your subscription is now active. It may take a moment for your access to update — refresh the page if premium features aren't visible yet.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontWeight: 700, fontSize: "2rem", textTransform: "uppercase", color: "white" }}>
            Account Settings
          </h1>
          <p style={{ color: "#a8a8b0", marginTop: "0.5rem" }}>
            Manage your profile, security, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                  style={{
                    background: activeTab === tab.id ? "rgba(212,160,23,0.1)" : "transparent",
                    border: activeTab === tab.id ? "1px solid rgba(212,160,23,0.3)" : "1px solid rgba(212,160,23,0.1)",
                    color: activeTab === tab.id ? "#f0b800" : "#a8a8b0",
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(212,160,23,0.2)" }}>
                <CardHeader>
                  <CardTitle style={{ color: "white" }}>Profile Information</CardTitle>
                  <CardDescription style={{ color: "#a8a8b0" }}>
                    View and manage your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
                    <AlertDescription style={{ color: "#86efac" }}>
                      Your account is verified and in good standing
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label style={{ color: "#e8e8f0", fontSize: "0.875rem", fontWeight: 500 }}>Display Name</Label>
                    <Input
                      type="text"
                      value={user?.name || ""}
                      readOnly
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(212,160,23,0.2)",
                        color: "#e8e8f0",
                        marginTop: "0.5rem",
                      }}
                    />
                  </div>

                  <div>
                    <Label style={{ color: "#e8e8f0", fontSize: "0.875rem", fontWeight: 500 }}>Email Address</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(212,160,23,0.2)",
                          color: "#e8e8f0",
                        }}
                      />
                      <span style={{ color: "#22c55e", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center" }}>
                        ✓ Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: "#e8e8f0", fontSize: "0.875rem", fontWeight: 500 }}>Account Type</Label>
                    <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: "6px", color: "#f0b800", fontWeight: 600 }}>
                      {user?.subscriptionTier === "free" ? "No Active Subscription" : `${user?.subscriptionTier?.charAt(0).toUpperCase()}${user?.subscriptionTier?.slice(1)} Subscriber`}
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: "#e8e8f0", fontSize: "0.875rem", fontWeight: 500 }}>Member Since</Label>
                    <Input
                      type="text"
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                      readOnly
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(212,160,23,0.2)",
                        color: "#e8e8f0",
                        marginTop: "0.5rem",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(212,160,23,0.2)" }}>
                <CardHeader>
                  <CardTitle style={{ color: "white" }}>Security Settings</CardTitle>
                  <CardDescription style={{ color: "#a8a8b0" }}>
                    Manage your account security and login options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
                    <AlertDescription style={{ color: "#86efac" }}>
                      Your account is protected with secure authentication
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 style={{ color: "#e8e8f0", fontWeight: 600, marginBottom: "0.5rem" }}>Login Method</h3>
                    <p style={{ color: "#a8a8b0", fontSize: "0.875rem", marginBottom: "1rem" }}>
                      You're currently using email &amp; password authentication
                    </p>
                    <div style={{ padding: "1rem", background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: "6px", color: "#f0b800", fontSize: "0.875rem" }}>
                      ✓ Email &amp; Password Authentication
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: "#e8e8f0", fontWeight: 600, marginBottom: "0.5rem" }}>Last Login</h3>
                    <p style={{ color: "#a8a8b0", fontSize: "0.875rem" }}>
                      {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "Never"}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: "#e8e8f0", fontWeight: 600, marginBottom: "1rem" }}>Danger Zone</h3>
                    <Button
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#fca5a5",
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(212,160,23,0.2)" }}>
                <CardHeader>
                  <CardTitle style={{ color: "white" }}>Notification Preferences</CardTitle>
                  <CardDescription style={{ color: "#a8a8b0" }}>
                    Control how you receive updates and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { label: "Daily Picks", desc: "Get notified when new AI picks are available" },
                      { label: "Subscription Updates", desc: "Billing and subscription notifications" },
                      { label: "Performance Alerts", desc: "Weekly performance summaries" },
                      { label: "System Notifications", desc: "Important updates and maintenance alerts" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4" style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.1)", borderRadius: "6px" }}>
                        <div>
                          <p style={{ color: "#e8e8f0", fontWeight: 600, fontSize: "0.875rem" }}>{item.label}</p>
                          <p style={{ color: "#a8a8b0", fontSize: "0.75rem", marginTop: "0.25rem" }}>{item.desc}</p>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }} />
                      </div>
                    ))}
                  </div>

                  <Button className="btn-premium w-full">
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
