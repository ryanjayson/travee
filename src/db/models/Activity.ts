import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class Activity extends Model {
  static table = "itinerary_activities";
  static associations = {
    itinerary_sections: { type: "belongs_to" as const, key: "section_id" },
  };

  @relation("itinerary_sections", "section_id") section!: any;
  @text("title") title!: string;
  @text("description") description!: string | null;
  @text("destination") destination!: string | null;
  @text("destination_data") destinationData!: string | null;
  @date("start_date") startDate!: Date | null;
  @date("end_date") endDate!: Date | null;
  @text("budget") budget!: string | null;
  @text("notes") notes!: string | null;
  @field("is_offline") isOffline!: boolean;
  @text("sort_order") sortOrder!: string;
  @field("type") type!: number | null;
  @text("secondary_type") secondaryType!: string | null;
  @text("images") images!: string | null;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
