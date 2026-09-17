import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { ItineraryActivity } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";
import { ACTIVITY_PLAN_TYPES } from "../../../../Lookups/ActivityPlanTypeLookupModal";

interface PlanDetailsCardProps {
  activity?: ItineraryActivity | null;
  data?: any;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({
  activity: rawActivity,
  data,
}) => {
  const activity = rawActivity || data;
  if (!activity) return null;

  const planTypeConfig = ACTIVITY_PLAN_TYPES.find(
    (p) => p.type === activity.planType || p.key === activity.planType
  );

  const themeColor = planTypeConfig?.color || "#c10003";

  const formattedBudget = activity.budget
    ? activity.budget.startsWith("₱") || activity.budget.startsWith("$")
      ? activity.budget
      : !isNaN(Number(activity.budget))
      ? `₱${Number(activity.budget).toLocaleString()}`
      : activity.budget
    : null;

  const locationText =
    activity.destination ||
    activity.destinationData?.address ||
    activity.destinationData?.name ||
    "";

  const hasPlanInfo = Boolean(
    activity.bookingReference ||
    activity.planType ||
    activity.priority ||
    activity.budget ||
    locationText ||
    activity.website
  );

  const hasContactInfo = Boolean(
    activity.contactName ||
    activity.contactNumber ||
    activity.contactEmail
  );

  const hasNotes = Boolean(activity.notes || activity.description);

  return (
    <View className="mt-4 overflow-hidden">
      {/* Main Details Body */}
      <FadeInView delay={180} duration={400}>
        <View
          className="p-5 pb-0 rounded-t-3xl"
          style={{ backgroundColor: `${themeColor}26` }}
        >
          <View>
            <Text className="text-xs font-medium text-secondary/80 uppercase tracking-wide mb-1">
              {planTypeConfig ? `${planTypeConfig.label} Plan` : "Plan"}
            </Text>
            <Text className="text-2xl leading-2xl font-semibold mb-1 text-secondary">
              {activity.destinationData?.name || activity.title || "Plan"}
            </Text>

            <Text className="text-lg font-semibold mb-1 text-secondary/40">
              {locationText || "N/A"}
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center justify-between p-5 rounded-b-3xl"
          style={{ backgroundColor: `${themeColor}26` }}
        >
          <View className="flex-1">
            <Text className="text-xs font-semibold text-secondary/500 uppercase tracking-widest mb-1">
              Start
            </Text>
            <Text className="text-2xl font-semibold text-secondary/80">
              {safeFormatTime(activity.startDate)}
            </Text>
            <Text className="text-base font-medium text-secondary/80 mt-0.5">
              {safeFormatDate(activity.startDate)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={30} color={themeColor} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
              End
            </Text>
            <Text className="text-2xl font-semibold text-secondary/80 text-right">
              {activity.endDate ? safeFormatTime(activity.endDate) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-secondary/80 mt-0.5 text-right">
              {activity.endDate ? safeFormatDate(activity.endDate) : ""}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md my-lg"
          style={{ display: hasPlanInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Plan Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2">
            <Field
              label="Booking Ref"
              value={activity.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Plan Type"
              value={planTypeConfig?.label || (activity.planType ? String(activity.planType) : null)}
              icon={(planTypeConfig?.iconName || "lightbulb") as any}
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Priority"
              value={activity.priority}
              icon="flag"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Budget"
              value={formattedBudget}
              icon="attach-money"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Location"
              value={locationText}
              icon="place"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Website"
              value={activity.website}
              icon="link"
              showBorder={false}
              isLink={true}
              borderColor={`border-[${themeColor}]`}
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md"
          style={{
            display: hasContactInfo ? "flex" : "none",
          }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2 pb-1 pl-1">
            <Field
              label="Contact Person"
              value={activity.contactName}
              icon="person"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            />
            <Field
              label="Contact Number"
              value={activity.contactNumber}
              icon="phone"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
              isCall
            />
            <Field
              label="Email Address"
              value={activity.contactEmail}
              icon="email"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
              isEmail={true}
            />
          </View>
        </View>
      </FadeInView>

      {hasNotes ? (
        <FadeInView delay={180} duration={400}>
          <View className="px-md my-lg">
            <Text className="text-xl font-semibold text-secondary mt-lg">
              Notes
            </Text>
            <View className="rounded-2xl flex-col gap-3 p-2">
              <Text className="text-base text-secondary/60 leading-6">
                {activity.notes || activity.description}
              </Text>
            </View>
          </View>
        </FadeInView>
      ) : null}
    </View>
  );
};
