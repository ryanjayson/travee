import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import MapboxAddressMap from "../../../../components/MapboxAddressMap";

export interface ActivityDetailCardAddressProps {
  address?: string | null;
  coordinates?: any;
  pickupAddress?: string | null;
  pickupCoordinates?: any;
  dropoffAddress?: string | null;
  dropoffCoordinates?: any;
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
  pickupAddress,
  pickupCoordinates,
  dropoffAddress,
  dropoffCoordinates,
  title,
  height = 180,
  onFullScreenChange,
}) => {
  const hasRoute = Boolean(pickupAddress || dropoffAddress);
  const hasSingle = Boolean(address);

  const isSameAddress = Boolean(
    pickupAddress &&
    dropoffAddress &&
    pickupAddress.trim().toLowerCase() === dropoffAddress.trim().toLowerCase()
  );

  if (!hasRoute && !hasSingle) return null;

  return (
    <View className="mt-1">
      {/* Single Address Link (shown on top when no route) */}
      {!hasRoute && address ? (
        <TouchableOpacity
          onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(address || "")}`)}
          className="flex-row items-center gap-1 mt-1 mb-2 pr-xl"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Open Google Maps for ${address}`}
        >
          <Icon name="location-on" size={18} color="#FFFFFF" />
          <Text className="text-base text-white underline flex-1" numberOfLines={1}>
            {address}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Embedded Map */}
      <MapboxAddressMap
        address={address}
        coordinates={coordinates}
        pickupAddress={pickupAddress}
        pickupCoordinates={pickupCoordinates}
        dropoffAddress={dropoffAddress}
        dropoffCoordinates={dropoffCoordinates}
        title={title}
        height={height}
        onFullScreenChange={onFullScreenChange}
      />

      {/* Route Address Links (shown below the map when hasRoute is true) */}
      {hasRoute ? (
        <View className="mt-2 mb-1">
          {isSameAddress && pickupAddress ? (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Pickup & Dropoff Location
              </Text>
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(pickupAddress)}`)}
                className="flex-row items-center gap-1.5"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open Google Maps for location ${pickupAddress}`}
              >
                <Icon name="location-on" size={18} color="#FFFFFF" />
                <Text className="text-xl font-semibold text-white/80 underline " numberOfLines={1}>
                  {pickupAddress}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pickup Address Link */}
              {pickupAddress ? (
                <View className="mb-6">
                  <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                    Pickup Point
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(pickupAddress)}`)}
                    className="flex-row items-center gap-1.5 pr-2xl"
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Open Google Maps for pickup location ${pickupAddress}`}
                  >
                    <Icon name="pin-drop" size={18} color="#10B981" />
                    <Text className="text-xl font-semibold text-white/80 underline" numberOfLines={1}>
                      {pickupAddress}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Dropoff Address Link */}
              {dropoffAddress ? (
                <View className="mb-6">
                  <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                    Dropoff Point
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(dropoffAddress)}`)}
                    className="flex-row items-center gap-1.5 pr-2xl"
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Open Google Maps for dropoff location ${dropoffAddress}`}
                  >
                    <Icon name="place" size={18} color="#EF4444" />
                    <Text className="text-xl font-semibold text-white/80 underline" numberOfLines={1}>
                      {dropoffAddress}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
};

export default ActivityDetailCardAddress;
