import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class NatureDetails extends Model {
  static table = "nature_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("spot_name") spotName!: string;
  @text("address") address!: string | null;
  @text("sub_type") subType!: string | null;
  @text("entry_fee") entryFee!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
