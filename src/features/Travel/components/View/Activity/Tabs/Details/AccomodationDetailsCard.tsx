import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";

interface AccomodationDetailsCardProps {
  data: AccomodationDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
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


import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const AccomodationDetailsCard: React.FC<AccomodationDetailsCardProps> = ({ data, onFullScreenChange }) => {
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

              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.accomodationName} height={180} onFullScreenChange={onFullScreenChange} />
            </>
          ) : null}
        </View>

        {/* Check-in & Check-out Row */}
        <View className="flex-row items-center justify-between py-4 border-t-2 border-dashed border-[#9c46ec]">
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

      <View className="px-md ">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1"
          style={{
            backgroundColor: !data.bookingReference && !data.websiteAddress && !data.contactName && !data.contactNumber && !data.emailAddress
              ? "transparent" : "#9c46ec",
          }}>
          <Field label="Booking Ref" value={data.bookingReference} icon="folder-open" showBorder={false} isCopyable={true} borderColor="border-[#9234ea]" />
          <Field label="Website" value={data.websiteAddress} icon="link" showBorder={false} isLink={true} borderColor="border-[#9234ea]" />
          <Field label="Contact Person" value={data.contactName} icon="person" showBorder={false} borderColor="border-[#9234ea]" />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            showBorder={false}
            borderColor="border-[#9234ea]"
            isCall
          />
          <Field
            label="Email Address"
            value={data.emailAddress}
            icon="email"
            isEmail={false}

          />
        </View>
      </View>
    </View>
  );
};
