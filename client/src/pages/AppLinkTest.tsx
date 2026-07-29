/**
 * /app-link-test — Deep link verification page for ChalkPicks Pro.
 * Tests chalkpicks:// custom URL scheme and Universal Links / App Links.
 * Only visible to admin users.
 */
import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Smartphone,
  Globe,
  Link2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface TestResult {
  name: string;
  status: "pending" | "pass" | "fail" | "skip";
  detail: string;
}

const DEEP_LINKS = [
  { label: "Home", url: "chalkpicks://home", webUrl: "/" },
  { label: "Picks", url: "chalkpicks://picks", webUrl: "/picks" },
  { label: "+EV Finder", url: "chalkpicks://ev", webUrl: "/ev-finder" },
  { label: "Pricing", url: "chalkpicks://pricing", webUrl: "/pricing" },
  { label: "Dashboard", url: "chalkpicks://dashboard", webUrl: "/dashboard" },
  { label: "NFL Picks", url: "chalkpicks://nfl-picks", webUrl: "/nfl-picks" },
  { label: "NBA Picks", url: "chalkpicks://nba-picks", webUrl: "/nba-picks" },
];

const UNIVERSAL_LINKS = [
  "https://chalkpicks.live/picks",
  "https://chalkpicks.live/ev-finder",
  "https://chalkpicks.live/pricing",
  "https://chalkpicks.live/nfl-picks",
];

export default function AppLinkTest() {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-white/40">Admin access required.</p>
        </div>
      </div>
    );
  }

  const runTests = async () => {
    setRunning(true);
    const newResults: TestResult[] = [];

    // Test 1: Platform detection
    newResults.push({
      name: "Platform Detection",
      status: "pass",
      detail: `Running on: ${platform} (native: ${isNative})`,
    });

    // Test 2: Capacitor availability
    newResults.push({
      name: "Capacitor Core",
      status: Capacitor ? "pass" : "fail",
      detail: Capacitor
        ? `Capacitor ${platform} runtime available`
        : "Capacitor not loaded",
    });

    // Test 3: assetlinks.json / apple-app-site-association
    try {
      const assetRes = await fetch("/.well-known/assetlinks.json");
      const assetData = await assetRes.json();
      newResults.push({
        name: "assetlinks.json (Android App Links)",
        status: assetRes.ok && Array.isArray(assetData) ? "pass" : "fail",
        detail: assetRes.ok
          ? `Found ${assetData.length} relation(s)`
          : `HTTP ${assetRes.status}`,
      });
    } catch {
      newResults.push({
        name: "assetlinks.json",
        status: "fail",
        detail: "Fetch failed",
      });
    }

    try {
      const appleRes = await fetch("/.well-known/apple-app-site-association");
      const appleData = await appleRes.json();
      newResults.push({
        name: "apple-app-site-association (iOS Universal Links)",
        status: appleRes.ok && appleData.applinks ? "pass" : "fail",
        detail: appleRes.ok
          ? `applinks.apps: ${JSON.stringify(appleData.applinks?.apps ?? [])}`
          : `HTTP ${appleRes.status}`,
      });
    } catch {
      newResults.push({
        name: "apple-app-site-association",
        status: "fail",
        detail: "Fetch failed",
      });
    }

    // Test 4: RevenueCat env keys present
    const iosKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
    const androidKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
    newResults.push({
      name: "RevenueCat iOS API Key",
      status: iosKey ? "pass" : "fail",
      detail: iosKey
        ? `Set (${iosKey.slice(0, 8)}...)`
        : "VITE_REVENUECAT_IOS_KEY not set",
    });
    newResults.push({
      name: "RevenueCat Android API Key",
      status: androidKey ? "pass" : "fail",
      detail: androidKey
        ? `Set (${androidKey.slice(0, 8)}...)`
        : "VITE_REVENUECAT_ANDROID_KEY not set",
    });

    // Test 5: Deep link scheme (native only)
    if (isNative) {
      try {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        newResults.push({
          name: "App Info (native)",
          status: "pass",
          detail: `${info.name} v${info.version} (${info.build})`,
        });
      } catch {
        newResults.push({
          name: "App Info (native)",
          status: "fail",
          detail: "Could not read app info",
        });
      }
    } else {
      newResults.push({
        name: "App Info (native)",
        status: "skip",
        detail: "Skipped — running on web",
      });
    }

    setResults(newResults);
    setRunning(false);
  };

  const statusIcon = (status: TestResult["status"]) => {
    if (status === "pass")
      return <CheckCircle className="w-4 h-4 text-lime-400" />;
    if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
    if (status === "skip") return <XCircle className="w-4 h-4 text-white/30" />;
    return <div className="w-4 h-4 rounded-full border border-white/20" />;
  };

  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.filter(r => r.status === "fail").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-16">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="w-6 h-6 text-lime-400" />
          <h1 className="text-3xl font-bold">Deep Link Test</h1>
          <Badge
            variant="outline"
            className="text-xs border-lime-400/30 text-lime-400"
          >
            Admin Only
          </Badge>
        </div>
        <p className="text-white/40 text-sm mb-8">
          Verify <code className="text-lime-400">chalkpicks://</code> custom URL
          scheme, Universal Links (iOS), and App Links (Android) are configured
          correctly.
        </p>

        {/* Platform info */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4 text-sm">
              {isNative ? (
                <Smartphone className="w-4 h-4 text-lime-400" />
              ) : (
                <Globe className="w-4 h-4 text-white/40" />
              )}
              <span className="text-white/60">Platform:</span>
              <span className="font-mono text-white">{platform}</span>
              <Badge
                variant={isNative ? "default" : "outline"}
                className={
                  isNative
                    ? "bg-lime-400/20 text-lime-400 border-lime-400/30"
                    : "text-white/30"
                }
              >
                {isNative ? "Native" : "Web Browser"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Run tests */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={runTests}
            disabled={running}
            className="bg-lime-400 text-black hover:bg-lime-300 font-semibold"
          >
            {running ? "Running…" : "Run All Tests"}
          </Button>
          {results.length > 0 && (
            <div className="flex gap-3 text-sm">
              <span className="text-lime-400">{passCount} passed</span>
              {failCount > 0 && (
                <span className="text-red-400">{failCount} failed</span>
              )}
            </div>
          )}
        </div>

        {/* Test results */}
        {results.length > 0 && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 shrink-0">{statusIcon(r.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-white/40 text-xs truncate">{r.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Manual deep link triggers */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custom URL Scheme Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/40 text-xs mb-4">
              Tap a link on a native device to verify the{" "}
              <code className="text-lime-400">chalkpicks://</code> scheme opens
              the app.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEEP_LINKS.map(link => (
                <a
                  key={link.url}
                  href={isNative ? link.url : link.webUrl}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-lime-400" />
                  <span className="truncate">{link.label}</span>
                  <span className="text-white/20 text-xs ml-auto truncate hidden sm:block">
                    {isNative ? link.url : link.webUrl}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Universal Links */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Universal Links / App Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/40 text-xs mb-4">
              On iOS (Universal Links) and Android (App Links), tapping these
              URLs should open the native app instead of the browser.
            </p>
            <div className="space-y-2">
              {UNIVERSAL_LINKS.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-lime-400 hover:text-lime-300 transition-colors font-mono"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {url}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
