import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class ShoppingDetails extends Model {
  static table = "shopping_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("venue_name") venueName!: string;
  @text("address") address!: string | null;
  @text("sub_type") subType!: string | null;
  @text("website_address") websiteAddress!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
