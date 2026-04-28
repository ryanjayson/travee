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
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "expense_category", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "user_id", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: "itinerary_notes",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "content", type: "string", isOptional: true },
            { name: "images", type: "string", isOptional: true },
            { name: "user_id", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        createTable({
          name: "checklist_groups",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "sort_order", type: "string" },
            { name: "user_id", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "checklist_items",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "checklist_group_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "sort_order", type: "string" },
            { name: "is_done", type: "boolean" },
            { name: "user_id", type: "string", isOptional: true },
            { name: "checked_by", type: "string", isOptional: true },
            { name: "checked_at", type: "number", isOptional: true },
            { name: "uncheck_by", type: "string", isOptional: true },
            { name: "uncheck_at", type: "number", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        addColumns({
          table: "travels",
          columns: [
            { name: "start_or_departure_date", type: "number", isOptional: true },
            { name: "end_or_return_date", type: "number", isOptional: true },
          ],
        }),
      ],
    },
  ],
});
