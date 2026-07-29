# Firebase Cloud Messaging (FCM) Setup — ChalkPicks Pro

## Overview

Native Android push notifications require Firebase Cloud Messaging (FCM). The web app currently uses VAPID-based Web Push, which works in browsers but not in native Android apps built with Capacitor.

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" → name it `chalkpicks-pro`
3. Disable Google Analytics (optional, not needed for FCM)
4. Click "Create Project"

### 2. Add Android App to Firebase

1. In Firebase Console → Project Settings → General → "Add app" → Android
2. Package name: `live.chalkpicks.app`
3. App nickname: `ChalkPicks Pro`
4. SHA-1 certificate fingerprint: `C1:F9:43:1D:E1:86:6F:85:5D:84:63:37:1E:96:4B:43:99:A9:7D:98`
5. Download `google-services.json`
6. Place it at: `android/app/google-services.json`

### 3. Get Server Key

1. Firebase Console → Project Settings → Cloud Messaging tab
2. Under "Cloud Messaging API (V1)", note the **Server key**
3. Add it as an environment variable: `FCM_SERVER_KEY`

### 4. Configure Capacitor Push Notifications

The Capacitor Push Notifications plugin is already installed (`@capacitor/push-notifications`). The native integration in `client/src/lib/native.ts` already handles:

- Permission request on app launch
- Token registration with the server
- Foreground notification display
- Deep link handling from notification taps

### 5. Server-Side FCM Integration

Add the Firebase Admin SDK to send push notifications from the server:

```bash
pnpm add -w firebase-admin
```

Create `server/services/fcm.ts`:

```typescript
import admin from "firebase-admin";

// Initialize with service account (download from Firebase Console)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "picks",
          icon: "ic_launcher",
          color: "#39FF14",
        },
      },
    });
    return { success: true, messageId: response };
  } catch (error) {
    console.error("[FCM] Send failed:", error);
    return { success: false, error };
  }
}

export async function sendFCMToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await admin.messaging().send({
      topic,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "picks",
          icon: "ic_launcher",
          color: "#39FF14",
        },
      },
    });
    return { success: true, messageId: response };
  } catch (error) {
    console.error("[FCM] Topic send failed:", error);
    return { success: false, error };
  }
}
```

### 6. Environment Variables Needed

| Variable           | Description                                         |
| ------------------ | --------------------------------------------------- |
| `FCM_PROJECT_ID`   | Firebase project ID (e.g., `chalkpicks-pro`)        |
| `FCM_CLIENT_EMAIL` | Service account email from Firebase                 |
| `FCM_PRIVATE_KEY`  | Service account private key (with `\n` line breaks) |

### 7. Database: Store FCM Tokens

Add a `pushTokens` table or column to store device FCM tokens alongside the existing web push subscriptions. When a native app registers, it sends the FCM token to `POST /api/trpc/notifications.registerPushToken`.

## Migration Path

Currently the app uses VAPID Web Push (`server/services/pushNotifications.ts`). The migration:

1. Keep VAPID for web browser users
2. Add FCM for native Android users
3. In `sendDailyPicksToAllUsers()`, check token type and route to the appropriate service
4. iOS uses APNs (Apple Push Notification service) — FCM can proxy APNs if you add the iOS app to the same Firebase project

## Testing

1. Build the app: `pnpm run build && npx cap sync`
2. Run on device: `npx cap run android`
3. Grant notification permission when prompted
4. Trigger a test notification from the Firebase Console → Cloud Messaging → "Send your first message"
