import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class AccomodationDetails extends Model {
  static table = "accomodation_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("accomodation_name") accomodationName!: string;
  @text("address") address!: string | null;
  @date("checkin_date_time") checkinDateTime!: Date;
  @date("checkout_date_time") checkoutDateTime!: Date | null;
  @text("website_address") websiteAddress!: string | null;
  @text("booking_reference") bookingReference!: string | null;
  @text("booking_status") bookingStatus!: string | null;
  @text("contact_number") contactNumber!: string | null;
  @text("email_address") emailAddress!: string | null;
  @text("contact_name") contactName!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
