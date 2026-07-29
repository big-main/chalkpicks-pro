/**
 * Native shell detection (Capacitor).
 * Safe on web: returns false / 'web' when @capacitor/core is absent.
 */

export function isNativePlatform(): boolean {
  try {
    // Dynamic to avoid hard crash if Capacitor not installed in pure web builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getNativePlatform(): "ios" | "android" | "web" {
  try {
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    const p = Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
    return "web";
  } catch {
    return "web";
  }
}

/** Use for Stripe / external links — open system browser on native. */
export async function openExternalUrl(url: string): Promise<void> {
  if (!isNativePlatform()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
