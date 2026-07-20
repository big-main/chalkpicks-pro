/**
 * Mixpanel Analytics Helper
 *
 * Initialized with the ChalkPicks Mixpanel project token.
 * Autocapture and session recording are enabled.
 *
 * Usage:
 *   import { analytics } from "@/lib/analytics";
 *   analytics.track("pick_viewed", { pickId: "123", sport: "nfl" });
 *   analytics.identify(userId, { email, tier });
 *   analytics.reset(); // on logout
 */

import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "d83e21f4a4fa864ee3d4e73dd3ae72c9";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  mixpanel.init(MIXPANEL_TOKEN, {
    autocapture: true,
    record_sessions_percent: 100,
    track_pageview: false, // we handle page views manually for SPA accuracy
    persistence: "localStorage",
    ignore_dnt: false,
    debug: import.meta.env.DEV,
  });
  initialized = true;
}

// ─── Event name catalogue ─────────────────────────────────────────────────────

export type AnalyticsEvent =
  | "page_view"
  | "pick_viewed"
  | "pick_tracked"
  | "pick_untracked"
  | "bet_clicked"
  | "sportsbook_clicked"
  | "arbitrage_viewed"
  | "ev_finder_used"
  | "parlay_built"
  | "bankroll_opened"
  | "consensus_viewed"
  | "subscription_page_viewed"
  | "subscription_started"
  | "subscription_completed"
  | "user_signed_up"
  | "user_logged_in"
  | "user_logged_out"
  | "newsletter_subscribed"
  | "launch_notify_submitted"
  | "affiliate_apply_clicked"
  | "search_used"
  | "filter_applied"
  | "blog_post_viewed"
  | "leaderboard_viewed"
  | "notification_permission_granted"
  | "notification_permission_denied"
  | "ab_experiment_viewed"
  | "pricing_cta_clicked";

// ─── Analytics object ─────────────────────────────────────────────────────────

export const analytics = {
  /**
   * Track a named event with optional properties.
   */
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (!initialized) return;
    try {
      mixpanel.track(event, properties);
    } catch {
      // Never let analytics errors surface to users
    }
  },

  /**
   * Track a page view. Call on every route change.
   */
  page(path: string, title?: string) {
    if (!initialized) return;
    try {
      mixpanel.track("page_view", {
        path,
        title: title ?? document.title,
        referrer: document.referrer || undefined,
      });
    } catch {
      // noop
    }
  },

  /**
   * Identify a logged-in user. Call after successful login or on app load
   * when the user session is already active.
   */
  identify(userId: string, traits?: {
    email?: string;
    name?: string;
    tier?: string;
    createdAt?: Date | string;
    role?: string;
  }) {
    if (!initialized) return;
    try {
      mixpanel.identify(userId);
      if (traits) {
        const props: Record<string, unknown> = {};
        if (traits.email) props["$email"] = traits.email;
        if (traits.name) props["$name"] = traits.name;
        if (traits.tier) props.tier = traits.tier;
        if (traits.role) props.role = traits.role;
        if (traits.createdAt) props["$created"] = new Date(traits.createdAt).toISOString();
        mixpanel.people.set(props);
      }
    } catch {
      // noop
    }
  },

  /**
   * Reset the Mixpanel session. Call on logout to disassociate the device
   * from the previous user.
   */
  reset() {
    if (!initialized) return;
    try {
      mixpanel.reset();
    } catch {
      // noop
    }
  },

  /**
   * Register super properties that will be sent with every future event.
   * Useful for global context like subscription tier.
   */
  register(properties: Record<string, unknown>) {
    if (!initialized) return;
    try {
      mixpanel.register(properties);
    } catch {
      // noop
    }
  },
};
