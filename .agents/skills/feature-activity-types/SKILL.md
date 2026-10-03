---
name: feature-activity-types
description: The Travee trip plan type and activity type system - TripPlanType, ActivityType, per-type detail tables, tabs/forms registration, and the recipe for adding a new type. Use when adding or editing activity types or their detail forms.
---

# Activity Types & Plan Types

Travee has **two independent type systems**. Confusing them is the most common mistake.

| Concept | Enum | Meaning | Storage |
|---------|------|---------|---------|
| Plan kind | `TripPlanType` | Top-level shape of an itinerary item | `itinerary_activities.plan_type` |
| Activity kind | `ActivityType` | Sub-type for general activities | `itinerary_activities.type` |

## TripPlanType (`src/types/enums.ts`)

```
activity = 0, flight = 1, stay = 2, transit = 3, rideRental = 4, tour = 5
```
Labels via `getTripPlanTypeLabel()`. Aliases: `getPlanTypeLabel`.

## ActivityType (`src/types/enums.ts`)

```
cafe=1, restaurant=2, sightseeing=3, entertainment=4, shopping=5, nature=6,
camp=7, hike=8, rest=9, ride=10, meetup=11, walk=12, preparation=13
```
Labels via `getActivityTypeLabel()`. Alias: `getActivityPlanTypeLabel`.

### Activity Plan Types Palette (`src/features/Travel/constants/activityPlanTypes.ts`)

Sub-types of `TripPlanType.activity` are registered in `ACTIVITY_PLAN_TYPES`.

**Palette Rules:**
1. **Never collide with top-level `TripPlanType` colors:**
   - Activity: `#c10003` | Flight: `#2196F3` | Stay: `#a659ee` | Transit: `#02899a` | Tour: `#429862` | Rental: `#384690`
2. **Never repeat:** Each of the 13 types has a distinct color.
3. **Themed & Light:** Colors are light, soft tones tailored to each type's domain:

| Type | Key | Label | Icon (`MaterialIcons`) | Color | Theme Meaning |
|------|-----|-------|------------------------|-------|---------------|
| `cafe` | `cafe` | Cafe | `local-cafe` | `#B56F3B` | Warm caramel latte / roasted coffee |
| `restaurant` | `restaurant` | Restaurant | `restaurant` | `#E76F51` | Warm terracotta / appetizing coral dining |
| `sightseeing` | `sightseeing` | Sightseeing | `photo-camera` | `#F59E0B` | Sunny amber gold / landmarks |
| `entertainment` | `entertainment` | Entertainment | `local-play` | `#A855F7` | Vibrant amusement purple / nightlife |
| `shopping` | `shopping` | Shopping | `shopping-bag` | `#EC4899` | Soft rose / boutique pink |
| `nature` | `nature` | Nature | `terrain` | `#10B981` | Fresh light emerald / natural wonder |
| `hike` | `hike` | Hike | `hiking` | `#52B788` | Alpine sage / mountain trails |
| `camp` | `camp` | Camp | `night-shelter` | `#D97706` | Warm campfire amber / outdoor canvas |
| `walk` | `walk` | Walk | `directions-walk` | `#84CC16` | Breezy lime pear / casual stroll |
| `rest` | `rest` | Rest | `hotel` | `#8DA4C4` | Calm powder slate / quiet downtime |
| `ride` | `ride` | Ride | `directions-bike` | `#0284C7` | Bright scenic azure / open road |
| `meetup` | `meetup` | Meetup | `people` | `#14B8A6` | Friendly seafoam teal / socializing |
| `preparation` | `preparation` | Preparation | `build` | `#64748B` | Cool steel slate / gear & checklists |

## Detail Tables → Forms

Each type can persist extra fields in a dedicated `*_details` table keyed by `activity_id`.

