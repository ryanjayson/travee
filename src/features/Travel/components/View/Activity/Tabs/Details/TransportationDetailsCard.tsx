import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { TransportationDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface TransportationDetailsCardProps {
  data: TransportationDetailsDto;
}

const transColor = activityIcons.find((icon) => icon.name === ActivityType.transportation)?.color || "#00BCD4";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const TransportationDetailsCard: React.FC<TransportationDetailsCardProps> = ({ data }) => {
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
        style={{ backgroundColor: `${transColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="directions-bus" size={20} color={transColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            TRANSPORTATION / TRANSIT
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-gray-500 bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Operator / Provider
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: transColor }}>
            {data.operatorProvider || "N/A"}
          </Text>
        </View>

        {/* Mode & Price Row */}
        <View className="flex-row items-center justify-between pt-3 border-t border-dashed border-gray-200 mb-4">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Transit Mode
            </Text>
            <Text className="text-base font-extrabold text-gray-800 capitalize">
              {data.mode || "N/A"}
            </Text>
          </View>
          {data.price ? (
            <View className="flex-1 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Price
              </Text>
              <Text className="text-base font-extrabold text-emerald-600">
                ₱{Number(data.price).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pickup Location */}
        {data.pickupLocation ? (
          <View className="mb-3 pt-3 border-t border-gray-100">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Pickup Point
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.pickupLocation || "")}`)}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="pin-drop" size={16} color={transColor} />
              <Text className="text-base text-gray-700 underline flex-1" numberOfLines={2}>
                {data.pickupLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Dropoff Location */}
        {data.dropoffLocation ? (
          <View className="mb-1 pt-3 border-t border-gray-100">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Dropoff Point
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.dropoffLocation || "")}`)}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="place" size={16} color={transColor} />
              <Text className="text-base text-gray-700 underline flex-1" numberOfLines={2}>
                {data.dropoffLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3 border-2 border-t-0 -mt-0.5 border-gray-500 rounded-b-3xl bg-white">
        <View className="flex-row justify-between mb-1 gap-4">
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
        </View>
      </View>
    </View>
  );
};
