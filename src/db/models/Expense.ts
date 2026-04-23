import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class Expense extends Model {
  static table = "itinerary_expenses";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("travels", "travel_id") travel!: any;
  @relation("itinerary_activities", "activity_id") activity!: any;
  
  @text("title") title!: string;
  @field("amount") amount!: number;
  @date("date_time") dateTime!: Date;
  @text("currency") currency!: string | null;
  @text("category") category!: string | null;
  @text("notes") notes!: string | null;
  @field("is_offline") isOffline!: boolean;
  
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
