import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { SightseeingDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";

interface SightseeingDetailsCardProps {
  data: SightseeingDetailsDto;
}

const sightColor = activityIcons.find((icon) => icon.name === ActivityType.sightseeing)?.color || "#FF9800";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const SightseeingDetailsCard: React.FC<SightseeingDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="pb-4 border-b-2 border-dashed border-[#c88a04]">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Attraction Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.attractionName || "N/A"}
          </Text>
          {data.address ? (
            <>
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
                className="flex-row items-center gap-6 mt-1 mb-2 pr-xl"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="location-on" size={24} color="#FFFFFF" />
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.address}
                </Text>
              </TouchableOpacity>
              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.attractionName} height={180} />
            </>
          ) : null}
        </View>

      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dc9804]">
          <Field
            label="Entry Fee"
            value={data.entryFee}
            icon="money"
            isLink
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
            onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
