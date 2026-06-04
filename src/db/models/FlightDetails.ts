import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class FlightDetails extends Model {
  static table = "flight_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("departure_airport") departureAirport!: string;
  @text("arrival_airport") arrivalAirport!: string;
  @date("departure_date") departureDate!: Date;
  @date("arrival_date") arrivalDate!: Date | null;
  @text("flight_number") flightNumber!: string | null;
  @text("airline") airline!: string | null;
  @text("gate") gate!: string | null;
  @text("terminal") terminal!: string | null;
  @text("seat_number") seatNumber!: string | null;
  @text("booking_reference") bookingReference!: string | null;
  @field("price") price!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
