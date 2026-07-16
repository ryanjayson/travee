/**
 * tripStatusService.ts
 *
 * Core service for trip departure-based status management.
 *
 * Responsibilities:
 *  - Query ALL locally-stored "Upcoming" trips from WatermelonDB
 *  - For trips departing in exactly 3 days → schedule a local push notification
 *  - For trips departing in exactly 1 day  → schedule a local push notification
 *  - For trips whose departure day is TODAY → update status to Ongoing (2)
 *
 * De-duplication:
 *  Notification keys are stored in AsyncStorage so repeated calls (e.g. app
 *  resume) never fire the same notification twice on the same calendar day.
 *
 * QueryClient:
 *  Passed in so React Query cache is invalidated after any status mutation,
 *  keeping the UI in sync without requiring a manual refresh.
 */

import { Q } from "@nozbe/watermelondb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { QueryClient } from "@tanstack/react-query";
import { database } from "../db";
import Travel from "../db/models/Travel";
import Section from "../db/models/Section";
import Activity from "../db/models/Activity";
import { TravelStatus } from "../types/enums";
import { updateTravelStatusLocally } from "./local/travelService";
import { saveNotificationLocally } from "./local/notificationService";
import { getProfileLocally } from "./local/profileService";
import { logger, ErrorCategory, ErrorSeverity } from "./errorLogger";

// ─── Constants ──────────────────────────────────────────────────────────────

const NOTIF_KEY_PREFIX = "travelled:notif_sent:";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a date-only string in local timezone: "YYYY-MM-DD" */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Number of whole calendar days between date A and date B (ignores time). */
function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const b = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Check AsyncStorage to see if this notification type was already sent for this
 * trip today. Returns true if already sent (should skip).
 */
async function wasNotificationSentToday(
  tripId: string,
  type: string
): Promise<boolean> {
  const today = toDateString(new Date());
  const key = `${NOTIF_KEY_PREFIX}${tripId}:${type}:${today}`;
  const value = await AsyncStorage.getItem(key);
  return value === "1";
}

/** Mark a notification as sent for today to prevent duplicates. */
async function markNotificationSent(
  tripId: string,
  type: string
): Promise<void> {
  const today = toDateString(new Date());
  const key = `${NOTIF_KEY_PREFIX}${tripId}:${type}:${today}`;
  await AsyncStorage.setItem(key, "1");
}

/** Check if an activity has already received a notification for the warning window. */
async function wasActivityNotificationSent(
  activityId: string,
  hoursBefore: number
): Promise<boolean> {
  const key = `${NOTIF_KEY_PREFIX}activity:${activityId}:${hoursBefore}`;
  const value = await AsyncStorage.getItem(key);
  return value === "1";
}

/** Mark an activity as notified for the warning window. */
async function markActivityNotificationSent(
  activityId: string,
  hoursBefore: number
): Promise<void> {
  const key = `${NOTIF_KEY_PREFIX}activity:${activityId}:${hoursBefore}`;
  await AsyncStorage.setItem(key, "1");
}

/** Schedule an immediate local notification (displayed right away). */
async function sendLocalNotification(
  title: string,
  body: string,
  travelId?: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // null = fire immediately
  });

  try {
    await saveNotificationLocally({
      title,
      body,
      isRead: false,
      travelId,
    });
  } catch (err) {
    console.error("Failed to save notification locally:", err);
  }
}

// ─── Main service function ────────────────────────────────────────────────────

/**
 * runTripStatusCheck
 *
 * Run once on app foreground/launch. Safe to call repeatedly — de-duplication
 * is handled via AsyncStorage.
 *
 * @param queryClient  React Query client to invalidate after DB mutations.
 */
