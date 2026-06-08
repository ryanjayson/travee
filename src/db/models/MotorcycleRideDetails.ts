import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class MotorcycleRideDetails extends Model {
  static table = "motorcycle_ride_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("route_name") routeName!: string | null;
  @text("starting_point") startingPoint!: string | null;
  @text("ending_point") endingPoint!: string | null;
  @text("estimated_distance_km") estimatedDistanceKm!: string | null;
  @text("road_type") roadType!: string | null;
  @text("bike_model") bikeModel!: string | null;
  @text("fuel_stops") fuelStops!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
