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

const natureColor = activityIcons.find((icon) => icon.name === ActivityType.nature)?.color || "#4CAF50";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const NatureDetailsCard: React.FC<NatureDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${natureColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="terrain" size={20} color={natureColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            NATURE SPOT / OUTDOOR
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-b-2 border-gray-500 rounded-b-3xl bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Spot Name
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: natureColor }}>
            {data.spotName || "N/A"}
          </Text>
          {data.address ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center gap-1 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={14} color="#667085" />
              <Text className="text-base text-gray-500 underline flex-1" numberOfLines={2}>
                {data.address}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Row of details: Spot Type & Entry Fee */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Spot Type
            </Text>
            <Text className="text-base font-extrabold text-gray-800 capitalize">
              {data.subType || "N/A"}
            </Text>
          </View>
          {data.entryFee ? (
            <View className="flex-1 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Entry Fee
              </Text>
              <Text className="text-base font-extrabold text-gray-800">
                {data.entryFee}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};
