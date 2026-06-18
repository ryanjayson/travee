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
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${motoColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="motorcycle" size={20} color={motoColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            MOTORCYCLE RIDE
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-b-2 border-gray-500 rounded-b-3xl bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Route Name
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: motoColor }}>
            {data.routeName || "N/A"}
          </Text>
        </View>

        {/* Start & End Points Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Starting Point
            </Text>
            {data.startingPoint ? (
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.startingPoint || "")}`)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-base font-extrabold text-gray-850 underline" numberOfLines={2}>
                  {data.startingPoint}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-extrabold text-gray-800">N/A</Text>
            )}
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={motoColor} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Ending Point
            </Text>
            {data.endingPoint ? (
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.endingPoint || "")}`)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-base font-extrabold text-gray-850 text-right underline" numberOfLines={2}>
                  {data.endingPoint}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-extrabold text-gray-800 text-right">N/A</Text>
            )}
          </View>
        </View>

        {/* Ride Specifics Grid */}
        <View className="flex-row flex-wrap mt-4 pt-4 border-t border-gray-100">
          {data.bikeModel ? (
            <View className="w-1/2 mb-3">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Bike Model
              </Text>
              <Text className="text-sm font-extrabold text-gray-800">
                {data.bikeModel}
              </Text>
            </View>
          ) : null}

          {data.roadType ? (
            <View className="w-1/2 mb-3 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Road Type
              </Text>
              <Text className="text-sm font-extrabold text-gray-800 capitalize">
                {data.roadType}
              </Text>
            </View>
          ) : null}

          {data.estimatedDistanceKm ? (
            <View className="w-1/2">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Est. Distance
              </Text>
              <Text className="text-sm font-extrabold text-gray-800">
                {data.estimatedDistanceKm} Km
              </Text>
            </View>
          ) : null}

          {data.fuelStops ? (
            <View className="w-1/2 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Fuel Stops
              </Text>
              <Text className="text-sm font-extrabold text-gray-800">
                {data.fuelStops}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};
