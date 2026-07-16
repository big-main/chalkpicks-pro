import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-dark-v2-Ey5FDp5iZKArkMRM3n8FwX.webp";

interface AuthPageShellProps {
  children: React.ReactNode;
  rightLink: { href: string; label: string; variant?: "default" | "outline" };
}

export default function AuthPageShell({ children, rightLink }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <img
                src={LOGO_URL}
                alt="ChalkPicks"
                className="h-12 w-auto transition-all group-hover:scale-105 drop-shadow-[0_0_12px_rgba(57,255,20,0.3)]"
              />
            </a>
          </Link>
          <Link href={rightLink.href}>
            <a>
              <Button
                className={rightLink.variant === "outline"
                  ? "btn-outline-premium text-sm"
                  : "btn-premium text-sm"}
              >
                {rightLink.label}
              </Button>
            </a>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-border/30 py-6 text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 ChalkPicks. All rights reserved.
        </p>
      </div>
    </div>
  );
}
