# Travee — Documentation

Single source of truth for product, architecture, and engineering process. All docs are written for both humans and AI agents and must stay in sync with the code.

## Doc Map

| Doc | Purpose | Update when |
|-----|---------|-------------|
| [PRD.md](./PRD.md) | What we build and why | Scope or behavior changes |
| [TRD.md](./TRD.md) | Technical requirements, stack, constraints | Stack or non-functional requirements change |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, data flow, folder map, data model | Structure, DB schema, or data flow changes |
| [AGENTS.md](./AGENTS.md) | Rules and workflow for AI agents | Conventions or Definition of Done change |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup, env, scripts, native builds | Tooling or commands change |
| [TESTING.md](./TESTING.md) | Test strategy, commands, mocking | Test tooling or coverage policy changes |
| [SECURITY.md](./SECURITY.md) | Secrets, storage, auth, threat model | Security posture or findings change |
| [RELEASE.md](./RELEASE.md) | Versioning and store submission | Release process changes |
| [DECISIONS.md](./DECISIONS.md) | Architecture decision log (ADRs) | Any significant technical decision |
| [ROADMAP.md](./ROADMAP.md) | Now / Next / Later and backlog intake | Priorities change |
| [CHANGELOG.md](./CHANGELOG.md) | Notable changes per release | Every user-facing change |

Appendices:
- [appendices/style-guide.md](./appendices/style-guide.md) — button/interaction rules (mirror of `.agents/rules/code-style-guide.md`)
- [appendices/play-store-checklist.md](./appendices/play-store-checklist.md)
- [appendices/app-store-checklist.md](./appendices/app-store-checklist.md)

## Skills Map

Skills maintained in `.agents/skills/`:

| Skill | Category | Purpose |
|-------|----------|---------|
| [`feature-offline-data`](../.agents/skills/feature-offline-data/SKILL.md) | Data & Storage | WatermelonDB schema, models, migrations, local services |
| [`feature-activity-types`](../.agents/skills/feature-activity-types/SKILL.md) | Feature Spec | Plan & activity types, per-type detail tables, forms registration |
| [`feature-activity-sorting`](../.agents/skills/feature-activity-sorting/SKILL.md) | Feature Spec | LexoRank chronological activity sorting algorithm |
| [`feature-expenses-and-splitting`](../.agents/skills/feature-expenses-and-splitting/SKILL.md) | Feature Spec | Trip expenses, categories, member bill splitting |
| [`feature-map-sharing`](../.agents/skills/feature-map-sharing/SKILL.md) | Feature Spec | MapViewer (WebView Mapbox), SVG CountryOutline, share card |
| [`feature-backup-restore`](../.agents/skills/feature-backup-restore/SKILL.md) | Data & Storage | Database snapshot, AES encryption, auto-backup, restore |
| [`design-system`](../.agents/skills/design-system/SKILL.md) | UI & Design | Colors, typography, spacing, component patterns across Paper/Tailwind |
| [`expo-tailwind-setup`](../.agents/skills/expo-tailwind-setup/SKILL.md) | UI & Design | Tailwind CSS v4, react-native-css, NativeWind v5 universal styling |
| [`vercel-react-best-practices`](../.agents/skills/vercel-react-best-practices/SKILL.md) | UI & Design | React / RN performance optimization guidelines |
| [`testing-rn`](../.agents/skills/testing-rn/SKILL.md) | Quality & Ops | Jest, jest-expo, RNTL, mock conventions, coverage strategy |
| [`code-review`](../.agents/skills/code-review/SKILL.md) | Quality & Ops | Standards and specification code review workflow |
| [`clean-code`](../.agents/skills/clean-code/SKILL.md) | Quality & Ops | Clean code, formatting, BKM, production refactoring, and line discipline |
| [`expo-deployment`](../.agents/skills/expo-deployment/SKILL.md) | Quality & Ops | Expo deployment to App Store, Play Store, web |
| [`skill-creator`](../.agents/skills/skill-creator/SKILL.md) | Workflows | Create, benchmark, and evaluate skills |
| [`to-spec`](../.agents/skills/to-spec/SKILL.md) | Workflows | Turn conversation into project tracker spec |
| [`to-tickets`](../.agents/skills/to-tickets/SKILL.md) | Workflows | Break plans/specs into tracer-bullet tickets |

## AI Read Order

Before coding, agents MUST read in this order:

1. [AGENTS.md](./AGENTS.md) — non-negotiable rules and workflow
2. [PRD.md](./PRD.md) — confirm the behavior is in scope
3. [TRD.md](./TRD.md) — confirm the technical approach
4. [ARCHITECTURE.md](./ARCHITECTURE.md) — find where code lives
5. The relevant skill under [`.agents/skills/`](../.agents/skills/) (see [Skills Map](#skills-map))
6. Then the actual source files.

Root entrypoints:
- `CLAUDE.md` — short project-level instructions
- `AGENTS.md` (repo root) — points to `docs/AGENTS.md`

## Maintenance Rules

- Docs are part of the Definition of Done: if code changes behavior, structure, or tooling, update the matching doc in the same change.
- Keep entries concise and factual. No aspirational content in PRD/TRD without an ROADMAP item.
- Significant technical choices go in DECISIONS.md with the ADR format.
- Do not duplicate long content across docs; link instead.
