import { schemaMigrations, createTable } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
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
