import { schemaMigrations, createTable, addColumns } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: "itinerary_activities",
          columns: [
            { name: "custom_tags", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: "trip_settings",
          columns: [
            { name: "show_section_tab_navigation", type: "boolean", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 2,
      steps: [
        createTable({
          name: "trip_destinations",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "destination", type: "string" },
            { name: "destination_data", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
  ],
});
