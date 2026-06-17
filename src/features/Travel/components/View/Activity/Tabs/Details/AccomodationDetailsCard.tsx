import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";
import ActivityIcon, { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

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

const accomodationColor = activityIcons.find((icon) => icon.name === ActivityType.accomodation)?.color || "#9C27B0";

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
    <View className="flex-row items-start mb-2 gap-6">
      {icon ? (
        <View
        style={{
          backgroundColor:accomodationColor + "20",
          padding: 12,
          borderRadius: 12,
          width: 40,
          height: 40,
        }}>
          <Icon name={icon as any} size={16} color={accomodationColor + "95"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text className={`text-base font-bold`}
            style={{
              color: isLink ? accomodationColor : "#182230",
              textDecorationLine: isLink ? "underline" : "none",
            }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={18} color={accomodationColor + "80"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
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
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${accomodationColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="hotel" size={20} color={accomodationColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            STAY RESERVATION
          </Text>
        </View>
        {data.bookingStatus ? (
          <View className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${accomodationColor}1C` }}>
            <Text className="text-white text-xs font-bold tracking-wide uppercase">
              {data.bookingStatus}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Stay Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-gray-500 bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Accommodation / Hotel
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{
            color: accomodationColor
          }}>
            {data.accomodationName || "N/A"}
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

        {/* Check-in & Check-out Row */}
        <View className="flex-row items-center justify-between pt-2 border-t border-dashed border-gray-200">
          {/* Check-in */}
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Check-in
            </Text>
            <Text className="text-base font-extrabold text-gray-800">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5">
              {safeFormatDate(data.checkinDateTime)}
            </Text>
          </View>

          {/* Stay Arrow Indicator */}
          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={`${accomodationColor}`} />
          </View>

          {/* Check-out */}
          <View className="flex-1 items-end">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Check-out
            </Text>
            <Text className="text-base font-extrabold text-gray-800 text-right">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5 text-right">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : "N/A"}
            </Text>
          </View>
        </View>
      </View>


      {/* Stay Voucher Stub */}
      <View className="p-5 pt-3 border-2 border-t-0 -mt-0.5 border-gray-500 rounded-b-3xl bg-white">
        {/* Row 1: Booking Reference & Contact Person */}
        <View className="flex-row justify-between mb-4 gap-4 ">
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


        {/* Row 3: Website address */}
        {data.websiteAddress ? (

          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Website
            </Text>
            {data.websiteAddress ? (
              <TouchableOpacity
                onPress={() => handleCopy(data.websiteAddress || "", "Website")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="link" size={18} color="#667085" />
                <Text className="text-base font-bold text-gray-800">
                  {data.websiteAddress}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-bold text-gray-800">N/A</Text>
            )}
          </View>
        ) : null} 

        </View>



        {/* Row 2: Contact Numbers & Email */}
        <View className="flex-1 justify-between mb-4 gap-4 pt-6 border-t-2  border-gray-200">
            <View className="flex-1 items-end">
            <Field label="Contact Person" value={data.contactName} icon="person" />
          </View>
          <View className="flex-1">
            <Field 
              label="Contact Number" 
              value={data.contactNumber} 
              icon="phone" 
              onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined} 
            />
          </View>

          <View className="flex-1 items-end">
            <Field 
              label="Email Address" 
              value={data.emailAddress} 
              icon="email" 
              onPress={data.emailAddress ? () => handleEmail(data.emailAddress!) : undefined} 
            />
          </View>
        </View>

      


      </View>




    </View>
  );
};
