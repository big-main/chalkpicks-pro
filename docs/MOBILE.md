# ChalkPicks iOS + Android

## Approach

**Capacitor** wraps the existing Vite/React app so one codebase serves:

| Platform | Delivery                                                         |
| -------- | ---------------------------------------------------------------- |
| Web      | chalkpicks.pro                                                   |
| iOS      | App Store (WKWebView shell → live site or bundled `dist/public`) |
| Android  | Play Store (same)                                                |

App ID: `live.chalkpicks.app`

## Why not full React Native rewrite?

- Ranking, SEO, ledger, tRPC, and auth already work on web.
- Native rewrite = 6–12 months and dual maintenance.
- Capacitor ships store apps in days; you can still add native modules (push, haptics, secure storage) incrementally.

## Prerequisites

- macOS + Xcode 15+ (iOS)
- Android Studio + JDK 17 (Android)
- Apple Developer + Google Play accounts
- Node 22 + pnpm

## One-time setup (DONE — platforms already added)

All Capacitor packages are installed. Android and iOS platforms are already added to the repo.

```bash
# Already done:
# pnpm add -w @capacitor/cli @capacitor/android @capacitor/ios \
#   @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar
# npx cap add android && npx cap add ios
```

## Build Android Debug APK

```bash
export JAVA_HOME=/home/ubuntu/jdk-21.0.5+11   # Temurin JDK 21 (in sandbox)
export ANDROID_HOME=/home/ubuntu/android-sdk
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

pnpm run build && npx cap sync
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk (7 MB)
```

## Build Android Release AAB (Google Play)

1. Generate keystore (one-time):
   ```bash
   keytool -genkey -v -keystore chalkpicks-release.keystore \
     -alias chalkpicks -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add signing config to `android/app/build.gradle` (see signingConfigs section)
3. Build: `./gradlew bundleRelease`
4. Upload `.aab` to Google Play Console → Internal Testing → Production

## Android App Links (assetlinks.json)

Get your release keystore SHA-256:

```bash
keytool -list -v -keystore chalkpicks-release.keystore -alias chalkpicks | grep SHA256
```

Update `client/public/.well-known/assetlinks.json` with the fingerprint, then redeploy.

## Daily workflow

```bash
pnpm build && npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

## Scripts (package.json)

- `pnpm mobile:sync` — build web + cap sync
- `pnpm mobile:ios` — open Xcode
- `pnpm mobile:android` — open Android Studio

## Config notes (`capacitor.config.ts`)

- `server.url = https://chalkpicks.pro` — shell loads production (auth + API just work).
- For **offline / App Review demos**, comment out `server.url` so the app uses bundled `webDir`.
- Splash / status bar colors match brand `#080814`.

## Store compliance (sports betting analytics)

- Age rating: 17+ / mature; disclose gambling-related content.
- Do **not** process bets inside the app if that triggers money-transmission rules in your jurisdictions.
- Link **Responsible Gambling** + terms inside Settings.
- Push: only with explicit opt-in; use existing VAPID / FCM bridge later.
- Apple often rejects “real-money gambling” apps in some regions — position as **analytics / information**, not a sportsbook.

## Deep links

- Custom scheme: `chalkpicks://` (set in Xcode / AndroidManifest)
- Universal links: `https://chalkpicks.pro/...` (apple-app-site-association + assetlinks.json — add before launch)

## Roadmap after first store build

1. Native push (FCM + APNs) wired to existing alert system
2. Secure token storage (Capacitor Preferences / Keychain)
3. Biometric unlock for account
4. Optional: reduce web chrome (hide marketing nav) when `Capacitor.isNativePlatform()`
5. Offline cache of free picks / last performance snapshot

## App Icons

Icons are generated from `client/public/logo512.png` (neon green lightning bolt on black).

To regenerate all icon sizes:

```bash
python3 /home/ubuntu/gen_icons.py
# Outputs:
#   android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png
#   ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png (1024x1024)
```

## iOS Build (requires macOS)

1. Clone the repo on a Mac with Xcode 15+
2. Install deps: `pnpm install && pnpm run build && npx cap sync`
3. Open Xcode: `npx cap open ios` (or `open ios/App/App.xcworkspace`)
4. Select `App` target → Signing & Capabilities → set your Apple Developer Team
5. Bundle ID: `live.chalkpicks.app`
6. Add capabilities: **Push Notifications** + **Associated Domains** (`applinks:chalkpicks.pro`)
7. Product → Archive → Distribute App → App Store Connect → Upload

## Release Keystore (Android)

Keystore file: `chalkpicks-release.keystore` (in project root — **DO NOT commit to git**)

- Alias: `chalkpicks`
- SHA-256: `12:DA:DF:AC:43:88:56:B0:E7:92:7A:FA:8F:8B:4D:D5:09:57:1A:E4:CB:7C:3A:46:4B:AF:3A:85:70:3C:59:B1`
- This fingerprint is already in `client/public/.well-known/assetlinks.json`

**Back up the keystore file securely** — losing it means you cannot update the app on Google Play.

## Feature-detect in React

```ts
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
```

Hide desktop-only chrome or open external browser for Stripe Checkout when native.
