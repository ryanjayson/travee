import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { ShoppingDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";

interface ShoppingDetailsCardProps {
  data: ShoppingDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const shopColor = activityIcons.find((icon) => icon.name === ActivityType.shopppingAndService)?.color || "#E91E63";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const ShoppingDetailsCard: React.FC<ShoppingDetailsCardProps> = ({ data, onFullScreenChange }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="mb-4 border-b-2 border-dashed border-[#c02168] pb-4">
          <Text className="text-xs font-medium text-white/80 uppercase tracking-widest mb-2">
            Store / Venue Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-2 text-white">
            {data.venueName || "N/A"}
          </Text>
          {data.address ? (
            <>
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
                className="flex-row items-center mt-1 mb-2 pr-xl"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="location-on" size={24} color="#FFFFFF" className="mx-5"/>
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.address}
                </Text>
                <Icon name="open-in-new" size={16} color={"#FFFFFF"} />
              </TouchableOpacity>
              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.venueName} height={180} onFullScreenChange={onFullScreenChange} />
            </>
          ) : null}
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md">
        <View className="rounded-2xl  flex-col gap-3 p-5 pb-1 bg-[#d12372]">
          <Field
            label="Store Type"
            value={data.subType || "N/A"}
            icon="store"
            showBorder
            borderColor="border-[#c02168]"
          />
          <Field
            label="Website"
            value={data.websiteAddress || "N/A"}
            icon="language"
            isLink
            onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
