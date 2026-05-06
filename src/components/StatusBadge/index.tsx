import React from "react";
import { View, Text } from "react-native";
import { TravelStatus } from "../../types/enums";

/**
 * Reusable configuration for travel status badges.
 * Returns the label and Tailwind color classes.
 */
export const getStatusConfig = (status: TravelStatus) => {
  switch (status) {
    case TravelStatus.Draft:
      return { label: "Draft", bg: "bg-[#E0E0E0]", text: "text-[#666]" };
    case TravelStatus.Upcoming:
      return { label: "Upcoming", bg: "bg-[#B9E6FE]", text: "text-[#0C4C8A]" };
    case TravelStatus.Ongoing:
      return { label: "Ongoing", bg: "bg-[#B9E6FE]", text: "text-[#0C4C8A]" };
    case TravelStatus.Completed:
      return { label: "Completed", bg: "bg-[#E8F5E8]", text: "text-[#2E7D32]" };
    case TravelStatus.Archieved:
      return { label: "Archived", bg: "bg-[#FFEBEE]", text: "text-[#D32F2F]" };
    case TravelStatus.Cancelled:
      return { label: "Cancelled", bg: "bg-[#FFEBEE]", text: "text-[#D32F2F]" };
    default:
      return { label: "Unknown", bg: "bg-[#E0E0E0]", text: "text-[#666]" };
  }
};

type StatusTagProps = {
  status: TravelStatus;
  containerClassName?: string;
  textClassName?: string;
  type?: number; // Maintained for backward compatibility
};

/**
 * Reusable Status Badge component.
 * Displays a styled tag based on the provided TravelStatus.
 */
const StatusBadge = ({ status, containerClassName = "", textClassName = "" }: StatusTagProps) => {
  const { label, bg, text } = getStatusConfig(status);

  return (
    <View className={`px-3 py-2 rounded-full ${bg} ${containerClassName}`}>
      <Text className={`text-xs font-bold ${text} ${textClassName}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
