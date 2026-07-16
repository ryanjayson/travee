import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class AppNotification extends Model {
  static table = "app_notifications";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
  };

  // @ts-ignore
  @relation("travels", "travel_id") travel!: any;

  @text("title") title!: string;
  @text("body") body!: string;
  @field("is_read") isRead!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
