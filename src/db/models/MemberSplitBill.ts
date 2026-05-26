import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, relation } from "@nozbe/watermelondb/decorators";

export default class MemberSplitBill extends Model {
  static table = "member_split_bills";
  static associations = {
    travels: { type: "belongs_to" as const, key: "travel_id" },
    trip_members: { type: "belongs_to" as const, key: "member_id" },
  };

  @relation("travels", "travel_id") travel!: any;
  @relation("trip_members", "member_id") member!: any;

  @field("owes_amount") owesAmount!: number;
  @field("percentage_share") percentageShare!: number;
  @field("is_paid") isPaid!: boolean;
  @text("payment_type") paymentType!: string | null;
  @date("paid_date") paidDate!: Date | null;
  @text("notes") notes!: string | null;
  @field("is_offline") isOffline!: boolean;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
