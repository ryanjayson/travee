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
    <View className="mt-2 px-2 overflow-hidden">
      {/* Main Details Body */}

      <FadeInView type="down" delay={180} duration={200}>
        <View
          className="p-2xl rounded-3xl flex-1 mb-4 bg-[#9c46ec+40] "
        >
          <View className="flex-row items-start w-full ">
            <View className="flex-col gap-2 flex-1">
              {data.destinationAddressData?.name && data.destinationAddressData?.name != data.accomodationName ?
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="pt-0.5">
                      <Icon name="location-on" size={28} color={"#9c46ec"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-secondary/70 uppercase tracking-wide">
                        {data.subType ? `${data.subType} Name` : "Place to stay"}
                      </Text>
                      <Text className="text-xl leading-xl font-semibold text-secondary">
                        {data.destinationAddressData?.name}
                      </Text>
                      <Text className="text-secondary/60 font-semibold text-base">
                        {data.address}
                      </Text>
                    </View>
                  </View>
                </View>
                :
                data.address && (
                  <View className="flex flex-col flex-1">
                    <View className="flex flex-row gap-3 items-start flex-1">
                      <View className="pt-0.5">
                        <Icon name="location-on" size={28} color={"#9c46ec"} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-secondary uppercase tracking-widest mb-1 ">
                          Address
                        </Text>
                        <Text className="mb-1 text-secondary/80 text-base font-semibold">
                          {data.address}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              }
            </View>
          </View>
        </View>

        <View
          className="flex-row gap-4"
        >
          <View className="flex-1 p-5 rounded-3xl"
            style={{
              display: data.checkinDateTime ? "flex" : "none",
              backgroundColor: `#9c46ec80`
            }}>
            <View className="flex-1 mb-3">
              <Icon name="timer" size={28} color={"#9c46ec"} />
            </View>
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest ">
              Check-in
            </Text>
            <Text className="text-2xl font-semibold text-secondary/70">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-base font-medium text-secondary/70 mt-0.5">
              {safeFormatDate(data.checkinDateTime)}
            </Text>
          </View>


          <View className="flex-1 p-5 rounded-3xl "
            style={{
              display: data.checkoutDateTime ? "flex" : "none",
              backgroundColor: `#9c46ec40`
            }}>
            <View className="flex-1 mb-3">
              <Icon name="timer-off" size={28} color={"#9c46ec"} />
            </View>
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest ">
              Check-out
            </Text>
            <Text className="text-2xl font-semibold text-secondary/70">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-secondary/70 mt-0.5">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : ""}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>

        <View className="px-md mt-xl"
          style={{ display: data.subType || data.bookingReference || data.websiteAddress ? "flex" : "none" }}>
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Booking Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
            <Field label="Booking Ref" value={data.bookingReference} icon="folder-open" showBorder={false} isCopyable={true} borderColor="border-[#9234ea]" />
            <Field label="Type" value={data.subType} icon="hotel" showBorder={false} borderColor="border-[#9234ea]" />
            <Field label="Website" value={data.websiteAddress} icon="link" showBorder={false} isLink={true} borderColor="border-[#9234ea]" />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View className="px-md mt-xl"

          style={{ display: data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
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
