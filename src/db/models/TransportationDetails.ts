import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class TransportationDetails extends Model {
  static table = "transportation_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("mode") mode!: string | null;
  @text("operator_provider") operatorProvider!: string | null;
  @text("pickup_location") pickupLocation!: string | null;
  @text("dropoff_location") dropoffLocation!: string | null;
  @text("booking_reference") bookingReference!: string | null;
  @text("price") price!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
