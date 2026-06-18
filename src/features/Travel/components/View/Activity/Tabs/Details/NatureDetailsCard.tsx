import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { NatureDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface NatureDetailsCardProps {
  data: NatureDetailsDto;
}

const natureColor = activityIcons.find((icon) => icon.name === ActivityType.nature)?.color || "#429862";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const NatureDetailsCard: React.FC<NatureDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
              Spot Name
            </Text>
          </View>
          
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.spotName || "N/A"}
          </Text>
          {data.address ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.address}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Row of details: Spot Type & Entry Fee */}
        <View className="flex-row items-center justify-between pt-4 ">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Spot Type
            </Text>
            <Text className="text-xl font-semibold text-white/80 capitalize">
              {data.subType || "N/A"}
            </Text>
          </View>
          {data.entryFee ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Entry Fee
              </Text>
              <Text className="text-xl font-semibold text-white/80 text-right">
                {data.entryFee}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};
