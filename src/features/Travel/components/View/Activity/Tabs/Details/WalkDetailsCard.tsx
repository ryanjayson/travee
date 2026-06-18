import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { WalkDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface WalkDetailsCardProps {
  data: WalkDetailsDto;
}

const walkColor = activityIcons.find((icon) => icon.name === ActivityType.walk)?.color || "#8BC34A";

export const WalkDetailsCard: React.FC<WalkDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-semibold text-white uppercase tracking-widest">
            Route Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.routeName || "N/A"}
          </Text>
        </View>

        {/* Row of details: Distance & Duration */}
        <View className="flex-1 pt-4 gap-4 border-t border-dashed border-green-800">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Est. Distance
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : "N/A"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Est. Duration
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {data.estimatedDuration || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
