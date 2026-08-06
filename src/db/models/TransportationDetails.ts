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
  @date("departure_date_time") departureDateTime!: Date | null;
  @date("arrival_date_time") arrivalDateTime!: Date | null;
  @text("seat_or_vehicle_number") seatOrVehicleNumber!: string | null;
  @text("booking_reference") bookingReference!: string | null;
  @text("booking_status") bookingStatus!: string | null;
  @text("price") price!: string | null;
  @text("website_address") websiteAddress!: string | null;
  @text("contact_number") contactNumber!: string | null;
  @text("notes") notes!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
