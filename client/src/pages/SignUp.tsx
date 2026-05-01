import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSignUp = () => {
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
          <Link href="/login">
            <a>
              <Button variant="outline" style={{ borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff" }}>
                Log In
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
              Join the{" "}
              <span style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Future
              </span>
            </h1>
            <p style={{ color: "#a8a8b0", fontSize: "1rem", marginTop: "1rem" }}>
              Get AI-powered sports betting picks with real-time odds and advanced analytics
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              { icon: TrendingUp, text: "AI picks with confidence scores" },
              { icon: Shield, text: "Real-time odds from 10+ sportsbooks" },
              { icon: Zap, text: "Advanced tools: Kelly Criterion, +EV Finder" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <feature.icon className="w-5 h-5" style={{ color: "#00d4ff" }} />
                <span style={{ color: "#e8e8f0" }}>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Sign Up Card */}
          <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "8px", marginBottom: "2rem" }}>
            <CardHeader>
              <CardTitle style={{ color: "white", fontSize: "1.5rem" }}>Create Your Account</CardTitle>
              <CardDescription style={{ color: "#a8a8b0" }}>
                Sign up in seconds with Manus
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                onClick={handleSignUp}
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
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                Sign Up with Manus
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p style={{ color: "#666", fontSize: "0.75rem", textAlign: "center" }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* Login Link */}
          <div className="text-center">
            <p style={{ color: "#a8a8b0" }}>
              Already have an account?{" "}
              <Link href="/login">
                <a style={{ color: "#00d4ff", fontWeight: 600, textDecoration: "none" }} className="hover:underline">
                  Log in here
                </a>
              </Link>
            </p>
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
