import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class RestDetails extends Model {
  static table = "rest_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("rest_location_name") restLocationName!: string | null;
  @text("rest_location_type") restLocationType!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
