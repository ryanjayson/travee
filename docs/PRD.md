# Product Requirements Document — Travee

> Audience: product + AI agents. Confirm scope here before implementing features.

## 1. Vision

Travee (app name `Travelled`) is an **offline-first mobile trip planner**. A traveler can plan a whole trip — itinerary sections, activities, budgets, checklists, notes, and travel companions — entirely on-device, with no account or network required. Network sync and collaboration are additive, never blocking.

## 2. Problem

Existing trip planners assume connectivity and accounts. Travelers often plan while offline (flights, remote areas) and want private, local-first data they own and can export.

## 3. Target Users

- **Solo traveler** — plans and tracks their own itinerary and budget.
- **Trip owner / organizer** — creates a trip, invites companions, assigns roles.
- **Companion** — views the shared itinerary and manages private items.

## 4. Roles & Permissions

Roles are defined in `prd.md` and not yet fully enforced in code.

| Role | View trip | Modify trip | Manage members | Private itinerary/notes/checklist/budget |
|------|-----------|-------------|----------------|------------------------------------------|
| Owner | Yes | Yes | Yes | Yes |
| Planner | Yes | Yes | No | Yes |
| Contributor | Yes | Yes | No | Yes |
| Member | Yes | No | No | Yes |

Additional rules:
- A trip has exactly one owner (the creator).
- Members may extend sections/activities, but those additions are visible only to them until promoted.
- Every member has private itinerary, checklist, budget, and notes.

## 5. Scope

### 5.1 Trips (in scope)
- Create, edit, clone, archive/unarchive, cancel, delete.
- Attributes: title, description, destination(s), start/return dates, status, budget, notes, type.
- Multiple destinations per trip.
- Multiple members per trip.

### 5.2 Itinerary (in scope)
- Sections per trip, with title, dates, destination, budget, notes.
- Reorder sections and activities (LexoRank — see `feature-activity-sorting` skill).
- Collapse/expand sections; optional section tab navigation.

### 5.3 Activities (in scope)
- Title, description, date/time, location, budget (target + actual), notes, images, attachments, tags, priority.
- Plan types: `activity`, `flight`, `stay`, `transit`, `rideRental`, `tour` (`TripPlanType`).
- Activity types: cafe, restaurant, sightseeing, entertainment, shopping, nature, camp, hike, rest, ride, meetup, walk, preparation (`ActivityType`).
- Type-specific detail forms (flight, accommodation, sightseeing, hike/camp, cafe/restaurant, nature, shopping, entertainment, transportation, walk, preparation, rest, motorcycle ride, meetup, ride rental).
- Mark activities done.
- Explore predefined activities that auto-fill location/type once a destination is chosen.
- OCR import from images (`src/features/Travel/utils/ocrParser.ts`).

### 5.4 Money (in scope)
- Expenses per trip/activity/member with category and currency.
- Split bills per member (owed amount, percentage, paid status).
- Per-member private budget visibility.

### 5.5 Checklists & Notes (in scope)
- Checklist groups and items per trip and per activity; done state with checked-by/at audit fields.
- Notes per trip and per activity, with images.

### 5.6 Catalog Views (in scope)
- Card, list, and calendar views of trips.

### 5.7 Data Ownership (in scope)
- Export/backup local database to a user-selected location.
- Restore from backup.

### 5.8 Notifications & Security (in scope)
- Local notifications (trip/activity reminders).
- App lock via PIN and biometrics.

### 5.9 Analytics (in scope)
- PostHog product analytics with a user opt-out.

### 5.10 Out of Scope (for now)
- Publishing trips publicly (future).
- Real authentication and multi-user server sync.
- Web app and desktop.
- Social feed / comments beyond the existing comment component.

## 6. Goals / Non-Goals

**Goals**
- Full trip planning works with zero network and zero account.
- Fast, responsive interaction on mid-range devices.
- Data is user-owned, exportable, and private by default.

**Non-Goals**
- Real-time collaborative editing.
- Being a booking/payment engine.

## 7. Success Metrics

- Time to create a first trip with 3 activities < 2 minutes.
- App fully usable in airplane mode.
- Crash-free sessions > 99.5%.
- Backup export succeeds and restores to an identical dataset.

## 8. Open Questions

- When does real auth land, and how does local data migrate to a server account?
- How are offline edits reconciled on sync (conflict strategy)?
- Is per-member private data enforced at query level or UI level?
- Which markets/locales are required at launch?
