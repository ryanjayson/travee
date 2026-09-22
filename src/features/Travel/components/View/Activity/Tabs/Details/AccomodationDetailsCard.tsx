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
import { FadeInView, StaggerItem } from "../../../../../../../components/animations";

export const AccomodationDetailsCard: React.FC<AccomodationDetailsCardProps> = ({ data, onFullScreenChange }) => {

  return (
    <View className="mt-4 overflow-hidden">
      {/* Main Details Body */}
      <FadeInView delay={180} duration={400}>
        <View className="p-5 pb-0 bg-[#9c46ec+99] rounded-t-3xl">
          <View className="">
            <Text className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">
              {data.subType ? `${data.subType} Name` : "Place to stay"}
            </Text>
            <Text className="text-xl leading-2xl font-semibold  mb-1 text-white">
              {data.destinationAddressData.name || "N/A"}
            </Text>

            <Text className=" text-white text-lg font-light">
              {data.address}
            </Text>

            {/* <ActivityDetailCardAddress
              address={data.address}
              coordinates={data.destinationAddressData?.coordinates}
              title={data.accomodationName}
              onFullScreenChange={onFullScreenChange}
            /> */}
          </View>
        </View>

        <View className="flex-row items-center justify-between p-5 bg-[#9c46ec+99] rounded-b-3xl">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
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
            <Icon name="chevron-right" size={38} color={"#FFFFFF"} style={{ opacity: .75 }} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
              Check-out
            </Text>
            <Text className="text-2xl font-semibold text-white/80 text-right">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-white/80 mt-0.5 text-right">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : ""}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>

        <View className="px-md my-lg"
          style={{ display: data.subType || data.bookingReference || data.websiteAddress ? "flex" : "none" }}>
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Booking Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2  ">
            <Field label="Booking Ref" value={data.bookingReference} icon="folder-open" showBorder={false} isCopyable={true} borderColor="border-[#9234ea]" />
            <Field label="Type" value={data.subType} icon="hotel" showBorder={false} borderColor="border-[#9234ea]" />
            <Field label="Website" value={data.websiteAddress} icon="link" showBorder={false} isLink={true} borderColor="border-[#9234ea]" />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View className="px-md "
          style={{ display: data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2 pb-1 pl-1 ">
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
              isEmail={true}
            />
          </View>
        </View>
      </FadeInView>

    </View>
  );
};
