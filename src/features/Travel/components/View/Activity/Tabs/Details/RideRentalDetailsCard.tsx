import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { RideRentalDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import { safeFormatTime, safeFormatDate } from "../../../../../../../utils/dateTimeUtils";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto;
}

const rentalColor = activityIcons.find((icon) => icon.name === ActivityType.rideRental)?.color || "#3F51B5";


const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

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
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Rental Provider
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.providerName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.providerName}
          />
        </View>

        {/* Start & End Dates Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-indigo-900 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Rental Start
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {safeFormatTime(data.rentalStartDateTime)}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5">
              {safeFormatDate(data.rentalStartDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Rental End
            </Text>
            <Text className="text-xl font-semibold text-white/80 text-right">
              {data.rentalEndDateTime ? safeFormatTime(data.rentalEndDateTime) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5 text-right">
              {data.rentalEndDateTime ? safeFormatDate(data.rentalEndDateTime) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Pickup & Dropoff Location */}
        {data.pickupLocation ? (
          <View className="mb-3 pt-3 border-t border-gray-100/10">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Pickup Location
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.pickupLocation || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="pin-drop" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.pickupLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {data.dropoffLocation ? (
          <View className="mb-1 pt-3 border-t border-gray-100/10">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Dropoff Location
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.dropoffLocation || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="place" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.dropoffLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Stub Area */}
      <View className="px-md">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#303F9F]">
          <Field
            label="Vehicle Model"
            value={data.vehicleModel}
            icon="directions-car"
          />
          <Field
            label="Vehicle Type"
            value={data.vehicleType}
            icon="commute"
          />
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            isCopy
          />
          <Field
            label="Booking Status"
            value={data.bookingStatus}
            icon="info-outline"
          />
          <Field
            label="Price"
            value={data.price ? `₱${Number(data.price).toLocaleString()}` : null}
            icon="attach-money"
          />
          <Field
            label="Website / Link"
            value={data.websiteAddress}
            icon="language"
            isLink
          />
        </View>
      </View>

      <View className="px-md mt-sm">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#303F9F]">
          <Field
            label="Contact Person"
            value={data.contactName}
            icon="person"
            showBorder={false}
          />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            showBorder={false}
            isCall
          />
          <Field
            label="Email Address"
            value={data.emailAddress}
            icon="email"
            isEmail
          />
        </View>
      </View>
    </View>
  );
};
