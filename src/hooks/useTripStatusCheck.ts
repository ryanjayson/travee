/**
 * useTripStatusCheck.ts
 *
 * React hook that:
 *  1. Requests local notification permissions on mount (iOS prompt).
 *  2. Runs a trip status check immediately on mount.
 *  3. Re-runs whenever the app comes back to foreground (AppState change).
 *  4. Schedules a repeating check every 60 minutes while the app is open.
 *
 * Mount this hook ONCE at the app root (inside QueryClientProvider).
 */

import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { runTripStatusCheck } from "../services/tripStatusService";

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function useTripStatusCheck() {
  const queryClient = useQueryClient();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Request OS notification permission (iOS shows a native prompt). */
  async function requestPermissions(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }

  /** Run the service (guard: only if permission granted). */
  async function check() {
    const granted = await requestPermissions();
    if (!granted) {
      if (__DEV__) {
        console.warn("[useTripStatusCheck] Notification permission not granted.");
      }
      // Still run the status-update logic even without notification permission
    }
    await runTripStatusCheck(queryClient);
  }

  useEffect(() => {
    // Initial check on mount
    check();

    // Re-run when app returns to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          check();
        }
        appState.current = nextState;
      }
    );

    // Repeat every hour while app is open
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
