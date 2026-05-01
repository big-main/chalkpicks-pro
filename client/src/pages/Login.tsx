import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowRight, Zap, Lock, Zap as ZapIcon } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080814" }}>
      {/* Navbar */}
      <div className="border-b" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
        <div className="container h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Zap className="w-6 h-6" style={{ color: "#00ff88" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.25rem", textTransform: "uppercase", color: "white" }}>
                ChalkPicks
              </span>
            </a>
          </Link>
          <Link href="/signup">
            <a>
              <Button style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", color: "#080814", fontWeight: 700 }}>
                Sign Up
              </Button>
            </a>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", textTransform: "uppercase", color: "white", lineHeight: 1.2 }}>
              Welcome{" "}
              <span style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Back
              </span>
            </h1>
            <p style={{ color: "#a8a8b0", fontSize: "1rem", marginTop: "1rem" }}>
              Access your picks, stats, and advanced betting tools
            </p>
          </div>

          {/* Login Card */}
          <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "8px", marginBottom: "2rem" }}>
            <CardHeader>
              <CardTitle style={{ color: "white", fontSize: "1.5rem" }}>Log In to Your Account</CardTitle>
              <CardDescription style={{ color: "#a8a8b0" }}>
                Access your ChalkPicks Pro dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                onClick={handleLogin}
                className="w-full"
                size="lg"
                style={{
                  background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)",
                  color: "#080814",
                  fontWeight: 700,
                  height: "2.75rem",
                  fontSize: "1rem",
                }}
              >
                <Lock className="w-5 h-5 mr-2" />
                Log In with Manus
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p style={{ color: "#666", fontSize: "0.75rem", textAlign: "center" }}>
                Secure login powered by Manus OAuth
              </p>
            </CardContent>
          </Card>

          {/* Sign Up Link */}
          <div className="text-center">
            <p style={{ color: "#a8a8b0" }}>
              Don't have an account?{" "}
              <Link href="/signup">
                <a style={{ color: "#00d4ff", fontWeight: 600, textDecoration: "none" }} className="hover:underline">
                  Sign up here
                </a>
              </Link>
            </p>
          </div>

          {/* Security Info */}
          <div style={{ marginTop: "3rem", padding: "1rem", background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: "6px" }}>
            <div className="flex gap-3">
              <ZapIcon className="w-5 h-5 flex-shrink-0" style={{ color: "#00d4ff", marginTop: "0.25rem" }} />
              <div>
                <p style={{ color: "#00d4ff", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>Secure & Fast</p>
                <p style={{ color: "#a8a8b0", fontSize: "0.75rem" }}>
                  Your login is protected by enterprise-grade security. No passwords stored locally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(0,212,255,0.1)", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          © 2026 ChalkPicks Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
