import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export interface ActivityCardDisplayFieldProps {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
  showBorder?: boolean;
  borderColor?: string;
  iconLinkColor?: string;
  numberOfLines?: number;
}

export const ActivityCardDisplayField: React.FC<ActivityCardDisplayFieldProps> = ({
  label,
  value,
  icon,
  onPress,
  isLink,
  showBorder,
  borderColor,
  iconLinkColor = "#FFFFFF",
  numberOfLines,
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  const borderClass = showBorder
    ? borderColor
      ? `border-b ${borderColor}`
      : "border-b border-white/20"
    : "";

  return (
    <View className="flex-row items-start mb-3 gap-6">
      {icon ? (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon as any} size={24} color="#fffefe" />
        </View>
      ) : null}
      <View className={`flex-1 ${borderClass} ${showBorder ? "pb-3" : ""}`}>
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
          {label}
        </Text>
        {onPress ? (
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            className="flex-row items-center gap-1  pr-xl"
          >
            <Text
              className="text-lg font-medium"
              numberOfLines={isLink ? 1 : numberOfLines}
              style={{
                color: "#ffffff",
                textDecorationLine: isLink ? "underline" : "none",
                opacity: 0.6,
              }}
            >
              {value}
            </Text>
            {isLink && (
              <Icon
                name="open-in-new"
                size={16}
                color={iconLinkColor}
                style={{ opacity: 0.6 }}
              />
            )}
          </TouchableOpacity>
        ) : (
          <Text
            className="text-lg font-semibold text-white opacity-60"
            numberOfLines={numberOfLines}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
};
