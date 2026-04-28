import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, children } from "@nozbe/watermelondb/decorators";

export default class Travel extends Model {
  static table = "travels";
  static associations = {
    itinerary_sections: { type: "has_many" as const, foreignKey: "travel_id" },
  };

  @text("title") title!: string;
  @text("description") description!: string | null;
  @text("destination") destination!: string | null;
  @text("destination_data") destinationData!: string | null;
  @date("start_or_departure_date") startOrDepartureDate!: Date | null;
  @date("end_or_return_date") endOrReturnDate!: Date | null;
  @field("status") status!: number;
  @text("budget") budget!: string | null;
  @text("notes") notes!: string | null;
  @field("is_offline") isOffline!: boolean;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;

  @children("itinerary_sections") itinerarySections!: any;
}
