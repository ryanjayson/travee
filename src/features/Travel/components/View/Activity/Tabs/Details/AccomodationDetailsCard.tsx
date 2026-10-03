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
        className="p-2xl rounded-3xl mb-4 gap-6"
        style={{ backgroundColor: `${themeColor}30` }}
      >
          <View className="flex-row items-start w-full ">
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
                      <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                        {locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                locationText && (
                  <View className="flex flex-col flex-1">
                    <View className="flex flex-row gap-3 items-start flex-1">
                      <View className="flex-1">
                        <Text
                          className={
                            "text-xs font-semibold text-secondary " +
                            "uppercase tracking-widest"
                          }
                        >
                          Address
                        </Text>
                        <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                          {locationText}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              )}
            </View>
          </View>

          <View className="flex-row gap-6">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
                Check-in
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {data.checkinDateTime ? safeFormatTime(data.checkinDateTime) : "--:--"}
              </Text>
              <Text className="text-base font-medium text-secondary/50">
                {data.checkinDateTime ? safeFormatDate(data.checkinDateTime) : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-6">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
                Check-out
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
              </Text>
              <Text className="text-base font-medium text-secondary/50">
                {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : ""}
              </Text>
            </View>
          </View>
        </View>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md "
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
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
            <Field
              label="Contact Person"
              value={data.contactName}
              icon="person"
              showBorder={false}
              borderColor="border-[#9234ea]"
            />
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
