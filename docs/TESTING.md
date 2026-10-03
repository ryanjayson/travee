# Testing — Travee

## 1. Stack

- **Jest** via `jest-expo` preset
- **@testing-library/react-native** for component tests
- Config: `jest.config.js`; setup: `jest.setup.ts`; env mock: `jest.env.mock.js`

## 2. Commands

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report (output: coverage/)
```

## 3. Configuration Notes

- `transformIgnorePatterns` allows transpiling RN/Expo/NativeWind/WatermelonDB/LexoRank.
- `moduleNameMapper`:
  - `^@/(.*)$ → <rootDir>/src/$1`
  - `^@env$ → <rootDir>/jest.env.mock.js`
- Tests live in `__tests__/` folders and use `*.test.ts(x)`.

## 4. What to Test

- **Services** (`src/services`, `src/features/*/services`): all CRUD and business rules.
- **Hooks**: data hooks in `src/features/*/hooks` and `src/hooks`.
- **Utils**: `src/utils/*` (see `geocodeUtils.test.ts`).
- **Forms/validation**: Yup schemas (`TravelSchema.test.ts`).
- **Components**: interactive and conditional UI (`FilesTab`, `ChecklistTab`, activity tabs).

Existing coverage areas (17 tests) include CreateOrEdit, EditSection, activity tabs (Plan/Flight/Accomodation/Transportation/RideRental/Checklist), DateTime, ActivityForm, TravelSchema, TripChecklist, EditChecklistItem, TripDetailScreen, GoogleMapView, geocodeUtils.

## 5. Mocking

- Mock `@env` via the provided mapper, or mock `expo-secure-store`, `expo-notifications`, `expo-local-authentication`, `expo-image-picker`, `expo-media-library` as needed.
- Mock WatermelonDB (`@nozbe/watermelondb`) for unit tests; prefer testing services with a mocked database/collection.
- Mock `posthogService` to assert analytics events and opt-out behavior.
- Keep `jest.setup.ts` as the shared home for global mocks.

## 6. Policy

- New feature logic must ship with tests.
- Bug fixes must include a regression test.
- Do not lower coverage on touched files.
- No network calls in tests; mock fetch.

## 7. Gaps

- No CI workflow yet (no `.github/workflows`). Propose running `npx tsc --noEmit` + `npm test` on PRs.
- No global coverage threshold configured.
