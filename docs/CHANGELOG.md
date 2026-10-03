# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Project documentation set under `docs/` (PRD, TRD, architecture, agent workflow, testing, security, release, ADRs, roadmap).
- Checklist items bottom sheet and reusable checklist row components.
- Image/attachment deletion with confirmation dialogs in the activity files tab.

### Changed
- Enhance location parsing; pass destination data to transportation and ride-rental components.
- Consolidated activity checklist tab; updated plan details UI.
- Replaced `ActivityType` with `TripPlanType` for travel activities and services.

### Removed
- Unused screens, components, assets, and legacy files.
- Unused activity-related libraries and components.

### Security
- Documented current findings SEC-1 … SEC-8 (`docs/SECURITY.md`); no fixes applied yet.

---

> Older history: see `git log`. Add entries per release using Added / Changed / Fixed / Removed / Security.
