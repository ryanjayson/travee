# Google Play Release Checklist (appendix)

> Concise companion to `../RELEASE.md`. Authoritative detailed guide: `.agents/skills/expo-deployment/references/play-store.md`.

## Preconditions
- [ ] Unique `android.package` set in `app.json` (currently placeholder `com.anonymous.travelled`).
- [ ] Production `versionCode` (EAS `autoIncrement`).
- [ ] Signed production build via EAS.
- [ ] Privacy policy URL and support contact ready.

## Store Listing
- [ ] App name, short + full description.
- [ ] App icon (512×512) and feature graphic (1024×500).
- [ ] Phone + tablet screenshots.
- [ ] Category and tags.

## Compliance
- [ ] Data safety form completed (matches actual data collection).
- [ ] Content rating questionnaire.
- [ ] Target API level meets current Play requirement.
- [ ] Ads declaration (none expected).
- [ ] Permissions justified: camera, photos, notifications.

## Rollout
- [ ] Internal testing track → closed → open → production.
- [ ] Staged rollout percentage.
- [ ] Monitor crash/ANR in Play Console vitals.

## Submit
```bash
npx eas submit --platform android
```
