import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import MapboxAddressMap from "../../../../components/MapboxAddressMap";

interface ActivityDetailCardAddressProps {
  address?: string | null;
  coordinates?: any;
  title?: string;
  height?: number;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const ActivityDetailCardAddress: React.FC<ActivityDetailCardAddressProps> = ({
  address,
  coordinates,
  title,
  height = 180,
  onFullScreenChange,
}) => {
  if (!address) return null;

  return (
    <View>
      <TouchableOpacity
        onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(address)}`)}
        className="flex-row items-center gap-1 mt-1 mb-2 pr-xl"
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Icon name="location-on" size={18} color="#FFFFFF" />
        <Text className="text-base text-white underline flex-1" numberOfLines={1}>
          {address}
        </Text>
      </TouchableOpacity>
      <MapboxAddressMap
        address={address}
        coordinates={coordinates}
        title={title}
        height={height}
        onFullScreenChange={onFullScreenChange}
      />
    </View>
  );
};

export default ActivityDetailCardAddress;
