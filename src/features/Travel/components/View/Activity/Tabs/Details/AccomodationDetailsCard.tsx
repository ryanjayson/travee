import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Linking, Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
interface AccomodationDetailsCardProps {
  data: AccomodationDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

export const AccomodationDetailsCard: React.FC<AccomodationDetailsCardProps> = ({ data, onFullScreenChange }) => {

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest mb-2">
            Accommodation / Place to stay
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.accomodationName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.accomodationName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-md pb-xl px-md ">
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
      <View className="px-md ">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#9c46ec]">
          <Field label="Booking Ref" value={data.bookingReference} icon="folder-open" showBorder={false} isCopyable={true} borderColor="border-[#9234ea]" />
          <Field label="Website" value={data.websiteAddress} icon="link" showBorder={false} isLink={true} borderColor="border-[#9234ea]" />
        </View>
      </View>

      <View className="px-md mt-sm">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#9c46ec]">
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
