import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class ChecklistItem extends Model {
  static table = "checklist_items";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
    checklist_groups: { type: "belongs_to" as const, key: "checklist_group_id" },
  };

  @relation("travels", "travel_id") travel!: any;
  @relation("itinerary_activities", "activity_id") activity!: any;
  @relation("checklist_groups", "checklist_group_id") checklistGroup!: any;

  @text("title") title!: string;
  @text("description") description!: string | null;
  @text("sort_order") sortOrder!: string;
  @field("is_done") isDone!: boolean;
  @text("user_id") userId!: string | null;
  @text("checked_by") checkedBy!: string | null;
  @date("checked_at") checkedAt!: Date | null;
  @text("uncheck_by") uncheckBy!: string | null;
  @date("uncheck_at") uncheckAt!: Date | null;
  @field("is_offline") isOffline!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
