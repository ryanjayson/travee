import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class PreparationDetails extends Model {
  static table = "preparation_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("task_label") taskLabel!: string | null;
  @date("deadline_date_time") deadlineDateTime!: Date | null;
  @text("priority") priority!: string | null;
  @text("notes") notes!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
