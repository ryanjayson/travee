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
      return { label: "Draft", bg: "bg-[#E0E0E0]", text: "text-[#666]", border: "border-[#666]/50" };
    case TravelStatus.Upcoming:
      return { label: "Upcoming", bg: "bg-[#B9E6FE]/40", text: "text-[#263F69]", border: "border-[#263F69]/40" };
    case TravelStatus.Ongoing:
      return { label: "Ongoing", bg: "bg-success-100", text: "text-success-600", border: "border-success-200" };
    case TravelStatus.Past:
      return { label: "Past", bg: "bg-[#fab00f]/90", text: "text-[#FFFFFF]", border: "border-[#f0a505]/50" };
    case TravelStatus.Archieved:
      return { label: "Archived", bg: "bg-[#FFEBEE]", text: "text-[#D32F2F]", border: "border-[#D32F2F]/30" };
    case TravelStatus.Cancelled:
      return { label: "Cancelled", bg: "bg-[#FFEBEE]", text: "text-[#D32F2F]", border: "border-[#D32F2F]/30" };
    default:
      return { label: "Unknown", bg: "bg-[#E0E0E0]", text: "text-[#666]", border: "border-[#666]" };
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
  const { label, bg, text, border } = getStatusConfig(status);
  
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
    <View className={`px-1 rounded-xxs ${bg} ${containerClassName} flex-row items-center justify-center gap-1.5 border ${border} `}>
      {status === TravelStatus.Ongoing && (
        <Animated.View 
          style={{ opacity: pulseAnim }}
          className="w-2 h-2 rounded-full bg-success-500"
        />
      )}
      <Text className={`text-[8px] font-semibold uppercase tracking-wider ${text} ${textClassName}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
