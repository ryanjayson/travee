import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: "travels",
      columns: [
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "destination", type: "string", isOptional: true },
        { name: "destination_data", type: "string", isOptional: true }, // JSON string
        { name: "start_date", type: "number", isOptional: true }, // Date as timestamp
        { name: "end_date", type: "number", isOptional: true },
        { name: "status", type: "number", isOptional: true },
        { name: "budget", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "itinerary_sections",
      columns: [
        { name: "travel_id", type: "string", isIndexed: true },
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "destination", type: "string", isOptional: true },
        { name: "start_date", type: "number", isOptional: true },
        { name: "end_date", type: "number", isOptional: true },
        { name: "budget", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "sort_order", type: "string" },
        { name: "is_default_section", type: "boolean" },
        { name: "is_collapsed", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "itinerary_activities",
      columns: [
        { name: "section_id", type: "string", isIndexed: true },
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "destination", type: "string", isOptional: true },
        { name: "destination_data", type: "string", isOptional: true }, // JSON string
        { name: "start_date", type: "number", isOptional: true },
        { name: "end_date", type: "number", isOptional: true },
        { name: "budget", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "sort_order", type: "string" },
        { name: "type", type: "number", isOptional: true },
        { name: "secondary_type", type: "string", isOptional: true }, // JSON string
        { name: "images", type: "string", isOptional: true }, // JSON string
        { name: "is_done", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
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
});
