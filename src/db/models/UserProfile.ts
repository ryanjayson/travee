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
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
