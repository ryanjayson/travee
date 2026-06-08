import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class WalkDetails extends Model {
  static table = "walk_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("route_name") routeName!: string | null;
  @text("estimated_distance_km") estimatedDistanceKm!: string | null;
  @text("estimated_duration") estimatedDuration!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
