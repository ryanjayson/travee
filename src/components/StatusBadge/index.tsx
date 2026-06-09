import React, { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";
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
      return { label: "Upcoming", bg: "bg-[#B9E6FE]", text: "text-[#263F69]" };
    case TravelStatus.Ongoing:
      return { label: "Ongoing", bg: "bg-success-100", text: "text-success-600" };
    case TravelStatus.Past:
      return { label: "Past", bg: "bg-[#E8F5E8]", text: "text-[#2E7D32]" };
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
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === TravelStatus.Ongoing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status]);

  return (
    <View className={`px-3 py-2 rounded-full ${bg} ${containerClassName} flex-row items-center gap-1.5`}>
      {status === TravelStatus.Ongoing && (
        <Animated.View 
          style={{ opacity: pulseAnim }}
          className="w-2 h-2 rounded-full bg-success-500"
        />
      )}
      <Text className={`text-xs font-bold ${text} ${textClassName}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
