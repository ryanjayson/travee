import { Model } from "@nozbe/watermelondb";
import { text, readonly, date, relation } from "@nozbe/watermelondb/decorators";

export default class TripDestination extends Model {
  static table = "trip_destinations";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
  };

  @relation("travels", "travel_id") travel!: any;
  @text("travel_id") travelId!: string;
  @text("destination") destination!: string;
  @text("destination_data") destinationData!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
