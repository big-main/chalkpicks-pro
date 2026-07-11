import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AuthPageShell from "@/components/AuthPageShell";
import { Lock } from "lucide-react";

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)", color: "white" };

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthPageShell rightLink={{ href: "/signup", label: "Sign Up" }}>
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl text-foreground">
          Welcome{" "}
          <span className="text-gold-gradient">Back</span>
        </h1>
        <p className="text-muted-foreground mt-4">
          Access your picks, stats, and advanced betting tools
        </p>
      </div>

      <Card className="glass-card-static mb-8">
        <CardHeader>
          <CardTitle className="text-foreground text-xl font-condensed">Log In to Your Account</CardTitle>
          <CardDescription className="text-muted-foreground">Enter your email and password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "#a8a8b0" }}>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "#a8a8b0" }}>Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={inputStyle} />
            </div>
            {error && <p style={{ color: "#ff4d4d", fontSize: "0.875rem" }}>{error}</p>}
            <Button type="submit" className="btn-premium w-full h-11 text-base" size="lg" disabled={loginMutation.isPending}>
              <Lock className="w-5 h-5 mr-2" />
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p style={{ color: "#a8a8b0" }}>
          Don't have an account?{" "}
          <Link href="/signup">
            <a style={{ color: "#f0b800", fontWeight: 600, textDecoration: "none" }} className="hover:underline">Sign up here</a>
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
