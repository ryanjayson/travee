import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class TripSetting extends Model {
  static table = "trip_settings";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
  };

  @relation("travels", "travel_id") travel!: any;

  @text("currency") currency!: string;
  @text("timezone") timezone!: string;
  @text("itinerary_view") itineraryView!: string;
  @field("allow_item_reordering") allowItemReordering!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
