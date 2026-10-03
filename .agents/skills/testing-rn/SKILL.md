---
name: testing-rn
description: Testing and mocking conventions for Travee - Jest with jest-expo and React Native Testing Library, global mocks in jest.setup.ts, path/env module mapping, and what to test. Use when writing or fixing tests.
---

# Testing (React Native)

Stack: **Jest** (`jest-expo` preset) + **@testing-library/react-native**.

## Commands

```bash
npm test              # all tests
npm run test:watch    # watch
npm run test:coverage # coverage -> coverage/
npx tsc --noEmit      # typecheck (part of DoD)
```

## Configuration

`jest.config.js`
- `preset: "jest-expo"`
- `setupFilesAfterEach`: `jest.setup.ts`
- `transformIgnorePatterns`: RN/Expo/NativeWind/WatermelonDB/LexoRank must be transpiled.
- `moduleNameMapper`:
  - `^@/(.*)$` → `<rootDir>/src/$1`
  - `^@env$` → `<rootDir>/jest.env.mock.js`
- Extensions: `ts, tsx, js, jsx, json`.

## Global Mocks (`jest.setup.ts`)

Already mocked — reuse, don't re-mock locally:
- AsyncStorage, WatermelonDB (`Database`, SQLite adapter), `@expo/vector-icons`, `react-native-vector-icons`
- `expo-linear-gradient`, `@react-native-community/datetimepicker`, `react-native-modal-datetime-picker`
- `react-native-safe-area-context`, `@react-navigation/native` (`useNavigation`, `useRoute`, `useFocusEffect`)
- `react-native-webview`, `react-native-calendars`
- `expo-image-picker`, `expo-document-picker`
- `react-native-reanimated` (`setUpTests()`), `@/context/TravelContext`
- Console warning filter

Other modules used by the app that may need mocks per test: `expo-secure-store`, `expo-notifications`, `expo-local-authentication`, `expo-file-system` (`File`, `Paths`), `expo-sharing`, `posthog-react-native`.

## Conventions

- Files: `__tests__/<Name>.test.tsx` (or `.test.ts` for pure logic), colocated with the component/service.
- Prefer `@testing-library/react-native` queries (`getByText`, `getByTestId`, `fireEvent`).
- Services: mock the DB and assert on `create`/`update`/`query` behavior (the global DB mock returns empty collections by default — override per test when needed).
- Hooks: wrap in the providers needed (`PaperProvider`, `QueryClientProvider`) or mock contexts.
- Never make real network calls; mock `fetch` / `useApi` / `posthogService`.
- New feature logic must ship with tests; bug fixes need a regression test.

## Existing Coverage

17 suites across: CreateOrEdit, EditSection, activity tabs (Plan/Flight/Accomodation/Transportation/RideRental/Checklist), DateTime, ActivityForm, `TravelSchema.test.ts`, TripChecklist, EditChecklistItem, TripDetailScreen, GoogleMapView, `geocodeUtils.test.ts`, FilesTab.

## Known Issues / Gotchas

- **Pre-existing failures:** at the time of writing `npm test` reports ~5 failing suites / ~9 failing tests (e.g. `AccomodationTab.test.tsx`), largely due to uncommitted in-progress code. Re-run before assuming a failure is yours.
- **No CI**: there is no `.github/workflows`; typecheck + tests are not enforced on PRs.
- **No coverage threshold** configured.
- The global WatermelonDB mock is shallow; tests that need real model behavior should mock `src/services/*` instead of the DB.
- `@env` is replaced by `jest.env.mock.js` — don't import real secrets in tests.
