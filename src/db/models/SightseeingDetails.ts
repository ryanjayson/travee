import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class SightseeingDetails extends Model {
  static table = "sightseeing_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("attraction_name") attractionName!: string;
  @text("address") address!: string | null;
  @text("entry_fee") entryFee!: string | null;
  @text("website_address") websiteAddress!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
