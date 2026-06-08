import { Model } from "@nozbe/watermelondb";
import { text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class MeetupDetails extends Model {
  static table = "meetup_details";
  static associations = {
    itinerary_activities: { type: "belongs_to" as const, key: "activity_id" },
  };

  @relation("itinerary_activities", "activity_id") activity!: any;

  @text("venue_name") venueName!: string;
  @text("address") address!: string | null;
  @text("host_or_organizer") hostOrOrganizer!: string | null;
  @text("number_of_people") numberOfPeople!: string | null;
  @text("meetup_type") meetupType!: string | null;
  @text("rsvp_link") rsvpLink!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
