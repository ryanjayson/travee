import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Linking, Text, View } from "react-native";
import { useTheme } from "react-native-paper";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { HikeOrCampDetailsDto } from "../../../../../types/TravelDto";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";

interface HikeOrCampDetailsCardProps {
  data: HikeOrCampDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}


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

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const HikeOrCampDetailsCard: React.FC<HikeOrCampDetailsCardProps> = ({
  data,
  onFullScreenChange,
}) => {

  return (
    <View className="rounded-3xl mb-6  overflow-hidden">
      {/* Main Details Body */}
      <View className="px-2">
        <View className="mb-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
              Trail / Site Name
            </Text>
            {data.destinationAddressData && data.permitRequired !== undefined && data.permitRequired !== null ? (
              <View
                className="px-3 py-2 rounded-full opacity-75"
                style={{ backgroundColor: data.permitRequired ? `#3E8E5B` : "#07945550" }}
              >
                <Text
                  className="text-xs font-extrabold tracking-wide uppercase"
                  style={{ color: "#ddd" }}
                >
                  {data.permitRequired ? "Permit Required" : "No Permit Required"}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white ">
            {data.trailOrSiteName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.trailOrSiteName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>

        {/* Start & End Dates Row */}
        <View className="flex-row items-center justify-between pb-xl px-md ">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Start / Check-in
            </Text>
            <Text className="text-2xl font-semibold text-white/60">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-md font-medium text-white/60 mt-0.5">
              {safeFormatDate(data.checkinDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              End / Check-out
            </Text>
            <Text className="text-2xl font-semibold text-white/60 text-right">
              {safeFormatTime(data.checkoutDateTime)}
            </Text>
            <Text className="text-md font-medium text-white/60 mt-0.5 text-right">
              {safeFormatDate(data.checkoutDateTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md"
        style={{ display: data.subType || data.reservationLink || data.websiteAddress ? "flex" : "none" }}>
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#3E8E5B]">
          <Field
            label="Activity Name"
            value={data.subType == "Both" ? "Camp & Hike" : data.subType}
            icon="book-online"
            showBorder={false}
          />
          <Field
            label="Reservation"
            value={data.reservationLink}
            icon="book-online"
            isCopy
            showBorder={false}
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
            showBorder={false}
          />
        </View>
      </View>

      <View className="px-md mt-sm"
        style={{ display: data.contactPerson || data.contactNumber || data.emailAddress ? "flex" : "none" }}>
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#3E8E5B]">
          <Field
            label="Contact Person"
            value={data.contactPerson}
            icon="person"
            showBorder={false}
          />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            showBorder={false}
            isCall
            onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined}
          />
          <Field
            label="Email Address"
            value={data.emailAddress}
            icon="email"
            isEmail={true}
            showBorder={false}
          />
        </View>
      </View>
    </View>
  );
};
