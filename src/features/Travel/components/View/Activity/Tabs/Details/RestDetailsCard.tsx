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
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Rest Location
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.restLocationName || "N/A"}
          </Text>
        </View>

        {/* Location Type Row */}
        {data.restLocationType ? (
          <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-600">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Location Type
              </Text>
              <Text className="text-xl font-semibold text-white/80 capitalize">
                {data.restLocationType}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
