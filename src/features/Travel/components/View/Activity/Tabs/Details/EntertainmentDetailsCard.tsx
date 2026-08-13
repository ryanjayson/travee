import React from "react";
import { Alert, Clipboard, Linking, Platform, Text, ToastAndroid, View } from "react-native";
import { useTheme } from "react-native-paper";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { EntertainmentDetailsDto } from "../../../../../types/TravelDto";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

interface EntertainmentDetailsCardProps {
  data: EntertainmentDetailsDto;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const entColor = activityIcons.find((icon) => icon.name === ActivityType.entertainmentAndRecreation)?.color || "#7B1FA2";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

export const EntertainmentDetailsCard: React.FC<EntertainmentDetailsCardProps> = ({
  data,
  activityStartDate,
  onFullScreenChange,
}) => {
  const { colors } = useTheme();
  const dateTimeVal = activityStartDate || (data as any)?.activitydatetime || (data as any)?.startDate;

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
        <View className="mb-1">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Venue Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.venueName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.venueName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>
      </View>

      {dateTimeVal ? (
        <View className="flex-row items-center justify-between pb-xl px-md">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Date & Time
            </Text>
            <View className="flex-row gap-3">
              <Text className="text-2xl font-medium text-white/90">
                {safeFormatDate(dateTimeVal)}
              </Text>
              <Text className="text-2xl font-semibold text-white/60">
                {safeFormatTime(dateTimeVal)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Website & Booking Reference Section */}
      <View className="px-md">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#077f9d]">
          <Field
            label="Type"
            value={data.subType}
            icon="museum"
          />
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            isCopy
          />
          <Field
            label="Price"
            value={data.ticketPrice}
            icon="price-check"
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
          />
        </View>
      </View>

      {/* Contact Info Section */}
      <View className="px-md mt-sm">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#077f9d]">
          <Field label="Contact Person" value={data.contactName} icon="person" showBorder={false} />
          <Field label="Contact Number" value={data.contactNumber} icon="phone" showBorder={false} isCall />
          <Field label="Email Address" value={data.emailAddress} icon="email" isEmail={true} />
        </View>
      </View>
    </View>
  );
};
