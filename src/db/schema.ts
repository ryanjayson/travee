import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 15,
  tables: [
    tableSchema({
      name: "travels",
      columns: [
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "destination", type: "string", isOptional: true },
        { name: "destination_data", type: "string", isOptional: true }, // JSON string
        { name: "start_or_departure_date", type: "number", isOptional: true }, // Date as timestamp
        { name: "end_or_return_date", type: "number", isOptional: true },
        { name: "status", type: "number", isOptional: true },
        { name: "budget", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "is_archived", type: "boolean", isOptional: true },
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
        { name: "expense_category", type: "number", isOptional: true },
        { name: "user_id", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "is_include_in_bill", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "itinerary_notes",
      columns: [
        { name: "travel_id", type: "string", isIndexed: true },
        { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
        { name: "title", type: "string" },
        { name: "content", type: "string", isOptional: true },
        { name: "images", type: "string", isOptional: true }, // JSON array of URIs
        { name: "user_id", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
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
    tableSchema({
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
    tableSchema({
      name: "user_profiles",
      columns: [
        { name: "username", type: "string", isOptional: true },
        { name: "display_name", type: "string", isOptional: true },
        { name: "email", type: "string", isOptional: true },
        { name: "avatar_url", type: "string", isOptional: true },
        { name: "default_currency", type: "string", isOptional: true },
        { name: "default_country", type: "string", isOptional: true },
        { name: "account_type", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "error_logs",
      columns: [
        // Categorization
        { name: "category", type: "string", isIndexed: true }, // 'API' | 'Database' | 'UI' | 'Navigation' | 'Service' | 'Unknown'
        { name: "severity", type: "string", isIndexed: true }, // 'low' | 'medium' | 'high' | 'critical'
        // Error identity
        { name: "error_code", type: "string", isOptional: true },   // e.g. 'ERR_NETWORK', 'ERR_DB_WRITE'
        { name: "message", type: "string" },                         // error.message
        { name: "stack_trace", type: "string", isOptional: true },   // error.stack (truncated)
        // Context
        { name: "screen", type: "string", isOptional: true },        // screen/component where it happened
        { name: "action", type: "string", isOptional: true },        // what user action triggered it
        { name: "context_data", type: "string", isOptional: true },  // JSON: relevant IDs, params, etc.
        // App state
        { name: "app_version", type: "string", isOptional: true },
        { name: "platform", type: "string", isOptional: true },      // 'ios' | 'android'
        { name: "device_info", type: "string", isOptional: true },   // JSON: model, OS version
        // Status
        { name: "is_resolved", type: "boolean" },
        { name: "resolved_note", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "trip_members",
      columns: [
        { name: "travel_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "email", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "member_split_bills",
      columns: [
        { name: "travel_id", type: "string", isIndexed: true },
        { name: "member_id", type: "string", isIndexed: true },
        { name: "owes_amount", type: "number" },
        { name: "percentage_share", type: "number" },
        { name: "is_paid", type: "boolean" },
        { name: "payment_type", type: "string", isOptional: true },
        { name: "paid_date", type: "number", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_offline", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
