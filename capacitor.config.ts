import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ChalkPicks native shell (iOS + Android) via Capacitor.
 *
 * Strategy: wrap the production web app so one React codebase ships web + mobile.
 * API traffic goes to https://chalkpicks.live (see server.url).
 *
 * Local native build:
 *   pnpm build && npx cap sync
 *   npx cap open ios | npx cap open android
 */
const config: CapacitorConfig = {
  appId: "live.chalkpicks.app",
  appName: "ChalkPicks",
  webDir: "dist/public",
  server: {
    // Production: load from live site so API cookies / tRPC work without CORS hacks.
    // For offline-capable shell later, set androidScheme/iosScheme and ship bundled webDir only.
    url: "https://chalkpicks.live",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#080814",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashImmersive: true,
      splashFullScreen: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#080814",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "ChalkPicks",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#080814",
  },
};

export default config;
