import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { SightseeingDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";

interface SightseeingDetailsCardProps {
  data: SightseeingDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const sightColor = activityIcons.find((icon) => icon.name === ActivityType.sightseeing)?.color || "#FF9800";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const SightseeingDetailsCard: React.FC<SightseeingDetailsCardProps> = ({ data, onFullScreenChange }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="pb-4 border-b-2 border-dashed border-[#c88a04]">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Attraction Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.attractionName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.attractionName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>

      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dc9804]">
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            isCopy
          />
          <Field
            label="Entry Fee"
            value={data.entryFee}
            icon="money"
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

      {/* Contact Info Section */}
      {(data.contactNumber || data.emailAddress) ? (
        <View className="px-md mt-sm">
          <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dc9804]">
            <Field label="Contact Number" value={data.contactNumber} icon="phone" showBorder={false} isCall />
            <Field label="Email Address" value={data.emailAddress} icon="email" isEmail={true} />
          </View>
        </View>
      ) : null}
    </View>
  );
};
