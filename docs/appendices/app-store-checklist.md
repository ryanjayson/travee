# iOS App Store Release Checklist (appendix)

> Concise companion to `../RELEASE.md`. Authoritative detailed guide: `.agents/skills/expo-deployment/references/ios-app-store.md`.

## Preconditions
- [ ] Unique `ios.bundleIdentifier` set in `app.json` (currently placeholder `com.anonymous.travelled`).
- [ ] Production build number (EAS `autoIncrement`).
- [ ] Apple Developer + App Store Connect access.
- [ ] Privacy policy URL and support URL ready.

## Build & Signing
- [ ] Distribution certificate and provisioning profile configured in EAS.
- [ ] `npx eas build --profile production --platform ios`.

## App Store Connect
- [ ] App record created; bundle id matches.
- [ ] Version + build attached.
- [ ] Screenshots for required device sizes.
- [ ] Description, keywords, support/marketing URLs.
- [ ] App Privacy answers completed (matches actual collection).
- [ ] Age rating.
- [ ] Export compliance (encryption) answered.

## Review Notes
- [ ] Demo account / test instructions if login is required (currently dummy auth).
- [ ] Face ID usage string present (`app.json` infoPlist).
- [ ] Ensure no placeholder content or broken links.

## Submit
```bash
npx eas submit --platform ios
```
