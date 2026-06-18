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
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${walkColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="directions-walk" size={20} color={walkColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            WALKING ROUTE
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-b-2 border-gray-500 rounded-b-3xl bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest">
            Route Name
          </Text>++--
          <Text className="text-4xl font-semibold tracking-tight mb-1" style={{ color: walkColor }}>
            {data.routeName || "N/A"}
          </Text>
        </View>

        {/* Row of details: Distance & Duration */}
        <View className="flex-1 pt-4 gap-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Est. Distance
            </Text>
            <Text className="text-lg font-extrabold text-gray-400">
              {data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : "N/A"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Est. Duration
            </Text>
            <Text className="text-lg font-extrabold text-gray-400">
              {data.estimatedDuration || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

