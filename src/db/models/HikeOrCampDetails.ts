import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation, field } from "@nozbe/watermelondb/decorators";

export default class HikeOrCampDetails extends Model {
  static table = "hike_or_camp_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("trail_or_site_name") trailOrSiteName!: string;
  @text("address") address!: string | null;
  @text("sub_type") subType!: string | null;
  @text("estimated_distance_km") estimatedDistanceKm!: string | null;
  @text("campsite_name") campsiteName!: string | null;
  @field("permit_required") permitRequired!: boolean | null;
  @text("contact_person") contactPerson!: string | null;
  @text("contact_number") contactNumber!: string | null;
  @text("website_address") websiteAddress!: string | null;
  @text("reservation_link") reservationLink!: string | null;
  @date("checkin_date_time") checkinDateTime!: Date | null;
  @date("checkout_date_time") checkoutDateTime!: Date | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
