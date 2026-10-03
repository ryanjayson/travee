---
name: feature-offline-data
description: WatermelonDB offline-first data layer for Travee - schema v5 tables, models, migrations, local service patterns, JSON columns, and the rules for adding or changing data. Use when touching src/db, src/services/local, or src/services/travel.
---

# Offline Data Layer (WatermelonDB)

Travee is offline-first: WatermelonDB (SQLite) is the **source of truth**. All UI reads/writes go through feature hooks → local services → `database`. Network/API is secondary and must never block a local action.

## Database Singleton

`src/db/index.ts`
- `SQLiteAdapter` with `dbName: "travelled_db"`, `jsi: false`.
- `onSetUpError` logs via `errorLogger` (`ERR_DB_SETUP`, critical).
- All models registered in `modelClasses` — a model that isn't registered is unusable.
- Import `{ database }` from `src/db`. **Never import the DB into a component/screen** — go through a hook/service.

## Schema (`src/db/schema.ts`)

`appSchema({ version: 5, tables: [...] })`. Column types: `string`, `number`, `boolean`; dates and JSON are stored as `number` (timestamp) and `string` (JSON) respectively.

Core tables:
- `travels`, `trip_destinations`, `trip_settings`
- `itinerary_sections`, `itinerary_activities`
- `itinerary_expenses`, `itinerary_notes`
- `checklist_groups`, `checklist_items`
- `trip_members`, `member_split_bills`
- `user_profiles`, `app_notifications`, `error_logs`

Type-specific detail tables (all indexed by `activity_id`):
`flight_details`, `accomodation_details`, `sightseeing_details`, `hike_or_camp_details`, `cafe_restaurant_details`, `nature_details`, `shopping_details`, `entertainment_details`, `transportation_details`, `walk_details`, `preparation_details`, `rest_details`, `motorcycle_ride_details`, `meetup_details`, `ride_rental_details`.

## Models (`src/db/models/*`)

Pattern:
```ts
import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class Activity extends Model {
  static table = "itinerary_activities";
  static associations = {
    itinerary_sections: { type: "belongs_to" as const, key: "section_id" },
  };
  @relation("itinerary_sections", "section_id") section!: any;
  @text("title") title!: string;
  @field("is_done") isDone!: boolean;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
```

Rules:
- Decorators require `experimentalDecorators` (already in `tsconfig.json`) and Babel legacy decorators.
- Always add `"belongs_to" as const` or relations won't typecheck.
- `created_at`/`updated_at` are `@readonly @date`.
- JSON columns are typed `string | null` on the model; parse at the service/hook boundary.

## Local Services (`src/services/local/*`, `src/services/travel/*`)

Write pattern:
```ts
await database.write(async () => {
  return await database.get<Expense>("itinerary_expenses").create((r) => {
    r.title = data.title;
    r.isOffline = true;
    // @ts-ignore - Watermelon assigns relation ids via the relation object
    r.travel.id = data.travelId;
  });
});
```

Read pattern:
```ts
const rows = await database
  .get<Expense>("itinerary_expenses")
  .query(Q.where("travel_id", travelId))
  .fetch();
```

Conventions:
- Services return DTOs (`src/features/Travel/types/*`) by mapping models, not raw models, to the UI.
- `saveXLocally` functions branch on `id` present → `update`, else `create`.
- Set `isOffline = true` on every local write.
- `travelService.ts` holds the large aggregate read/build logic (`getTravelPlanLocally`, `saveActivityLocally`) and the 15 `fetchLocal*Details` helpers.

## JSON Columns

Fields like `destination_data`, `images`, `attachments`, `custom_tags`, `secondary_type` are JSON strings. Always parse with `src/utils/safeJsonParse.ts`; never raw `JSON.parse`.

## `is_offline` / `user_id`

- `is_offline` marks records created/edited locally (pending sync).
- `user_id` on expenses/notes/checklists supports per-member private data.

## Adding or Changing Data

1. Edit `schema.ts` and bump `version` (never edit a released table in place).
2. Add a step to `src/db/migrations.ts` (`addColumns`, `createTable`, etc.).
3. Create the model in `src/db/models/` following the pattern above.
4. Register the model in `src/db/index.ts`.
5. Add service functions and a feature hook.
6. Add tests (`testing-rn` skill) and update `docs/ARCHITECTURE.md`.

## Key Files

| File | Purpose |
|------|---------|
| `src/db/index.ts` | Adapter + `database` + model registry |
| `src/db/schema.ts` | Tables, columns, schema version |
| `src/db/migrations.ts` | Versioned migrations |
| `src/db/models/` | WatermelonDB models |
| `src/services/local/` | Per-domain local services |
| `src/services/local/travelService.ts` | Core trip/section/activity persistence |
| `src/utils/safeJsonParse.ts` | Safe JSON parsing for model columns |
| `src/features/*/hooks/` | UI data hooks wrapping services |

## Known Issues / Gotchas

- **Relation writes use `// @ts-ignore` + `record.relation.id = ...`** throughout services. This is the existing convention; avoid refactoring blindly.
- `jsi: false` means less-than-optimal DB performance; large aggregate reads live in `travelService.ts` (2500+ lines) and can be slow — batch writes and avoid DB work during render.
- Restore (`backupService`) writes directly to `model._raw`, which couples backups to the internal Watermelon row shape (see `feature-backup-restore`).
- Some service reads cast to `any` (the 15 detail fetchers) — typing is weak for detail tables.
- No server sync/conflict resolution yet (`docs/ROADMAP.md`).
