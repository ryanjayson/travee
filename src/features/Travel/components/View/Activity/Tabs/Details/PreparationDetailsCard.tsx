import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { PreparationDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface PreparationDetailsCardProps {
  data: PreparationDetailsDto;
}

const prepColor = activityIcons.find((icon) => icon.name === ActivityType.preparation)?.color || "#607D8B";

const formatDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "N/A";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "N/A";
    return (
      d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true })
    );
  } catch (e) {
    return "N/A";
  }
};

export const PreparationDetailsCard: React.FC<PreparationDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  const getPriorityColor = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#FF5252";
      case "medium":
        return "#FFB74D";
      case "low":
        return "#81C784";
      default:
        return "#B0BEC5";
    }
  };

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="px-2">
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
              Task / Preparation
            </Text>
            {data.priority ? (
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: getPriorityColor(data.priority) + "40" }}
              >
                <Text
                  className="text-xs font-bold capitalize"
                  style={{ color: "#FFFFFF" }}
                >
                  {data.priority} Priority
                </Text>
              </View>
            ) : null}
          </View>
          
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.taskLabel || "N/A"}
          </Text>
        </View>

        {/* Deadline Row */}
        <View className="flex-row items-center justify-between pt-4 border-t-2 border-dashed border-[#4b6a7a]">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Deadline / Due
            </Text>
            <Text className="text-2xl font-semibold text-white/80">
              {formatDate(data.deadlineDateTime)}
            </Text>
          </View>
        </View>

        {/* Notes block */}
        {data.notes ? (
          <View className="mt-3 pt-3">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Notes / Instructions
            </Text>
            <Text className="text-lg text-white/60 leading-relaxed">
              {data.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
