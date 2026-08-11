import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";

interface AccomodationDetailsCardProps {
  data: AccomodationDetailsDto;
}

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

const handleCall = (phone: string) => {
  if (phone) {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Failed to make call", err));
  }
};

const handleEmail = (email: string) => {
  if (email) {
    Linking.openURL(`mailto:${email}`).catch((err) => console.error("Failed to send email", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const AccomodationDetailsCard: React.FC<AccomodationDetailsCardProps> = ({ data }) => {
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
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest mb-2">
            Accommodation / Place to stay
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.accomodationName || "N/A"}
          </Text>
          {data.address ? (
            <>
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
                className="flex-row items-center gap-6 mt-1 mb-2"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="location-on" size={24} color="#FFFFFF" />
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.address}
                </Text>
              </TouchableOpacity>
              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.accomodationName} height={180} />
            </>
          ) : null}
        </View>

        {/* Check-in & Check-out Row */}
        <View className="flex-row items-center justify-between pt-4 border-t-2 border-dashed border-[#9c46ec]">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Check-in
            </Text>
            <Text className="text-2xl font-semibold text-white/80">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-base font-medium text-white/80 mt-0.5">
              {safeFormatDate(data.checkinDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Check-out
            </Text>
            <Text className="text-2xl font-semibold text-white/80 text-right">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-white/80 mt-0.5 text-right">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stay Voucher Stub */}
      <View className="p-2 pt-3">
        {/* Row 1: Booking Reference & Website address */}
        <View className="flex-row justify-between mb-4 gap-4">
          {data.bookingReference && (

            <View className="flex-1">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Booking Ref
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy(data.bookingReference || "", "Booking reference")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-white/80">
                  {data.bookingReference}
                </Text>
                <Icon name="content-copy" size={18} color="#FFFFFF" style={{ opacity: 0.6 }} />
              </TouchableOpacity>
            </View>
          )}

          {data.websiteAddress ? (
            <View className="flex-1">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Website
              </Text>
              <TouchableOpacity
                onPress={() => handleOpenLink(data.websiteAddress || "")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="link" size={18} color="#FFFFFF" style={{ opacity: 0.6 }} />
                <Text className="text-base font-bold text-white/80 underline" numberOfLines={1}>
                  {data.websiteAddress}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

      </View>

      <View className="px-md ">
        <View className="rounded-2xl  flex-col gap-3 p-5 pb-1 bg-[#9c46ec]">
          <Field label="Contact Person" value={data.contactName} icon="person" showBorder={true} borderColor="border-[#9234ea]" />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined}
            showBorder={true}
            borderColor="border-[#9234ea]"
          />
          <Field
            label="Email Address"
            value={data.emailAddress}
            icon="email"
            onPress={data.emailAddress ? () => handleEmail(data.emailAddress!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
