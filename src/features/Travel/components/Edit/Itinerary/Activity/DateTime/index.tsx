import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, LayoutAnimation } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { useTravelPlan } from "../../../../../hooks/useTravel";
import { TripPlanType } from "../../../../../../../types/enums";
import { FadeInView } from "../../../../../../../components/animations";

interface DateTimeProps {
  activityType?: TripPlanType | number | string;
  type?: TripPlanType | number | string;
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
  const selectedSection = travelPlan?.itinerarySection?.find(
    (s: any) => s.id === currentSectionId
  );
  const isSectionDateSet = !!selectedSection?.startDate;

  const finalAllowedClear = allowedClear && !isSectionDateSet;

  const isInherentlyRanged =
    effectiveActivityType === TripPlanType.stay ||
    effectiveActivityType === TripPlanType.transit ||
    effectiveActivityType === TripPlanType.rideRental;

  const [showEndDateTime, setShowEndDateTime] = useState<boolean>(
    Boolean(endDate || isInherentlyRanged)
  );

  useEffect(() => {
    if (endDate) {
      setShowEndDateTime(true);
    }
  }, [endDate]);

  const defaultTitle = effectiveActivityType === TripPlanType.stay
    ? "Check-In Date & Time"
    : effectiveActivityType === TripPlanType.transit
      ? "Departure & Arrival Date & Time"
      : effectiveActivityType === TripPlanType.rideRental
        ? "Rental Period"
        : "Date & Time";

  const defaultDescription =
    effectiveActivityType === TripPlanType.stay ||
      effectiveActivityType === TripPlanType.transit ||
      effectiveActivityType === TripPlanType.rideRental
      ? null
      : "Plans with date & time are sorted based on their scheduled and cannot be reordered.";

  const startDateLabel = effectiveActivityType === TripPlanType.stay
    ? "Check-In"
    : effectiveActivityType === TripPlanType.transit
      ? "Departure"
      : effectiveActivityType === TripPlanType.rideRental
        ? "Pick-Up"
        : "Start";

  const endDateLabel = effectiveActivityType === TripPlanType.stay
    ? "Check-Out"
    : effectiveActivityType === TripPlanType.transit
      ? "Arrival"
      : effectiveActivityType === TripPlanType.rideRental
        ? "Drop-Off"
        : "End Date";

  const inputContainerClass =
    "border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl";

