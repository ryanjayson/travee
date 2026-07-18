import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { useTravelPlan } from "../../../../../hooks/useTravel";

interface DateTimeProps {
  startDate: string | null;
  startTime: string;
  onPressDate: () => void;
  onPressTime: () => void;
  onClearDate: () => void;
  onClearTime: () => void;
  allowedClear?: boolean;
}

export default function DateTime({
  startDate,
  startTime,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
  allowedClear = true,
}: DateTimeProps) {
  const formik = useFormikContext<any>();
  const travelId = formik?.values?.travelId || "";
  const { data: travelPlan } = useTravelPlan(travelId);
  const currentSectionId = formik?.values?.sectionId || "";
  const selectedSection = travelPlan?.itinerarySection?.find((s: any) => s.id === currentSectionId);
  const isSectionDateSet = !!selectedSection?.startDate;
  
  const finalAllowedClear = allowedClear && !isSectionDateSet;

  return (
    <View className="mb-5">
      <Text className="text-base font-semibold tracking-wider uppercase">Date & Time</Text>
      <Text className={`text-base text-gray-500`}>
       Activities with a set date and time are sorted based on their scheduled date and time and cannot be reordered.
      </Text>
      <View className="flex-row items-center gap-4 mt-2">
        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-7xl">
          <TouchableOpacity 
            onPress={onPressDate}
            className={`flex-1 flex-row items-center p-5 gap-2 ${!finalAllowedClear ? "opacity-30" : ""}`}
            accessibilityRole="button"
            accessibilityLabel="Select date"
            disabled={startDate ? true : false}  
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
            className="flex-1 flex-row items-center p-5 gap-2"
            accessibilityRole="button"
            accessibilityLabel="Select time"
          >
            <Icon name="access-time" size={24} color="#98A2B3" />
            <Text className={`text-lg ${startDate ? "text-gray-800" : "text-[#98A2B3]"}`}>
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
    </View>
  );
}
