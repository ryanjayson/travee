# Development — Travee

## 1. Prerequisites

- Node.js (LTS) and npm
- Xcode + CocoaPods (iOS)
- Android Studio + SDK (Android)
- Watchman recommended on macOS

## 2. Install

```bash
npm install
```

## 3. Environment

Create `.env` (git-ignored) with:

```
API_BASE_URL=
GOOGLE_MAPS_API_KEY=
MAPBOX_ACCESS_TOKEN=
POSTHOG_API_KEY=      # optional; analytics runs disabled without it
POSTHOG_HOST=         # optional; defaults to https://us.i.posthog.com
```

`.env.local` may hold local overrides. Never commit either file.

## 4. Run

```bash
npm start          # Expo dev server
npm run android    # native Android build (expo run:android)
npm run ios        # native iOS build (expo run:ios)
npm run web        # expo start --web
```

## 5. Native Rebuilds

Native folders (`/ios`, `/android`) are generated (git-ignored). When native deps or caches get corrupted:

```bash
rm -rf node_modules android/.gradle android/app/build android/build
npm install
npx expo run:android
```

Clear Metro cache:

```bash
npx expo start -c
```

Release APK build:

```bash
npx expo run:android --variant release
```

Serve the APK locally for a physical device:

```bash
ipconfig getifaddr en0          # get your LAN IP
python3 -m http.server 8000
# open http://<IP>:8000/android/app/build/outputs/apk/release/
```

## 6. Running on a Physical Device

Expo Go is not supported (custom native modules). Use a development build:

```bash
adb devices                     # confirm device detected
npx expo run:android            # builds + installs onto USB device
# or
npx eas build --profile development --platform android
```

## 7. Project Conventions

- Path alias `@/* → src/*`.
- Tests via Jest with `jest-expo` (`npm test`).
- Typecheck: `npx tsc --noEmit`.
- Code style: `.agents/rules/code-style-guide.md`.

## 8. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Stale JS/asset bundle | `npx expo start -c` |
| Native module not found | clean native dirs and `npx expo run:android` / `run:ios` |
| Gradle build failure | `rm -rf android/.gradle android/app/build android/build` then rebuild |
| WatermelonDB init error | check `src/db/migrations.ts` and app reinstall |
| Env var undefined | confirm key exists in `.env`; restart Metro (dotenv is build-time) |
