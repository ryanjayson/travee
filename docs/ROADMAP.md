# Roadmap — Travee

## Now

- Activity editing and detail forms (flight, stay, transit, rental, tour).
- Checklist groups/items and bottom-sheet UX.
- Location parsing and map integration.
- Map sharing / overlay export (`feature-map-sharing`).

## Next

- Real authentication (replace dummy `AuthContext` token) and secure token storage.
- Trip member roles enforcement (owner/planner/contributor/member) at the data layer.
- Backup/restore hardening and scheduled auto-backup.
- OCR activity import from images (`ocrParser`).
- Accessibility pass across interactive components.
- CI: typecheck + tests on PR.

## Later

- Server sync with conflict resolution (offline-first reconciliation).
- Publish/share trips publicly.
- Comments and collaboration.
- Cross-device account migration from local-only data.

## Backlog Intake

When filing a feature or bug, add an entry below using:

```
### <Feature|Bug> — <short title>
- Area: <trips | itinerary | activities | money | checklist | notes | members | catalog | settings | infra>
- Severity/Impact: <low | medium | high>
- Repro (bugs): <steps>
- Expected / Actual:
- Links: <PR / issue / screenshot>
```

_(No open items recorded yet.)_

## Security Follow-ups

See findings SEC-1 … SEC-8 in `SECURITY.md`.
