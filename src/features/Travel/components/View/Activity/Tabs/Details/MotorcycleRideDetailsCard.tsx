import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { MotorcycleRideDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface MotorcycleRideDetailsCardProps {
  data: MotorcycleRideDetailsDto;
}

const motoColor = activityIcons.find((icon) => icon.name === ActivityType.motorcycleRide)?.color || "#F57F17";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const MotorcycleRideDetailsCard: React.FC<MotorcycleRideDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Route Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.routeName || "N/A"}
          </Text>
        </View>

        {/* Start & End Points Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-amber-900">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Starting Point
            </Text>
            {data.startingPoint ? (
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.startingPoint || "")}`)}
                activeOpacity={0.7}
                accessibilityRole="button"
                className="flex-row items-center gap-2"
              >
                <Icon name="location-on" size={18} color="#FFFFFF" />
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.startingPoint}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-extrabold text-white/80">N/A</Text>
            )}
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Ending Point
            </Text>
            {data.endingPoint ? (
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.endingPoint || "")}`)}
                activeOpacity={0.7}
                accessibilityRole="button"
                className="flex-row items-center gap-2"
              >
                <Icon name="place" size={18} color="#FFFFFF" />
                <Text className="text-base text-white text-right underline flex-1" numberOfLines={1}>
                  {data.endingPoint}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-extrabold text-white/80 text-right">N/A</Text>
            )}
          </View>
        </View>

        {/* Ride Specifics Grid */}
        <View className="flex-row flex-wrap mt-4 pt-4 border-t border-gray-100/10">
          {data.bikeModel ? (
            <View className="w-1/2 mb-3">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Bike Model
              </Text>
              <Text className="text-lg font-semibold text-white/80">
                {data.bikeModel}
              </Text>
            </View>
          ) : null}

          {data.roadType ? (
            <View className="w-1/2 mb-3 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Road Type
              </Text>
              <Text className="text-lg font-semibold text-white/80 capitalize">
                {data.roadType}
              </Text>
            </View>
          ) : null}

          {data.estimatedDistanceKm ? (
            <View className="w-1/2">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Est. Distance
              </Text>
              <Text className="text-lg font-semibold text-white/80">
                {data.estimatedDistanceKm} Km
              </Text>
            </View>
          ) : null}

          {data.fuelStops ? (
            <View className="w-1/2 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Fuel Stops
              </Text>
              <Text className="text-lg font-semibold text-white/80">
                {data.fuelStops}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};
