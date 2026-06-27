import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-dark-v2-Ey5FDp5iZKArkMRM3n8FwX.webp";

interface AuthPageShellProps {
  children: React.ReactNode;
  rightLink: { href: string; label: string; variant?: "default" | "outline" };
}

export default function AuthPageShell({ children, rightLink }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080814" }}>
      <div className="border-b" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
        <div className="container h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <img
                src={LOGO_URL}
                alt="ChalkPicks"
                className="h-10 w-auto transition-all group-hover:scale-105"
                style={{ filter: "drop-shadow(0 0 10px rgba(0,255,136,0.4))" }}
              />
            </a>
          </Link>
          <Link href={rightLink.href}>
            <a>
              <Button
                variant={rightLink.variant === "outline" ? "outline" : undefined}
                style={rightLink.variant !== "outline"
                  ? { background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", color: "#080814", fontWeight: 700 }
                  : { borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff" }}
              >
                {rightLink.label}
              </Button>
            </a>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(0,212,255,0.1)", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          © 2026 ChalkPicks. All rights reserved.
        </p>
      </div>
    </div>
  );
}
