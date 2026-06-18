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
        return colors.error || "#D92D20";
      case "medium":
        return "#DC6803";
      case "low":
        return "#079455";
      default:
        return "#475467";
    }
  };

  return (
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${prepColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="assignment-turned-in" size={20} color={prepColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            PREPARATION TASK
          </Text>
        </View>
        {data.priority ? (
          <View
            className="rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: getPriorityColor(data.priority) + "15" }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: getPriorityColor(data.priority) }}
            >
              {data.priority} Priority
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-b-2 border-gray-500 rounded-b-3xl bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Task
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: prepColor }}>
            {data.taskLabel || "N/A"}
          </Text>
        </View>

        {/* Deadline Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Deadline / Due
            </Text>
            <Text className="text-base font-extrabold text-gray-800">
              {formatDate(data.deadlineDateTime)}
            </Text>
          </View>
        </View>

        {/* Notes block */}
        {data.notes ? (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Notes / Instructions
            </Text>
            <Text className="text-base text-gray-600 leading-relaxed">
              {data.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
