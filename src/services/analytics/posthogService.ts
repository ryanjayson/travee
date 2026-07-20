import PostHog from "posthog-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { POSTHOG_API_KEY, POSTHOG_HOST } from "@env";

export const ANALYTICS_OPT_OUT_KEY = "@travee_analytics_opt_out";

let postHogInstance: PostHog | null = null;
let isOptedOut = false;

/**
 * Default fallback host if not configured in environment
 */
const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/**
 * Initialize PostHog singleton client.
 * Safe to call at app launch. If API key is missing, runs in dummy mode without crashing.
 */
export async function initPostHog(): Promise<PostHog | null> {
  if (postHogInstance) {
    return postHogInstance;
  }

  // Check stored user opt-out preference
  try {
    const storedOptOut = await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY);
    if (storedOptOut !== null) {
      isOptedOut = storedOptOut === "true";
    }
  } catch (err) {
    if (__DEV__) {
      console.warn("[PostHog] Failed to read analytics opt-out setting:", err);
    }
  }

  const apiKey = POSTHOG_API_KEY ?? "";
  const host = POSTHOG_HOST || DEFAULT_POSTHOG_HOST;

  if (!apiKey || apiKey.trim() === "" || apiKey.includes("placeholder")) {
    if (__DEV__) {
      console.log("[PostHog] Operating in DEV mock mode (no valid API key provided).");
    }
    return null;
  }

  try {
    postHogInstance = new PostHog(apiKey, {
      host,
      disabled: isOptedOut,
      flushInterval: 30, // Flush buffered events every 30 seconds
      flushAt: 10,       // Flush when 10 events are queued
    });

    return postHogInstance;
  } catch (error) {
    if (__DEV__) {
      console.error("[PostHog] Failed to initialize client:", error);
    }
    return null;
  }
}

/**
 * Get current PostHog instance
 */
export function getPostHogClient(): PostHog | null {
  return postHogInstance;
}

/**
 * Track a custom event with optional properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (isOptedOut || !postHogInstance) {
    if (__DEV__ && !isOptedOut) {
      console.log(`[PostHog Mock Track] Event: ${eventName}`, properties ?? "");
    }
    return;
  }

  try {
    postHogInstance.capture(eventName, properties);
  } catch (error) {
    if (__DEV__) {
      console.error(`[PostHog] Error capturing event '${eventName}':`, error);
    }
  }
}

/**
 * Track a screen view event
 */
export function trackScreen(screenName: string, properties?: Record<string, any>): void {
  if (isOptedOut || !postHogInstance) {
    if (__DEV__ && !isOptedOut) {
      console.log(`[PostHog Mock Screen] Screen: ${screenName}`, properties ?? "");
    }
    return;
  }

  try {
    postHogInstance.screen(screenName, properties);
  } catch (error) {
    if (__DEV__) {
      console.error(`[PostHog] Error tracking screen '${screenName}':`, error);
    }
  }
}

/**
 * Identify user with distinct ID and profile properties
 */
export function identifyUser(userId: string, userProperties?: Record<string, any>): void {
  if (isOptedOut || !postHogInstance || !userId) {
    return;
  }

  try {
    postHogInstance.identify(userId, userProperties);
  } catch (error) {
    if (__DEV__) {
      console.error("[PostHog] Error identifying user:", error);
    }
  }
}

/**
 * Reset user identity on sign out
 */
export function resetUser(): void {
  if (!postHogInstance) {
    return;
  }

  try {
    postHogInstance.reset();
  } catch (error) {
    if (__DEV__) {
      console.error("[PostHog] Error resetting user session:", error);
    }
  }
}

/**
 * Update analytics opt-out preference
 */
export async function setAnalyticsOptOut(optOut: boolean): Promise<void> {
  isOptedOut = optOut;
  try {
    await AsyncStorage.setItem(ANALYTICS_OPT_OUT_KEY, String(optOut));
    if (postHogInstance) {
      if (optOut) {
        postHogInstance.optOut();
      } else {
        postHogInstance.optIn();
      }
    }
    trackEvent("analytics_opt_out_changed", { optedOut: optOut });
  } catch (error) {
    if (__DEV__) {
      console.error("[PostHog] Failed to save opt-out setting:", error);
    }
  }
}

/**
 * Check if analytics is currently opted out
 */
export function isAnalyticsOptedOut(): boolean {
  return isOptedOut;
}
