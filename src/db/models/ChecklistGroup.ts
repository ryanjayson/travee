import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class ChecklistGroup extends Model {
  static table = "checklist_groups";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
  };

  @relation("travels", "travel_id") travel!: any;

  @text("title") title!: string;
  @text("description") description!: string | null;
  @text("sort_order") sortOrder!: string;
  @text("user_id") userId!: string | null;
  @field("is_offline") isOffline!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