| Type | Detail table | UI (tab/form) |
|------|--------------|---------------|
| flight | `flight_details` | `Activity/Tabs/FlightTab.tsx`, `Forms/Flight/FlightModal.tsx` |
| stay | `accomodation_details` | `Activity/Tabs/AccomodationTab.tsx` |
| transit | `transportation_details` | `Activity/Tabs/TransportationTab.tsx` |
| rideRental / ride | `ride_rental_details`, `motorcycle_ride_details` | `Activity/Tabs/RideRentalTab.tsx` |
| tour / general | (core activity fields) | `Activity/Tabs/PlanTab.tsx` |
| restaurant / cafe | `cafe_restaurant_details` | via plan/forms |
| sightseeing | `sightseeing_details` | via plan/forms |
| entertainment | `entertainment_details` | via plan/forms |
| shopping | `shopping_details` | via plan/forms |
| nature | `nature_details` | via plan/forms |
| camp / hike | `hike_or_camp_details` | via plan/forms |
| rest | `rest_details` | via plan/forms |
| meetup | `meetup_details` | via plan/forms |
| walk | `walk_details` | via plan/forms |
| preparation | `preparation_details` | via plan/forms |
| checklist | `checklist_items` | `Activity/Tabs/ChecklistTab.tsx` |

Fetchers: the 15 `fetchLocal*Details(activityId)` helpers in `src/services/local/travelService.ts`.

> The tab set is currently narrower than the table set. Confirm the real mapping by reading `Activity/Tabs/` and `Activity/Modal.tsx` before assuming a type has a dedicated tab.

## Key Locations

| Path | Purpose |
|------|---------|
| `src/types/enums.ts` | Enums + label helpers |
| `src/features/Travel/constants/activityPlanTypes.ts` | `ACTIVITY_PLAN_TYPES` config, icons, and color palette |
| `src/db/schema.ts` | Detail + core activity tables |
| `src/db/migrations.ts` | Versioned changes |
| `src/db/index.ts` | Model registry |
| `src/services/local/travelService.ts` | Detail fetchers + `saveActivityLocally` |
| `src/features/Travel/components/Edit/Itinerary/Activity/Tabs/` | Per-type edit tabs |
| `src/features/Travel/components/Edit/Itinerary/Activity/Modal.tsx` | Activity modal + tab wiring |
| `src/features/Travel/components/View/Activity/` | Read-only activity cards/tabs |
| `src/features/Travel/components/Forms/` | Create/edit forms (Flight, Expense, Checklist, Note, Member) |

## Adding a New Activity Type

1. Add the enum value in `src/types/enums.ts` and a branch in the label helper.
2. Add the detail table in `src/db/schema.ts`; bump `schema.version`.
3. Add the migration step in `src/db/migrations.ts`.
4. Create the model in `src/db/models/` and register it in `src/db/index.ts`.
5. Add a `fetchLocal<Type>Details` + save logic in `travelService.ts` (or the relevant service).
6. Add the detail form under `src/features/Travel/components/Forms/`.
7. Wire it into `Activity/Tabs/` and `Activity/Modal.tsx`; add the icon mapping.
8. Add tests (see `testing-rn`) and update `docs/ARCHITECTURE.md`.

Follow `feature-activity-sorting` for `sort_order` and `feature-offline-data` for DB conventions.

## Known Issues / Gotchas

- **Broken enum references currently fail typecheck:** `src/services/local/travelService.ts` references `ActivityType.hikeOrCamp` and `ActivityType.cafeOrBar`, which no longer exist after the enum was reworked. `npx tsc --noEmit` reports these (lines ~1406, 1459, 2404). Fix by mapping to the current values (`hike`/`camp`, `cafe`/`restaurant`).
- Aliases (`getActivityPlanTypeLabel`, `getPlanTypeLabel`, `getActivityPlanTypeLabel`) exist for backwards compatibility — prefer the canonical `getActivityTypeLabel`/`getTripPlanTypeLabel`.
- Several detail fetchers return `any`, so detail typings are weak.
- `ActivityType` values are not stable across history (e.g., old `hikeOrCamp`/`cafeOrBar`) — check migrations and existing data before renumbering.
