import React from "react";
import { View, Text } from "react-native";
import { StatusType, TravelStatus } from "../../types/enums";

type StatusTagProps = {
  type?: StatusType;
  status: TravelStatus;
};

const StatusTag = ({ type, status }: StatusTagProps) => {
  const getStatusConfig = (status: TravelStatus) => {
    switch (status) {
      case TravelStatus.Draft:
        return { label: "Draft", style: "bg-[#E0E0E0] text-[#666]" };
      case TravelStatus.Upcoming:
        return { label: "Upcoming", style: "bg-[#E8F5E8] text-[#2E7D32]" };
      case TravelStatus.Ongoing:
        return { label: "Ongoing", style: "bg-[#E8F5E8] text-[#2E7D32]" };
      case TravelStatus.Completed:
        return { label: "Completed", style: "bg-[#E8F5E8] text-[#2E7D32]" };
      case TravelStatus.Archieved:
        return { label: "Archived", style: "bg-[#FFEBEE] text-[#D32F2F]" };
      case TravelStatus.Cancelled:
        return { label: "Cancelled", style: "bg-[#FFEBEE] text-[#D32F2F]" };
      default:
        return { label: "Unknown", style: "bg-[#E0E0E0] text-[#666]" };
    }
  };

  const { label, style } = getStatusConfig(status);
  const [bgStyle, textStyle] = style.split(" ");

  return (
    <View className={`px-3 py-1 rounded-full ${bgStyle}`}>
      <Text className={`text-[10px] font-bold ${textStyle}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatusTag;
