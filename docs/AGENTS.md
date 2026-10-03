# AGENTS — Travee AI Workflow Rules

> Non-negotiable. AI agents must follow this. Read `docs/README.md` for the full read order.

## 1. Before You Code

1. Confirm the request is in scope (`PRD.md`).
2. Confirm the technical approach (`TRD.md`) and locate files (`ARCHITECTURE.md`).
3. Load the relevant skill from `.agents/skills/`:
   - Data & Storage: [`feature-offline-data`](../.agents/skills/feature-offline-data/SKILL.md), [`feature-backup-restore`](../.agents/skills/feature-backup-restore/SKILL.md)
   - Features: [`feature-activity-sorting`](../.agents/skills/feature-activity-sorting/SKILL.md), [`feature-activity-types`](../.agents/skills/feature-activity-types/SKILL.md), [`feature-expenses-and-splitting`](../.agents/skills/feature-expenses-and-splitting/SKILL.md), [`feature-map-sharing`](../.agents/skills/feature-map-sharing/SKILL.md)
   - UI & Styling: [`design-system`](../.agents/skills/design-system/SKILL.md), [`expo-tailwind-setup`](../.agents/skills/expo-tailwind-setup/SKILL.md), [`vercel-react-best-practices`](../.agents/skills/vercel-react-best-practices/SKILL.md)
   - Testing & Review: [`testing-rn`](../.agents/skills/testing-rn/SKILL.md), [`code-review`](../.agents/skills/code-review/SKILL.md)
   - Deployment & Workflows: [`expo-deployment`](../.agents/skills/expo-deployment/SKILL.md), [`skill-creator`](../.agents/skills/skill-creator/SKILL.md), [`to-spec`](../.agents/skills/to-spec/SKILL.md), [`to-tickets`](../.agents/skills/to-tickets/SKILL.md)
4. Read the actual target files before editing.

## 2. Hard Rules

- **Offline-first:** never make a network call block a local action. Write to WatermelonDB first.
- **Layering:** UI → hooks → services → db. Never import `src/db` directly into a component.
- **Path alias:** import from `@/...` where possible (tsconfig + Jest both map `@/* → src/*`).
- **No hardcoded colors:** use React Native Paper `useTheme()` or NativeWind tokens. See design-system skill.
- **Buttons:** custom layouts use `TouchableOpacity`; standard actions use Paper `Button` (see `appendices/style-guide.md`).
- **Accessibility:** every touch target needs `accessibilityRole="button"`; icon-only controls need `accessibilityLabel`.
- **JSON columns:** always parse with `src/utils/safeJsonParse.ts`; never raw `JSON.parse` on DB fields.
- **Network:** use `src/utils/fetchWithTimeout.ts`; API responses follow the `{ isSuccess, data, errorMessage }` envelope (`useApi`).
- **Errors:** log via `errorLogger.logError` with a `category` and `severity`. No bare `console.log` in production code paths.
- **Secrets:** never read, print, or commit `.env` / `.env*.local`; never hardcode keys in source.
- **DB schema:** any schema change requires a migration + version bump (see ARCHITECTURE §5).
- **Analytics:** use `trackEvent`/`trackScreen`; respect the user opt-out (never bypass `posthogService`).

## 3. Conventions

- TypeScript everywhere; add types for new DTOs in `src/types` or the feature's `types/`.
- Feature code lives under `src/features/<Feature>/`; shared code under `src/components`, `src/hooks`, `src/utils`.
- Naming: components `PascalCase`, hooks `useXxx`, services `xxxService.ts`, tests `*.test.ts(x)` in `__tests__/`.
- Preserve existing patterns in neighboring files before introducing new libraries. Do not add a dependency that already exists in another form.

## 4. Adding an Activity Type or DB Table

1. Add the enum value in `src/types/enums.ts` and its label helper.
2. Add the table in `src/db/schema.ts` and bump `schema.version`.
3. Add a migration step in `src/db/migrations.ts`.
4. Create/register the model in `src/db/models/` and `src/db/index.ts`.
5. Add a service in `src/services/travel/` and a hook in `src/features/Travel/hooks/`.
6. Add the detail form under `src/features/Travel/components/Forms/` and wire it into the activity tabs.
7. Add tests and update the relevant docs.

## 5. Commands

```bash
npm test                 # run Jest
npm run test:watch       # watch mode
npm run test:coverage    # coverage
npx tsc --noEmit         # typecheck
npm start                # Expo dev server
npm run android          # native Android build
npm run ios              # native iOS build
```

## 6. Definition of Done

See `TRD.md` §6. In short: in scope, typed, tested, themed, accessible, errors logged, migration if needed, docs + CHANGELOG updated.

## 7. Do Not

- Do not commit unless explicitly asked.
- Do not modify `.env`, native generated folders, or `skills-lock.json`.
- Do not bypass the error logger, theme, or analytics opt-out.
- Do not introduce breaking schema changes without a migration.

## 8. References

- Style: [`.agents/rules/code-style-guide.md`](../.agents/rules/code-style-guide.md) and [`appendices/style-guide.md`](./appendices/style-guide.md)
- Design tokens: [`design-system`](../.agents/skills/design-system/SKILL.md)
- Feature specifications:
  - Offline-first data layer (WatermelonDB schema & models): [`feature-offline-data`](../.agents/skills/feature-offline-data/SKILL.md)
  - Activity types & detail forms: [`feature-activity-types`](../.agents/skills/feature-activity-types/SKILL.md)
  - Chronological activity sorting (LexoRank): [`feature-activity-sorting`](../.agents/skills/feature-activity-sorting/SKILL.md)
  - Expenses & member bill splitting: [`feature-expenses-and-splitting`](../.agents/skills/feature-expenses-and-splitting/SKILL.md)
  - Map viewer & share card: [`feature-map-sharing`](../.agents/skills/feature-map-sharing/SKILL.md)
  - Database backup & restore: [`feature-backup-restore`](../.agents/skills/feature-backup-restore/SKILL.md)
- Testing & Quality:
  - Unit & component testing: [`testing-rn`](../.agents/skills/testing-rn/SKILL.md)
  - Code review standards: [`code-review`](../.agents/skills/code-review/SKILL.md)
- UI & Platform:
  - Universal styling & Tailwind v4: [`expo-tailwind-setup`](../.agents/skills/expo-tailwind-setup/SKILL.md)
  - React & RN performance guidelines: [`vercel-react-best-practices`](../.agents/skills/vercel-react-best-practices/SKILL.md)
  - Deployment & store builds: [`expo-deployment`](../.agents/skills/expo-deployment/SKILL.md)
