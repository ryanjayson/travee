import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import {
  safeFormatDate,
  safeFormatTime,
} from "../../../../../../../utils/dateTimeUtils";
import { ItineraryActivity } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";
import { ACTIVITY_PLAN_TYPES } from "../../../../../constants/activityPlanTypes";
import { useTravelContext } from "../../../../../../../context/TravelContext";
import { formatPrice } from "./activityDetailUtils";

interface PlanDetailsCardProps {
  activity?: ItineraryActivity | null;
  data?: any;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}

export const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({
  activity: rawActivity,
  data,
  onEditActivity,
}) => {
  const { openActivityModal } = useTravelContext();
  const activity = rawActivity || data;
  if (!activity) return null;

  const planTypeConfig = ACTIVITY_PLAN_TYPES.find(
    (p) => p.type === activity.planType || p.key === activity.planType
  );

  const themeColor = planTypeConfig?.color || "#c10003";
  const formattedBudget = formatPrice(activity.budget);

  const locationText =
    activity.destination ||
    activity.destinationData?.address ||
    activity.destinationData?.name ||
    "";

  const hasNameMismatch =
    activity.destinationData?.name &&
    activity.destinationData?.name !== activity.title;

  const hasPlanInfo = Boolean(
    activity.bookingReference ||
    activity.priority ||
    activity.budget ||
    activity.website
  );

  const hasContactInfo = Boolean(
    activity.contactName ||
    activity.contactNumber ||
    activity.contactEmail
  );

  const hasNotes = Boolean(activity.notes || activity.description);

  return (
    <View className="mt-6 px-2">
      <View
        className="p-2xl rounded-3xl mb-4 gap-6"
        style={{ backgroundColor: `${themeColor}30` }}
      >
        <View className="flex-row items-start w-full ">
          <View className="flex-col gap-2 flex-1">
            {hasNameMismatch ? (
              <View className="flex flex-col gap-3">
                <View className="flex flex-row gap-3 items-start flex-1">
                  <View className="flex-1">
                    <Text
                      className={
                        "text-2xl leading-xl font-semibold " +
                        "text-secondary tracking-tight"
                      }
                    >
                      {activity.destinationData?.name}
                    </Text>
                    <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                      {locationText}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              locationText && (
                <View className="flex flex-col flex-1">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="flex-1">
                      <Text
                        className={
                          "text-xs font-semibold text-secondary " +
                          "uppercase tracking-widest"
                        }
                      >
                        Address
                      </Text>
                      <Text className="text-secondary/60 font-normal leading-2xl text-xl">
                        {locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>

        {activity.startDate && (
          <View className="flex-row gap-6">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
                {activity.endDate ? "Start" : "Date"}
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {safeFormatTime(activity.startDate)}
              </Text>
              <Text className="text-base font-medium text-secondary/40">
                {safeFormatDate(activity.startDate)}
              </Text>
            </View>
          </View>
        )}

        {activity.endDate && (
          <View className="flex-row gap-6">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
                End
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {safeFormatTime(activity.endDate)}
              </Text>
              <Text className="text-base font-medium text-secondary/40">
                {safeFormatDate(activity.endDate)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <FadeInView type="down" delay={180} duration={400}>
        <View
          className="px-md mt-xl"
          style={{ display: hasPlanInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary ">
            {planTypeConfig ? `${planTypeConfig.label} Info` : "Plan Info"}
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
            <Field
              label="Booking Ref"
              value={activity.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
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

      <FadeInView type="down" delay={180} duration={400}>
        <View
          className="px-md mt-2xl"
          style={{
            display: hasContactInfo ? "flex" : "none",
          }}
        >
          <Text className="text-xl font-semibold text-secondary">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pb-1 pl-0">
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

      {!hasContactInfo && !hasPlanInfo && (
        <FadeInView type="down" delay={180} duration={400}>
          <TouchableOpacity
            onPress={() => {
              if (activity) {
                if (onEditActivity) {
                  onEditActivity(activity);
                } else {
                  openActivityModal(
                    activity,
                    activity.sectionId || undefined,
                    activity.travelId || undefined,
                    activity.type
                  );
                }
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit or add more details"
            className="flex-row items-center self-start mt-2 py-1 px-xs gap-1.5"
          >
            <Icon name="edit" size={20} color={"#0EA5E9"} />
            <Text
              className="text-base font-semibold"
              style={{ color: "#0EA5E9" }}
            >
              Edit or Add more detail
            </Text>
          </TouchableOpacity>
        </FadeInView>
      )}

      {hasNotes ? (
        <FadeInView type="down" delay={180} duration={400}>
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
