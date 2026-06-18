import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";

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

const Field = ({
  label,
  value,
  icon,
  onPress,
  isLink,
}: {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  return (
    <View className="flex-row items-start mb-3 gap-6">
      {icon ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={24} color={"#fffefe"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-lg font-medium"
              style={{
                color: "#ffffff",
                textDecorationLine: isLink ? "underline" : "none",
                opacity: 0.6,
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={16} color={"#FFFFFF"} style={{ opacity: 0.6 }} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white opacity-60">{value}</Text>
        )}
      </View>
    </View>
  );
};

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
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Accommodation / Hotel
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.accomodationName || "N/A"}
          </Text>
          {data.address ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.address}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Check-in & Check-out Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed" style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Check-in
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5">
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
            <Text className="text-xl font-semibold text-white/80 text-right">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5 text-right">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stay Voucher Stub */}
      <View className="p-5 pt-3">
        {/* Row 1: Booking Reference & Website address */}
        <View className="flex-row justify-between mb-4 gap-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Booking Ref
            </Text>
            {data.bookingReference ? (
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
            ) : (
              <Text className="text-base font-bold text-white/80">N/A</Text>
            )}
          </View>

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

        {/* Row 2: Contact Info */}
        <View className="flex-col gap-1 pt-4 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}>
          <Field label="Contact Person" value={data.contactName} icon="person" />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined}
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
