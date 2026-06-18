import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { RestDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface RestDetailsCardProps {
  data: RestDetailsDto;
}

const restColor = activityIcons.find((icon) => icon.name === ActivityType.rest)?.color || "#9E9E9E";

export const RestDetailsCard: React.FC<RestDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${restColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="hotel" size={20} color={restColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            REST & RECOVERY
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-b-2 border-gray-500 rounded-b-3xl bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Rest Location
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: restColor }}>
            {data.restLocationName || "N/A"}
          </Text>
        </View>

        {/* Location Type Row */}
        {data.restLocationType ? (
          <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
            <View className="flex-1">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Location Type
              </Text>
              <Text className="text-base font-extrabold text-gray-800 capitalize">
                {data.restLocationType}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
