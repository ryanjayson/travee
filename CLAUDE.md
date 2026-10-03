think of performance and production grade code when coding
check for vulnerabilities ahead of time

# Travee — AI Instructions

Full docs live in `docs/`. Read them in this order before coding:

1. `docs/AGENTS.md` — non-negotiable rules + Definition of Done
2. `docs/PRD.md` — scope and behavior
3. `docs/TRD.md` — stack, requirements, constraints
4. `docs/ARCHITECTURE.md` — layers, data model, where code lives
5. Relevant `.agents/skills/*` (design-system, feature-*, expo-*)

Key docs: `docs/README.md` (index), `docs/TESTING.md`, `docs/SECURITY.md`, `docs/RELEASE.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`.

Quick rules: offline-first (WatermelonDB is source of truth), no hardcoded colors (Paper theme/NativeWind), no direct `src/db` imports in UI, log errors via `errorLogger`, never touch `.env`. Any DB schema change needs a migration.
