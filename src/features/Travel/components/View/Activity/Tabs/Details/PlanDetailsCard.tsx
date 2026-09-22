import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { ItineraryActivity } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";
import { ACTIVITY_PLAN_TYPES } from "../../../../Lookups/ActivityPlanTypeLookupModal";
import { LinearGradient } from 'expo-linear-gradient';
import { useTravelContext } from "../../../../../../../context/TravelContext";

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
    activity.priority ||
    activity.budget ||
    // locationText ||
    activity.website
  );

  const hasContactInfo = Boolean(
    activity.contactName ||
    activity.contactNumber ||
    activity.contactEmail
  );

  const hasNotes = Boolean(activity.notes || activity.description);

  return (
    <View className="mt-4 px-2 overflow-hidden"
    >
      <FadeInView delay={180} duration={200}>
        <View
          className="p-5 pb-0 rounded-t-3xl"
          style={{ backgroundColor: `${themeColor}` }}
        >
          <View>
            <View className="flex-row items-start gap-2 w-full">
              <View className="flex-col gap-2 flex-1">
                {activity.destinationData?.name && activity.destinationData?.name != activity.title ?
                  <View className="flex flex-col gap-3">
                    <View className="flex flex-row gap-3 items-start flex-1">
                      <View className="pt-0.5">
                        <Icon name="location-on" size={34} color={"#FFFFFF"} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl leading-xl font-semibold text-white">
                          {activity.destinationData?.name}
                        </Text>
                        <Text className="text-white text-lg font-light">
                          {locationText}
                        </Text>
                      </View>
                    </View>
                  </View>
                  :
                  locationText && (
                    <View className="flex flex-col flex-1">
                      <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest ">
                        Address
                      </Text>
                      <Text className="mb-1 text-white text-xl font-light">
                        {locationText}
                      </Text>
                    </View>
                  )
                }
              </View>
            </View>
          </View>
        </View>

        <View
          className="flex-row items-center justify-between p-5 rounded-b-3xl"
          style={{ backgroundColor: `${themeColor}` }}
        >
          <View className="flex-1"
            style={{
              display: activity.startDate ? "flex" : "none",
            }}>
            <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1 ">
              {activity.endDate ? "Start" : "Date"}
            </Text>
            <Text className="text-2xl font-semibold text-white">
              {safeFormatTime(activity.startDate)}
            </Text>
            <Text className="text-base font-medium text-white/70 mt-0.5">
              {safeFormatDate(activity.startDate)}
            </Text>
          </View>

          {activity.endDate && activity.startDate && (
            <View className="px-3 items-center justify-center">
              <Icon name="chevron-right" size={38} color={"#FFFFFF"} style={{ opacity: .75 }} />
            </View>
          )}

          <View className="flex-1 items-end"
            style={{
              display: activity.endDate ? "flex" : "none",
            }}>
            <Text className="text-xs font-semibold text-white/80 uppercase tracking-widest mb-1">
              End
            </Text>
            <Text className="text-2xl font-semibold text-white text-right">
              {activity.endDate ? safeFormatTime(activity.endDate) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-white/80 mt-0.5 text-right">
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
            {planTypeConfig ? `${planTypeConfig.label} Info` : "Plan Info"}
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
            {/* <Field
              label="Location"
              value={locationText}
              icon="place"
              showBorder={false}
              borderColor={`border-[${themeColor}]`}
            /> */}
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

      <FadeInView delay={180} duration={400}>
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
          className="flex-row items-center self-start mt-6 py-1 px-xs gap-1.5"
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
