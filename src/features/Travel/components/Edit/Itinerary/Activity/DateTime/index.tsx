import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { useTravelPlan } from "../../../../../hooks/useTravel";
import { ActivityType } from "../../../../../../../types/enums";

interface DateTimeProps {
  activityType?: ActivityType | number | string;
  type?: ActivityType | number | string;
  title?: string;
  description?: string;
  startDate: string | null;
  startTime: string;
  endDate?: string | null;
  endTime?: string;
  onPressDate: () => void;
  onPressTime: () => void;
  onClearDate: () => void;
  onClearTime: () => void;
  onPressEndDate?: () => void;
  onPressEndTime?: () => void;
  onClearEndDate?: () => void;
  onClearEndTime?: () => void;
  allowedClear?: boolean;
}

export default function DateTime({
  activityType,
  type,
  title,
  description,
  startDate,
  startTime,
  endDate,
  endTime,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
  onPressEndDate,
  onPressEndTime,
  onClearEndDate,
  onClearEndTime,
  allowedClear = true,
}: DateTimeProps) {
  const formik = useFormikContext<any>();
  const effectiveActivityType = activityType ?? type ?? formik?.values?.type;
  const travelId = formik?.values?.travelId || "";
  const { data: travelPlan } = useTravelPlan(travelId);
  const currentSectionId = formik?.values?.sectionId || "";
  const selectedSection = travelPlan?.itinerarySection?.find((s: any) => s.id === currentSectionId);
  const isSectionDateSet = !!selectedSection?.startDate;

  const finalAllowedClear = allowedClear && !isSectionDateSet;

  const defaultTitle = effectiveActivityType === ActivityType.stay
    ? "Check-In Date & Time"
    : "Date & Time";

  const defaultDescription = effectiveActivityType === ActivityType.stay
    ? null
    : "Plans with date and time are sorted based on their scheduled and cannot be reordered.";

  const startDateLabel = effectiveActivityType === ActivityType.stay
    ? "Check-In Date & Time"
    : "Start Date & Time";

  const endDateLabel = effectiveActivityType === ActivityType.stay
    ? "Check-Out Date & Time"
    : "End Date & Time";

  return (
    <View className="mb-5">
      <Text className="text-lg text-secondary/80 font-semibold mb-1">
        {title || defaultTitle}
      </Text>

      {description !== undefined ? (
        description ? (
          <Text className="text-base text-tertiary mb-2">
            {description}
          </Text>
        ) : null
      ) : (
        defaultDescription && (
          <Text className="text-base text-tertiary mb-2">
            {defaultDescription}
          </Text>
        )
      )}

      {/* Start Date & Time Label (when date range is present) */}
      {endDate ? (
        <Text className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">
          {startDateLabel}
        </Text>
      ) : null}

      <View className={`flex-row items-center gap-4 ${endDate ? "mt-0" : "mt-2"}`}>
        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl">
          <TouchableOpacity
            onPress={onPressDate}
            className={`flex-1 flex-row items-center p-5 gap-2 ${!finalAllowedClear ? "opacity-30" : ""}`}
            accessibilityRole="button"
            accessibilityLabel="Select date"
            disabled={!finalAllowedClear}
          >
            <Icon name="calendar-today" size={24} color="#98A2B3" />
            <Text className={`text-lg  ${startDate ? "text-gray-800" : "text-[#98A2B3]"}`}>
              {startDate ? String(startDate) : "Date"}
            </Text>
          </TouchableOpacity>
          {startDate && finalAllowedClear && (
            <TouchableOpacity
              onPress={onClearDate}
              className="pr-4 py-3"
              accessibilityRole="button"
              accessibilityLabel="Clear date"
            >
              <Icon name="close" size={22} color="#98A2B3" />
            </TouchableOpacity>
          )}
        </View>
        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl">
          <TouchableOpacity
            onPress={onPressTime}
            className={`flex-1 flex-row items-center p-5 gap-2 ${!finalAllowedClear ? "opacity-30" : ""}`}
            accessibilityRole="button"
            accessibilityLabel="Select time"
            disabled={!finalAllowedClear}
          >
            <Icon name="access-time" size={24} color="#98A2B3" />
            <Text className={`text-lg ${startTime ? "text-gray-800" : "text-[#98A2B3]"}`}>
              {startTime ? String(startTime) : "Time"}
            </Text>
          </TouchableOpacity>
          {startTime !== "" && finalAllowedClear && (
            <TouchableOpacity
              onPress={onClearTime}
              className="pr-4 py-3"
              accessibilityRole="button"
              accessibilityLabel="Clear time"
            >
              <Icon name="close" size={22} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Additional Row for End Date & Time when date is a range */}
      {endDate ? (
        <View className="mt-3">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-1">
            {endDateLabel}
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl">
              <TouchableOpacity
                onPress={onPressEndDate || onPressDate}
                className="flex-1 flex-row items-center p-5 gap-2"
                accessibilityRole="button"
                accessibilityLabel="Select end date"
              >
                <Icon name="calendar-today" size={24} color="#98A2B3" />
                <Text className={`text-lg ${endDate ? "text-gray-800" : "text-[#98A2B3]"}`}>
                  {String(endDate)}
                </Text>
              </TouchableOpacity>
              {onClearEndDate && (
                <TouchableOpacity
                  onPress={onClearEndDate}
                  className="pr-4 py-3"
                  accessibilityRole="button"
                  accessibilityLabel="Clear end date"
                >
                  <Icon name="close" size={22} color="#98A2B3" />
                </TouchableOpacity>
              )}
            </View>
            <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl">
              <TouchableOpacity
                onPress={onPressEndTime}
                className={`flex-1 flex-row items-center p-5 gap-2 ${!onPressEndTime ? "opacity-30" : ""}`}
                accessibilityRole="button"
                accessibilityLabel="Select end time"
                disabled={!onPressEndTime}
              >
                <Icon name="access-time" size={24} color="#98A2B3" />
                <Text className={`text-lg ${endTime ? "text-gray-800" : "text-[#98A2B3]"}`}>
                  {endTime ? String(endTime) : "Time"}
                </Text>
              </TouchableOpacity>
              {endTime !== "" && onClearEndTime && (
                <TouchableOpacity
                  onPress={onClearEndTime}
                  className="pr-4 py-3"
                  accessibilityRole="button"
                  accessibilityLabel="Clear end time"
                >
                  <Icon name="close" size={22} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
