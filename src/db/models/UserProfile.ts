import { Model } from "@nozbe/watermelondb";
import { field, text, readonly, date } from "@nozbe/watermelondb/decorators";

export default class UserProfile extends Model {
  static table = "user_profiles";

  @text("username") username!: string | null;
  @text("nickname") nickname!: string | null;
  @text("travel_style") travelStyle!: string | null;
  @text("email") email!: string | null;
  @text("avatar_url") avatarUrl!: string | null;
  @text("default_currency") defaultCurrency!: string | null;
  @text("default_country") defaultCountry!: string | null;
  @field("account_type") accountType!: number; // 0 = Free, 1 = Premium
  @field("notifications_enabled") notificationsEnabled!: boolean;
  @field("notify_days_before_trip") notifyDaysBeforeTrip!: number;
  @field("notify_hours_before_activity") notifyHoursBeforeActivity!: number;
  @text("backup_frequency") backupFrequency!: string | null;
  @text("backup_location") backupLocation!: string | null;
  @field("backup_auto_enabled") backupAutoEnabled!: boolean;
  @field("last_backed_up_at") lastBackedUpAt!: number | null;
  @text("google_drive_account") googleDriveAccount!: string | null;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
