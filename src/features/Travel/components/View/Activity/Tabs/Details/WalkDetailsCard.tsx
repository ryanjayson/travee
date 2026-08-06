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

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

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
