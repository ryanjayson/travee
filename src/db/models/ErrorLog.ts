import { Model } from "@nozbe/watermelondb";
import { field, text, readonly, date } from "@nozbe/watermelondb/decorators";

export default class ErrorLog extends Model {
  static table = "error_logs";

  @text("category") category!: string;       // ErrorCategory enum value
  @text("severity") severity!: string;       // ErrorSeverity enum value
  @text("error_code") errorCode!: string | null;
  @text("message") message!: string;
  @text("stack_trace") stackTrace!: string | null;
  @text("screen") screen!: string | null;
  @text("action") action!: string | null;
  @text("context_data") contextData!: string | null;  // serialized JSON
  @text("app_version") appVersion!: string | null;
  @text("platform") platform!: string | null;
  @text("device_info") deviceInfo!: string | null;    // serialized JSON
  @field("is_resolved") isResolved!: boolean;
  @text("resolved_note") resolvedNote!: string | null;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
