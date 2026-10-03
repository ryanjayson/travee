# Architecture — Travee

> Audience: engineers + AI agents. Use this to decide **where** code belongs.

## 1. High-Level Shape

```
App.tsx
 └─ QueryClientProvider (React Query: retry 1 query, 0 mutation; staleTime 30s)
    └─ AuthProvider (token/session placeholder)
       └─ PaperProvider (MD3 theme)
          └─ SafeAreaProvider
             └─ GestureHandlerRootView
                └─ ToastProvider
                   └─ ConfirmProvider
                      ├─ TripStatusGuard (background status checks)
                      └─ ErrorBoundary("AppRoot")
                         └─ SecurityGate (PIN / biometrics)
                            └─ AppNavigator (NavigationContainer + screen tracking)
                               └─ RootStack → RootTabs (tabs) + modal screens
```

Global JS error capture is installed in `App.tsx` via `ErrorUtils.setGlobalHandler`, and PostHog is initialized in a `useEffect`.

## 2. Layers (top → bottom)

```
screens/ (src/screens, src/features/*/screens)   UI screens
features/<Feature>/components                     feature UI
src/components/*                                  shared UI (atoms/molecules/organisms)
hooks/ + features/*/hooks                         React hooks + data access
services/                                         business logic
  ├─ local/*Service.ts    → WatermelonDB (source of truth, offline-first)
  ├─ api/*                → REST (secondary)
  ├─ travel/*             → feature-scoped services
  ├─ analytics/           → PostHog
  └─ errorLogger.ts       → persistent error logs
db/ (schema, migrations, models, index)           WatermelonDB
utils/                                            pure helpers
types/                                            enums, DTOs, env types
```

**Rule:** dependencies point downward only. UI must not import `db` directly; go through hooks/services.

## 3. Directory Map

| Path | Contains |
|------|----------|
| `src/screens/` | Top-level tab screens: Home, Map, Profile, Settings |
| `src/features/Auth/` | `AuthContext`, Login |
| `src/features/Travel/` | Core domain: screens (Catalog, TripDetail, EditTravelPlan), components (Edit/View/Forms/MapViewer/Share), hooks, types, OCR util |
| `src/features/Settings/` | Account, Database, Notifications, Security, DeveloperActions, About (Privacy/Terms) |
| `src/features/Notification/` | Notification feature |
| `src/features/Onboarding/` | (placeholder) |
| `src/components/` | Shared: Accordion, Tabs, StatusBadge, ActivityIcon, GoogleMapView, ExploreMap, DraggableList, SecurityGate, ErrorBoundary, atoms, molecules, organisms |
| `src/context/` | `TravelContext`, `ToastContext`, `ConfirmContext` |
| `src/hooks/` | `useApi`, `useLexicographicSort`, `useTripStatusCheck`, `useUserProfile`, `useKeyboardVisible` |
| `src/services/` | local DB services, API, analytics, error logger, backup, trip status |
| `src/db/` | schema, migrations, models, DB singleton |
| `src/theme/theme.ts` | React Native Paper MD3 theme |
| `global.css` + Tailwind | NativeWind utility classes |
| `.agents/skills/` | design-system, feature-activity-sorting, feature-map-sharing, expo-deployment, expo-tailwind-setup |

## 4. Data Flow (Offline-First)

```
UI event → feature hook → local *Service → WatermelonDB (write)
                                          └→ optional API sync (fire-and-forget)
UI read  → feature hook → local *Service → WatermelonDB query (@observable / Q)
                                          └→ React Query cache for server data
```

- Local services are authoritative. A failed network call must not roll back or block a local write.
- `useApi`/`fetcher` unwraps `{ isSuccess, data, errorMessage }` responses; use it for API calls.
- Wrap network calls with `src/utils/fetchWithTimeout.ts`.

## 5. Data Model (WatermelonDB, schema v5)

DB name `travelled_db`, adapter `SQLiteAdapter` with `jsi: false`. Models registered in `src/db/index.ts`.

Core:
- `travels` — trips (title, destination, dates, status, budget, type…)
- `trip_destinations` — multiple destinations per trip
- `itinerary_sections` — sections (`travel_id`, `sort_order`)
- `itinerary_activities` — activities (`section_id`, `sort_order`, `plan_type`, contact/booking fields)
- `itinerary_expenses`, `itinerary_notes`
- `checklist_groups`, `checklist_items` (checked_by/at, uncheck_by/at)
- `trip_members`, `member_split_bills`
- `trip_settings` (currency, timezone, view, reordering, section tabs)
- `user_profiles`, `app_notifications`, `error_logs`

Type-specific detail tables (all keyed by `activity_id`):
`flight_details`, `accomodation_details`, `sightseeing_details`, `hike_or_camp_details`, `cafe_restaurant_details`, `nature_details`, `shopping_details`, `entertainment_details`, `transportation_details`, `walk_details`, `preparation_details`, `rest_details`, `motorcycle_ride_details`, `meetup_details`, `ride_rental_details`.

### Migration Policy
- Never edit a released table in place; add a migration step in `src/db/migrations.ts` and bump `schema.version`.
- New detail type = new table + new migration version + model registration in `src/db/index.ts`.

## 6. Navigation

- `AppNavigator` wraps `NavigationContainer`, tracks screens via `trackScreen`.
- `RootStack` (native-stack): `Main` (tabs), plus modals `CreateTravelPlan`, `EditTravelPlan` (slide-from-bottom) and `TravelDetail` (slide-from-right).
- `RootTabs` defines bottom tabs; `TabScreens.tsx` registers stack screens.
- Param types in `src/navigation/navigation.types.ts`.

## 7. Error Handling & Observability

- `errorLogger.ts`: categories `API|Database|UI|Navigation|Service|Unknown`, severities `low|medium|high|critical`; persists to `error_logs`; truncates stacks (2000 chars); rotates at 500 rows; `DEV` also logs to console.
- `ErrorBoundary` wraps the app root; fatal vs non-fatal JS errors distinguished by `ErrorUtils` handler.
- Analytics via `posthogService`: singleton, `trackEvent`, `trackScreen`, `identifyUser`, `resetUser`, and an opt-out stored in AsyncStorage.

## 8. Theming

Three layers (see design-system skill for tokens):
1. NativeWind/Tailwind classes (`className`) — primary styling.
2. React Native Paper MD3 theme (`src/theme/theme.ts`) — component theming.
3. Legacy `StyleSheet` styles.

Never hardcode colors; prefer theme tokens.

## 9. Known Gaps

- `AuthContext` uses a dummy token; no real auth.
- No enforced permission model (roles from PRD).
- No automated CI pipeline.
- Backend API calls lack auth headers.
