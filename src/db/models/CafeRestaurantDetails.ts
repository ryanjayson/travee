import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class CafeRestaurantDetails extends Model {
  static table = "cafe_restaurant_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("restaurant_name") restaurantName!: string;
  @text("address") address!: string | null;
  @text("cuisine") cuisine!: string | null;
  @text("price_range") priceRange!: string | null;
  @text("reservation_link") reservationLink!: string | null;
  @text("website_address") websiteAddress!: string | null;
  @text("contact_number") contactNumber!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
