# Decisions — ADR Log

Lightweight Architecture Decision Records. Newest first.

Format: **ID · Date · Status** then Context / Decision / Consequences.

---

## ADR-0006 — PostHog for product analytics · 2026 · Accepted (retroactive)
**Context:** Need product usage insight without blocking core functionality.
**Decision:** Use `posthog-react-native` behind a singleton service with a stored opt-out; run disabled if no API key.
**Consequences:** Analytics is optional and privacy-respecting; event/property taxonomy must be kept PII-free (`SECURITY.md`).

## ADR-0005 — React Native Paper for theming · 2026 · Accepted (retroactive)
**Context:** Need consistent MD3 components and a central theme across the app.
**Decision:** Use React Native Paper (`PaperProvider`) with `src/theme/theme.ts`; never hardcode colors.
**Consequences:** Components should consume `useTheme()`; NativeWind handles layout/utility styling.

## ADR-0004 — NativeWind v5 + Tailwind v4 · 2026 · Accepted (retroactive)
**Context:** Want utility-first styling for rapid, consistent UI.
**Decision:** Use NativeWind 5 preview with Tailwind 4 and `react-native-css`.
**Consequences:** Preview versions may require `lightningcss` pinning; styling has two overlapping systems (Tailwind + Paper).

## ADR-0003 — LexoRank for ordering · 2026 · Accepted (retroactive)
**Context:** Sections/activities need cheap reordering without renumbering siblings.
**Decision:** Store `sort_order` as a LexoRank string and use `useLexicographicSort`.
**Consequences:** Ordering is O(1) writes; see `feature-activity-sorting` skill.

## ADR-0002 — Offline-first with WatermelonDB · 2026 · Accepted (retroactive)
**Context:** Core use case must work without network or accounts.
**Decision:** WatermelonDB (SQLite adapter, `jsi: false`) is the source of truth; API is secondary.
**Consequences:** Schema changes require migrations; sync/conflict strategy is still open (`PRD.md`).

## ADR-0001 — Expo (prebuild) as the mobile platform · 2026 · Accepted (retroactive)
**Context:** Need fast cross-platform delivery with native modules.
**Decision:** Expo SDK 55 with prebuild (native folders generated, git-ignored) rather than Expo Go.
**Consequences:** Custom native modules supported; requires native rebuild workflows (`DEVELOPMENT.md`).

---

## Template

```
## ADR-XXXX — <title> · <date> · <Proposed|Accepted|Superseded>
Context: <forces at play>
Decision: <what we chose>
Consequences: <trade-offs, follow-ups>
```
