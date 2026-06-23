import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { WalkDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface WalkDetailsCardProps {
  data: WalkDetailsDto;
}

const walkColor = activityIcons.find((icon) => icon.name === ActivityType.walk)?.color || "#8BC34A";

const Field = ({
  label,
  value,
  icon,
  onPress,
  isLink,
}: {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  return (
    <View className="flex-row items-start mb-3 gap-6">
      {icon ? (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon as any} size={24} color={"#fffefe"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-lg font-medium"
              style={{
                color: "#ffffff",
                textDecorationLine: isLink ? "underline" : "none",
                opacity: 0.6,
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={16} color={"#b36b00"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white opacity-60">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const WalkDetailsCard: React.FC<WalkDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="pb-4 border-b-2 border-dashed border-[#7eb83d]">
          <Text className="text-xs font-semibold text-white uppercase tracking-widest">
            Route Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.routeName || "N/A"}
          </Text>
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#7eb83d]">
          <Field
            label="Est. Distance"
            value={data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : "N/A"}
            icon="directions"
            isLink
          />
            <Field
            label="Est. Duration"
            value={data.estimatedDuration || "N/A"}
            icon="access-time"
          />
        </View>
      </View>
    </View>
  );
};
