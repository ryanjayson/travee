import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class TripMember extends Model {
  static table = "trip_members";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
  };

  @relation("travels", "travel_id") travel!: any;

  @text("name") name!: string;
  @text("description") description!: string | null;
  @text("email") email!: string | null;
  @field("is_offline") isOffline!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
