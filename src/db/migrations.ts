import { schemaMigrations, addColumns, createTable } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "itinerary_activities",
          columns: [
            { name: "is_done", type: "boolean" },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        // This might have been skipped if schema version was bumped without migrations
      ],
    },
    {
      toVersion: 4,
      steps: [
        createTable({
          name: "itinerary_expenses",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "amount", type: "number" },
            { name: "date_time", type: "number" },
            { name: "currency", type: "string", isOptional: true },
            { name: "category", type: "string", isOptional: true },
            { name: "notes", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
  ],
});
