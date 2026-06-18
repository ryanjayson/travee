import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { RideRentalDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto;
}

const rentalColor = activityIcons.find((icon) => icon.name === ActivityType.rideRental)?.color || "#3F51B5";

const safeFormatTime = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "--:--";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "--:--";
  }
};

const safeFormatDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "N/A";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "N/A";
  }
};

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const RideRentalDetailsCard: React.FC<RideRentalDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied to clipboard`);
    }
  };

  return (
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${rentalColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="car-rental" size={20} color={rentalColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            RIDE RENTAL
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-gray-500 bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Rental Provider
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: rentalColor }}>
            {data.providerName || "N/A"}
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

        {/* Start & End Dates Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200 mb-4">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Rental Start
            </Text>
            <Text className="text-base font-extrabold text-gray-800">
              {safeFormatTime(data.rentalStartDateTime)}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5">
              {safeFormatDate(data.rentalStartDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={rentalColor} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Rental End
            </Text>
            <Text className="text-base font-extrabold text-gray-800 text-right">
              {data.rentalEndDateTime ? safeFormatTime(data.rentalEndDateTime) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5 text-right">
              {data.rentalEndDateTime ? safeFormatDate(data.rentalEndDateTime) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Pickup & Dropoff Location */}
        {data.pickupLocation ? (
          <View className="mb-3 pt-3 border-t border-gray-100">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Pickup Location
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.pickupLocation || "")}`)}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="pin-drop" size={16} color={rentalColor} />
              <Text className="text-base text-gray-700 underline flex-1" numberOfLines={2}>
                {data.pickupLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {data.dropoffLocation ? (
          <View className="mb-1 pt-3 border-t border-gray-100">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Dropoff Location
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.dropoffLocation || "")}`)}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="place" size={16} color={rentalColor} />
              <Text className="text-base text-gray-700 underline flex-1" numberOfLines={2}>
                {data.dropoffLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3 border-2 border-t-0 -mt-0.5 border-gray-500 rounded-b-3xl bg-white">
        <View className="flex-row justify-between mb-4 gap-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Booking Ref
            </Text>
            {data.bookingReference ? (
              <TouchableOpacity
                onPress={() => handleCopy(data.bookingReference || "", "Booking reference")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-gray-800">
                  {data.bookingReference}
                </Text>
                <Icon name="content-copy" size={18} color="#667085" />
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-bold text-gray-800">N/A</Text>
            )}
          </View>
          {data.vehicleType ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Vehicle Type
              </Text>
              <Text className="text-base font-bold text-gray-800 capitalize">
                {data.vehicleType}
              </Text>
            </View>
          ) : null}
        </View>

        {data.price ? (
          <View className="pt-3 border-t border-gray-100 flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Rental Cost
            </Text>
            <Text className="text-base font-extrabold text-emerald-600">
              ₱{Number(data.price).toLocaleString()}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
