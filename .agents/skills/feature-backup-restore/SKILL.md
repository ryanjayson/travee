---
name: feature-backup-restore
description: Travee database backup and restore - full JSON snapshot, encryption via utils/crypto, expo file/document/sharing flow, scheduled auto-backup, and restore semantics. Use when working on export, import, backup, or data portability.
---

# Backup & Restore

`src/services/local/backupService.ts` snapshots the entire database to JSON, encrypts it, and exports via the share sheet; restore wipes and recreates all tables from a selected file.

## Payload Contract

```ts
interface BackupPayload {
  appName: string;        // "Travee"
  version: number;        // payload format version (currently 1)
  schemaVersion: number;  // currently 1 (note: DB schema is v5)
  createdAt: string;      // ISO
  tables: Record<string, any[]>;  // raw rows per table
}
```

`ALL_TABLE_NAMES` is a hardcoded allowlist (27 tables) that **must be updated when a table is added**. It currently excludes some newer tables (e.g. `trip_destinations`, `error_logs`).

## Export Flow

`exportBackupLocally()`:
1. `generateBackupPayload()` — reads every table via `database.get(table).query().fetch()`, maps `{ ...record._raw }`.
2. `JSON.stringify` → `encryptBackupPayload()` (`src/utils/crypto.ts`).
3. Writes `travee_backup_<date>.json` to `Paths.cache` via `expo-file-system` `File`.
4. Shares via `expo-sharing` (or reports the file path).
5. Tracks `backup_completed` / `backup_failed` PostHog events.

`uploadBackupToGoogleDrive()` — currently a **simulated** flow (writes a local `gdrive_*.json`, no real Drive API).

## Encryption Container

`encryptBackupPayload()` returns JSON:
```ts
{ traveeEncrypted: true, version: 1, algorithm: "AES-256-CTR", iv, ciphertext, checksum }
```
- Master key: 256-bit hex stored in `expo-secure-store` (`travee_backup_master_key_v1`).
- `decryptBackupPayload()` also accepts legacy plaintext (non-container JSON) unchanged.

## Restore Flow

`restoreBackupFromFile(customFileUri?)`:
1. Pick a file via `expo-document-picker` if no URI given.
2. Read with `File.text()`, `decryptBackupPayload()`, `JSON.parse`.
3. Validate `payload.tables` exists.
4. In one `database.write`: for each table, `destroyPermanently()` all existing rows, then `collection.create` and `Object.assign(model._raw, recordData)`.
5. Returns `{ success, restoredCount, message }`.

## Scheduled Auto-Backup

`checkAndRunScheduledBackup(profile)` — honors `profile.backupAutoEnabled`, `backupFrequency` (`weekly` / `monthly` / `quarterly`), `backupLocation` (`local` / `google_drive`), updates `lastBackedUpAt` on success.

## UI & Profile Fields

- UI: `src/features/Settings/Database/index.tsx`.
- Profile: `UserProfileDto` (`backupFrequency`, `backupLocation`, `backupAutoEnabled`, `lastBackedUpAt`, `googleDriveAccount`).

## Rules

- **Restore is destructive** — it permanently deletes all current data before importing. Confirm with the user (`ConfirmContext`) and consider auto-backup first.
- Keep `ALL_TABLE_NAMES` in sync with `src/db/schema.ts` (see `feature-offline-data`).
- Never log backup contents or keys.

## Known Issues / Gotchas

- **`crypto.ts` is not real AES.** Despite the `AES-256-CTR` label it uses SHA-256 as a keystream XOR, and generates keys/IVs with `Math.random()` (not cryptographically secure). Treat backups as obfuscated, not securely encrypted. See `docs/SECURITY.md`.
- **Key is device-bound.** The master key lives in the device keystore; a backup restored on a different device may fail checksum verification (decryption still proceeds with a warning only).
- Checksum mismatch is only a `console.warn` — restore does not hard-fail on tampering.
- `uploadBackupToGoogleDrive` is simulated; no OAuth/Drive SDK.
- Restore writes to `model._raw`, coupling backups to WatermelonDB's internal row format; schema changes can break old backups.
- `schemaVersion` in the payload is hardcoded to `1` and not validated against the live schema.
- `trip_destinations` and `error_logs` are not backed up.
