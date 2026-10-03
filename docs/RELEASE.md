# Release — Travee

## 1. Versioning

- App version: `expo.version` in `app.json` (currently `1.0.0`).
- iOS build number / Android versionCode are managed by EAS (use `autoIncrement`).
- Bundle/package id is currently the placeholder `com.anonymous.travelled` — **must be replaced before store submission** in `app.json` (`ios.bundleIdentifier`, `android.package`).

## 2. Pre-Release Checklist

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm test` green.
- [ ] Version bumped and `docs/CHANGELOG.md` updated.
- [ ] `.env` production values verified (never committed).
- [ ] App name, icon, splash, and permissions reviewed in `app.json`.
- [ ] Bundle/package id finalized.
- [ ] Smoke test on a real iOS and Android device (offline mode, backup/restore, security lock).

## 3. Build

EAS Build (see `expo-deployment` skill for full commands):

```bash
npx eas build --profile preview --platform all      # internal testing
npx eas build --profile production --platform all   # store binaries
```

## 4. Store Submission

- **iOS:** `npx eas submit --platform ios` — full steps in `appendices/app-store-checklist.md`.
- **Android:** `npx eas submit --platform android` — full steps in `appendices/play-store-checklist.md`.

Required assets/metadata: app icon, splash, screenshots per device size, description, privacy policy URL, support URL, content rating, data-safety disclosures.

## 5. Rollback

- Native binaries: halt the store rollout / use staged rollout controls.
- JS-only fixes: ship a new build (no OTA configured).
- Never rewrite a published version; always increment.

## 6. Post-Release

- Monitor crashes and `error_logs`, and PostHog event errors.
- Tag the release in git (`vX.Y.Z`).
- Open follow-ups in `ROADMAP.md`.
