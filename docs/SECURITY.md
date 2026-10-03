# Security — Travee

> Scope: an offline-first mobile app handling a user's private travel data.

## 1. Principles

- Secrets never in source or logs.
- Sensitive preferences in `expo-secure-store`, not AsyncStorage.
- Local data is private by default.
- Collect the minimum analytics, with a user opt-out.

## 2. Secrets

- `.env` and `.env*.local` are git-ignored. Never commit or print their values.
- Env vars are injected at build time via `react-native-dotenv` (`@env`).
- Rotate any key that is ever exposed (screenshots, logs, shared builds).

## 3. Storage & Auth

- **SecureStore** (`src/services/local/securityService.ts`): PIN/biometric flags and user PIN.
- **WatermelonDB (SQLite)**: all trip data, unencrypted at rest.
- **AsyncStorage**: analytics opt-out flag.
- **AuthContext**: currently a dummy token; no real authentication.

## 4. Threat Model (current)

| Asset | Threat | Current control |
|-------|--------|-----------------|
| Trip data at rest | Device theft / backup extraction | OS sandbox only |
| App access | Shoulder surfing / stolen unlocked device | PIN + biometric gate |
| Env secrets | Repo/log leakage | gitignore, build-time injection |
| Analytics | PII leakage | Opt-out flag |
| Network | MITM / unauthorized API | HTTPS assumed; no auth header yet |

## 5. Findings (audit — documented, not yet fixed)

| ID | Finding | Severity | Recommendation |
|----|---------|----------|----------------|
| SEC-1 | PIN stored in plaintext in SecureStore (`setPin`) | High | Store a salted hash; verify by hashing input |
| SEC-2 | Local DB unencrypted (SQLite) | High | Consider SQLCipher / encrypted adapter for sensitive fields |
| SEC-3 | API calls send no `Authorization` header (`services/api/travel.ts`) | High | Add bearer token + secure token storage before enabling sync |
| SEC-4 | `console.log("API RESPONSE", data)` in `useApi.ts` may log PII | Medium | Remove or gate behind `__DEV__` |
| SEC-5 | `userId=12345` hardcoded in travel API fetches | Medium | Derive from authenticated session |
| SEC-6 | No input validation/sanitization policy for WebView URLs | Medium | Allowlist schemes/hosts before loading |
| SEC-7 | No dependency audit in CI | Low | Run `npm audit` on schedule/PR |
| SEC-8 | Analytics PII scope undefined | Low | Define allowed event properties; never send trip content |

## 6. Controls to Uphold

- Use `safeJsonParse` for all JSON DB fields (avoids prototype-pollution style input issues from stored/parsed data).
- Use `fetchWithTimeout` for all network calls.
- Never log secrets, tokens, or raw trip payloads.
- Keep OS permission prompts aligned with `app.json` (photos, camera, Face ID).

## 7. Checklist for New Features

- [ ] No secret introduced in code.
- [ ] Sensitive values go to SecureStore.
- [ ] Network calls use timeout + auth where applicable.
- [ ] No sensitive data in logs or analytics events.
- [ ] Inputs validated (Yup/form) before persistence.

## 8. Reporting

Report suspected vulnerabilities privately to the maintainer; do not open public issues with exploit details.
