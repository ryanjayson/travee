import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, children, relation } from "@nozbe/watermelondb/decorators";

export default class Section extends Model {
  static table = "itinerary_sections";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
    itinerary_activities: { type: "has_many" as const, foreignKey: "section_id" },
  };

  @relation("travels", "travel_id") travel!: any;
  @text("title") title!: string;
  @text("description") description!: string | null;
  @text("destination") destination!: string | null;
  @date("start_date") startDate!: Date | null;
  @date("end_date") endDate!: Date | null;
  @text("budget") budget!: string | null;
  @text("notes") notes!: string | null;
  @field("is_offline") isOffline!: boolean;
  @text("sort_order") sortOrder!: string;
  @field("is_default_section") isDefaultSection!: boolean;
  @field("is_collapsed") isCollapsed!: boolean;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;

  @children("itinerary_activities") itineraryActivities!: any;
}
