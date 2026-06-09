import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface DateTimeProps {
  startDate: string | null;
  startTime: string;
  onPressDate: () => void;
  onPressTime: () => void;
  onClearDate: () => void;
  onClearTime: () => void;
}

export default function DateTime({
  startDate,
  startTime,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
}: DateTimeProps) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-semibold tracking-wider uppercase">Date & Time</Text>
      <View className="flex-row items-center gap-4 mt-2">
        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-[64px]">
          <TouchableOpacity 
            onPress={onPressDate}
            className="flex-1 flex-row items-center p-5 gap-2"
            accessibilityRole="button"
            accessibilityLabel="Select date"
          >
            <Icon name="calendar-today" size={24} color="#98A2B3" />
            <Text className={`text-lg  ${startDate ? "text-gray-800" : "text-[#98A2B3]"}`}>
              {startDate ? String(startDate) : "Date"}
            </Text>
          </TouchableOpacity>
          {startDate && (
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
        <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center h-[64px]">
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
          {startTime !== "" && (
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
