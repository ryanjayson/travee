import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class RideRentalDetails extends Model {
  static table = "ride_rental_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("provider_name") providerName!: string;
  @text("address") address!: string | null;
  @text("vehicle_type") vehicleType!: string | null;
  @text("pickup_location") pickupLocation!: string | null;
  @text("dropoff_location") dropoffLocation!: string | null;
  @date("rental_start_date_time") rentalStartDateTime!: Date | null;
  @date("rental_end_date_time") rentalEndDateTime!: Date | null;
  @text("booking_reference") bookingReference!: string | null;
  @text("price") price!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
