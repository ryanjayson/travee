import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { schema } from "./schema";
import migrations from "./migrations";
import Travel from "./models/Travel";
import Section from "./models/Section";
import Activity from "./models/Activity";
import Expense from "./models/Expense";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // (Optional) Database name
  dbName: "travie_db",
  // (Recommended) Setting this to false might improve performance
  jsi: false,
  onSetUpError: (error) => {
    // Database failed to load -- provide backwards compatibility or its runtime error
    console.error("WatermelonDB setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Travel, Section, Activity, Expense],
});