  return (
    <View className="mb-5" style={{ flexShrink: 0 }}>
      <Text className="text-lg text-secondary/80 font-semibold mb-1 px-xs">
        {title || defaultTitle}
      </Text>

      {description !== undefined ? (
        description ? (
          <Text className="text-base text-tertiary ">
            {description}
          </Text>
        ) : null
      ) : (
        defaultDescription && (
          <Text className="text-base text-tertiary  px-xs">
            {defaultDescription}
          </Text>
        )
      )}

      <View
        className="flex-row items-center gap-4 mt-2"
        style={{ minHeight: 64, flexShrink: 0 }}
      >
        <View className={inputContainerClass} style={{ minHeight: 64, flexShrink: 0 }}>
          <TouchableOpacity
            onPress={onPressDate}
            className={`flex-1 flex-row items-center p-3 gap-2 ${!finalAllowedClear ? "opacity-30" : ""
              }`}
            accessibilityRole="button"
            accessibilityLabel="Select date"
            disabled={!finalAllowedClear}
          >
            <Icon
              name={showEndDateTime ? "date-range" : "calendar-today"}
              size={24}
              color="#98A2B3"
            />
            <Text
              className={`text-xl  ${startDate ? "text-gray-800 top-2 " : "text-[#98A2B3]"
                }`}
            >
              {startDate
                ? String(startDate)
                : showEndDateTime
                  ? startDateLabel
                  : defaultTitle.split(" ")[0]}
            </Text>
          </TouchableOpacity>

          {/* Start Date & Time Label (when date range is present or revealed) */}

          {startDate ? (
            <Text className="absolute font-normal left-12 text-sm top-4 text-[#98A2B3]">
              {showEndDateTime ? startDateLabel : defaultTitle.split(" ")[0]}
            </Text>
          ) : null}

          {startDate && finalAllowedClear && (
            <TouchableOpacity
              onPress={onClearDate}
              className="pr-2 py-3"
              accessibilityRole="button"
              accessibilityLabel="Clear date"
            >
              <Icon name="close" size={22} color="#98A2B3" />
            </TouchableOpacity>
          )}
        </View>
        <View className={inputContainerClass} style={{ minHeight: 64, flexShrink: 0 }}>
          <TouchableOpacity
            onPress={onPressTime}
            className={`flex-1 flex-row items-center p-3 gap-2 ${!finalAllowedClear ? "opacity-30" : ""
              }`}
            accessibilityRole="button"
            accessibilityLabel="Select time"
            disabled={!finalAllowedClear}
          >
            <Icon name="access-time" size={24} color="#98A2B3" />
            <Text className={`text-xl ${startTime ? "text-gray-800 top-2" : "text-[#98A2B3]"}`}>
              {startTime ? String(startTime) : "Time"}
            </Text>
          </TouchableOpacity>

          {/* Start Date & Time Label (when date range is present or revealed) */}
          {startTime ? (
            <Text className="absolute font-normal left-12 text-sm top-4 text-[#98A2B3]">
              Time
            </Text>
          ) : null}

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

      {/* Additional Row for End Date & Time or Tertiary Button */}
      {showEndDateTime ? (
        <FadeInView>
          <View className={`${isInherentlyRanged ? "mt-4" : "mt-3"}`}>
            <View className="flex-row items-center justify-end mb-1 px-xs">
              {!isInherentlyRanged && (
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    onClearEndDate?.();
                    onClearEndTime?.();
                    setShowEndDateTime(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Remove end date and time"
                  className="py-0.5 px-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-semibold text-tertiary underline">
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View
              className="flex-row items-center gap-4"
              style={{ minHeight: 64, flexShrink: 0 }}
            >
              <View className={inputContainerClass} style={{ minHeight: 64, flexShrink: 0 }}>
                <TouchableOpacity
                  onPress={onPressEndDate || onPressDate}
                  className="flex-1 flex-row items-center p-3 gap-2"
                  accessibilityRole="button"
                  accessibilityLabel="Select end date"
                >
                  <Icon
                    name={showEndDateTime ? "date-range" : "calendar-today"}
                    size={24}
                    color="#98A2B3"
                  />
                  <Text
                    className={`text-xl ${endDate ? "text-gray-800 top-2" : "text-[#98A2B3]"
                      }`}
                  >
                    {endDate ? String(endDate) : endDateLabel}
                  </Text>
                </TouchableOpacity>
                {endDate && onClearEndDate && (
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

              {endDate ? (
                <Text className="absolute font-normal left-12 text-sm top-4 text-[#98A2B3]">
                  {endDateLabel}
                </Text>
              ) : null}

              <View className={inputContainerClass} style={{ minHeight: 64, flexShrink: 0 }}>

                {/* Start Date & Time Label (when date range is present or revealed) */}
                {endTime ? (
                  <Text className="absolute font-normal left-12 text-sm top-4 text-[#98A2B3]">
                    Time
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={onPressEndTime}
                  className={`flex-1 flex-row items-center p-3 gap-2 ${!onPressEndTime ? "opacity-30" : ""
                    }`}
                  accessibilityRole="button"
                  accessibilityLabel="Select end time"
                  disabled={!onPressEndTime}
                >
                  <Icon name="access-time" size={24} color="#98A2B3" />
                  <Text
                    className={`text-xl ${endTime ? "text-gray-800 top-2" : "text-[#98A2B3]"
                      }`}
                  >
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
        </FadeInView>
      ) : !isInherentlyRanged ? (
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowEndDateTime(true);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add End date & time"
          className="flex-row items-center self-start mt-3 py-1 gap-1.5"
        >
          <Icon name="add" size={20} color={"#0EA5E9"} />
          <Text
            className="text-sm font-semibold text-primary"
          >
            Add End date & time
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