export async function runTripStatusCheck(queryClient: QueryClient): Promise<void> {
  try {
    const today = new Date();

    // Fetch user profile and preferences
    const profile = await getProfileLocally();
    const notificationsEnabled = profile?.notificationsEnabled ?? true;
    const notifyDays = profile?.notifyDaysBeforeTrip ?? 3;
    const notifyHours = profile?.notifyHoursBeforeActivity ?? 2;

    // Fetch all Upcoming trips from WatermelonDB
    const upcomingTrips = await database
      .get<Travel>("travels")
      .query(
        Q.and(
          Q.where("status", TravelStatus.Upcoming),
          Q.where("is_archived", Q.notEq(true))
        )
      )
      .fetch();

    // Fetch all Ongoing trips from WatermelonDB
    const ongoingTrips = await database
      .get<Travel>("travels")
      .query(
        Q.and(
          Q.where("status", TravelStatus.Ongoing),
          Q.where("is_archived", Q.notEq(true))
        )
      )
      .fetch();

    let didMutate = false;

    // ── Check trip status updates & trip start notifications ─────────────────
    for (const trip of upcomingTrips) {
      if (!trip.startOrDepartureDate) continue;

      const departure = new Date(trip.startOrDepartureDate);
      const daysUntil = daysBetween(today, departure);

      if (notificationsEnabled) {
        // ── Custom days reminder ──────────────────────────────────────────────
        if (daysUntil === notifyDays) {
          const typeKey = `${notifyDays}day`;
          const alreadySent = await wasNotificationSentToday(trip.id, typeKey);
          if (!alreadySent) {
            await sendLocalNotification(
              `✈️ Trip in ${notifyDays} ${notifyDays === 1 ? "day" : "days"}!`,
              `Your trip "${trip.title}" departs in ${notifyDays} ${notifyDays === 1 ? "day" : "days"}. Time to finish packing!`,
              trip.id
            );
            await markNotificationSent(trip.id, typeKey);
          }
        }
        // ── 1-day reminder (if notifyDays is not already 1) ───────────────────
        else if (daysUntil === 1 && notifyDays !== 1) {
          const alreadySent = await wasNotificationSentToday(trip.id, "1day");
          if (!alreadySent) {
            await sendLocalNotification(
              "🧳 Trip tomorrow!",
              `"${trip.title}" starts tomorrow. Bon voyage!`,
              trip.id
            );
            await markNotificationSent(trip.id, "1day");
          }
        }
      }

      // ── Departure day → set Ongoing ───────────────────────────────────────
      if (daysUntil === 0) {
        await updateTravelStatusLocally(trip.id, TravelStatus.Ongoing);
        didMutate = true;
      }
    }

    // ── Check if ongoing trips have ended → set Past ────────────────────────
    for (const trip of ongoingTrips) {
      if (!trip.endOrReturnDate) continue;

      const returnDate = new Date(trip.endOrReturnDate);
      const daysUntilEnd = daysBetween(today, returnDate);

      if (daysUntilEnd < 0) {
        await updateTravelStatusLocally(trip.id, TravelStatus.Past);
        didMutate = true;
      }
    }

    // ── Check activity reminders ─────────────────────────────────────────────
    if (notificationsEnabled) {
      const activeTripIds = [
        ...upcomingTrips.map((t) => t.id),
        ...ongoingTrips.map((t) => t.id),
      ];

      if (activeTripIds.length > 0) {
        const activeSections = await database
          .get<Section>("itinerary_sections")
          .query(Q.where("travel_id", Q.oneOf(activeTripIds)))
          .fetch();

        const sectionIds = activeSections.map((s) => s.id);
        if (sectionIds.length > 0) {
          const activities = await database
            .get<Activity>("itinerary_activities")
            .query(
              Q.where("section_id", Q.oneOf(sectionIds)),
              Q.where("start_date", Q.notEq(null)),
              Q.where("is_done", Q.notEq(true))
            )
            .fetch();

          // Build mapping from sectionId to travelId
          const sectionTravelMap: Record<string, string> = {};
          for (const s of activeSections) {
            sectionTravelMap[s.id] = s.travel.id;
          }

          for (const activity of activities) {
            if (!activity.startDate) continue;

            const activityDate = new Date(activity.startDate);
            const timeDiffMs = activityDate.getTime() - today.getTime();
            const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

            // Trigger notification if the activity starts within notifyHours window in the future
            if (hoursRemaining > 0 && hoursRemaining <= notifyHours) {
              const alreadySent = await wasActivityNotificationSent(activity.id, notifyHours);
              if (!alreadySent) {
                const travelId = sectionTravelMap[activity.section.id];
                await sendLocalNotification(
                  `🔔 Upcoming Activity: ${activity.title}`,
                  `Starts in about ${Math.ceil(hoursRemaining)} ${Math.ceil(hoursRemaining) === 1 ? "hour" : "hours"}${activity.notes ? `. Note: ${activity.notes}` : ""}`,
                  travelId
                );
                await markActivityNotificationSent(activity.id, notifyHours);
              }
            }
          }
        }
      }
    }

    // Invalidate React Query cache so all screens pick up the status change
    if (didMutate) {
      queryClient.invalidateQueries({ queryKey: ["travel"] });
      queryClient.invalidateQueries({ queryKey: ["travels"] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    }
  } catch (error) {
    // Persist to error_logs for post-hoc debugging
    logger.service(error, {
      errorCode: "ERR_TRIP_STATUS_CHECK",
      action: "runTripStatusCheck",
      severity: ErrorSeverity.High,
    });
  }
}
