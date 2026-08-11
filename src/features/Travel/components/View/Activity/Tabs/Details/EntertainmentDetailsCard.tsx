import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { EntertainmentDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";

interface EntertainmentDetailsCardProps {
  data: EntertainmentDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const entColor = activityIcons.find((icon) => icon.name === ActivityType.entertainmentAndRecreation)?.color || "#7B1FA2";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const EntertainmentDetailsCard: React.FC<EntertainmentDetailsCardProps> = ({ data, onFullScreenChange }) => {
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
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Venue Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.venueName || "N/A"}
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
              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.venueName} height={180} onFullScreenChange={onFullScreenChange} />
            </>
          ) : null}
        </View>

        {/* Row of details: SubType & Ticket Price */}
        <View className="flex-row items-center justify-between pt-4 border-t-2 border-dashed border-[#066e88]">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Type
            </Text>
            <Text className="text-xl font-semibold text-white/80 capitalize">
              {data.subType || "N/A"}
            </Text>
          </View>
          {data.ticketPrice ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Ticket Price
              </Text>
              <Text className="text-xl font-semibold text-white/80">
                {data.ticketPrice}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
          <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#077f9d]">
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            onPress={data.bookingReference ? () => handleCopy(data.bookingReference || "", "Booking reference") : undefined}
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
