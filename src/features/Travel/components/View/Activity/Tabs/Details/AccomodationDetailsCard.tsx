import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import {
  safeFormatDate,
  safeFormatTime,
} from "../../../../../../../utils/dateTimeUtils";
import { AccomodationDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";

interface AccomodationDetailsCardProps {
  data: AccomodationDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const AccomodationDetailsCard: React.FC<AccomodationDetailsCardProps> = ({
  data,
}) => {
  const themeColor = "#9c46ec";

  const locationText =
    data.address ||
    data.destinationAddressData?.address ||
    data.destinationAddressData?.name ||
    "";

  const hasNameMismatch =
    data.destinationAddressData?.name &&
    data.destinationAddressData?.name !== data.accomodationName;

  const hasBookingInfo = Boolean(
    data.subType || data.bookingReference || data.websiteAddress
  );

  const hasContactInfo = Boolean(
    data.contactName || data.contactNumber || data.emailAddress
  );

  return (
    <View className="mt-4 px-2">
      {/* Main Details Body */}
      <View
        className="py-xl px-2xl rounded-3xl mb-2 gap-4"
        style={{ backgroundColor: `${themeColor}40` }}
      >
        <View className="flex-row items-start w-full mb-4">
          <View className="flex-col gap-2 flex-1">
            {hasNameMismatch ? (
              <View className="flex flex-col gap-3">
                <View className="flex flex-row gap-3 items-start flex-1">
                  <View className="flex-1">
                    <Text
                      className={
                        "text-2xl leading-xl font-semibold " +
                        "text-secondary tracking-tight"
                      }
                    >
                      {data.destinationAddressData?.name}
                    </Text>
                    {locationText ? (
                      <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                        {locationText}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : (
              locationText && (
                <View className="flex flex-col flex-1">
                  <View className="flex flex-row gap-1 items-start flex-1">
                    <View className="flex-1 gap-0">
                      <Text className="text-xl font-semibold text-secondary ">
                        Address
                      </Text>
                      <Text className="text-secondary/60 font-normal leading-relaxed text-xl">
                        {locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>

        {/* Check-in Info Block */}
        <View className="flex-row gap-6 pl-xl">
          <View className="mb-2">
            <Icon name="timer" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-xl font-semibold text-secondary">
              Check-in
            </Text>
            {data.checkinDateTime ? (
              <View className="flex-row items-end gap-2">
                <Text className="text-xl font-semibold text-secondary/40">
                  {safeFormatTime(data.checkinDateTime)}
                </Text>
                <Text className="text-base text-secondary/50">
                  {safeFormatDate(data.checkinDateTime)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Check-out Info Block */}
        <View className="flex-row gap-6 px-xl">
          <View className="mb-2">
            <Icon name="timer" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-xl font-semibold text-secondary">
              Check-out
            </Text>
            {data.checkoutDateTime ? (
              <View className="flex-row items-end gap-2">
                <Text className="text-xl font-semibold text-secondary/40">
                  {safeFormatTime(data.checkoutDateTime)}
                </Text>
                <Text className="text-base font-medium text-secondary/50">
                  {safeFormatDate(data.checkoutDateTime)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-sm"
          style={{ display: hasBookingInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Booking Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
            <Field
              label="Booking Ref"
              value={data.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
              borderColor="border-[#9234ea]"
            />
            <Field
              label="Type"
              value={data.subType}
              icon="hotel"
              showBorder={false}
              borderColor="border-[#9234ea]"
            />
            <Field
              label="Website"
              value={data.websiteAddress}
              icon="link"
              showBorder={false}
              isLink={true}
              borderColor="border-[#9234ea]"
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-xl"
          style={{ display: hasContactInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pb-1 pl-0">
            {data.contactName ? (
              <Field
                label="Contact Person"
                value={data.contactName}
                icon="person"
                showBorder={false}
                borderColor="border-[#9234ea]"
              />
            ) : null}
            <Field
              label="Contact Number"
              value={data.contactNumber}
              icon="phone"
              showBorder={false}
              borderColor="border-[#9234ea]"
              isCall
            />
            {data.emailAddress ? (
              <Field
                label="Email Address"
                value={data.emailAddress}
                icon="email"
                showBorder={false}
                borderColor="border-[#9234ea]"
                isEmail={true}
              />
            ) : null}
          </View>
        </View>
      </FadeInView>
    </View>
  );
};
