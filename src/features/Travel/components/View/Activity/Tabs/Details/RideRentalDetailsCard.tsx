import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import {
  safeFormatDate,
  safeFormatTime,
} from "../../../../../../../utils/dateTimeUtils";
import { RideRentalDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";
import { formatPrice, getLocationTitle } from "./activityDetailUtils";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto & { destinationData?: any };
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const RideRentalDetailsCard: React.FC<RideRentalDetailsCardProps> = ({
  data,
}) => {
  const formattedPrice = formatPrice(data.price);

  const pickupLoc = getLocationTitle(data.pickupLocation);
  const dropoffLoc = getLocationTitle(data.dropoffLocation);
  const addressLoc = getLocationTitle(data.address);

  const locationText =
    pickupLoc && dropoffLoc && pickupLoc !== dropoffLoc
      ? `${pickupLoc} → ${dropoffLoc}`
      : addressLoc || pickupLoc || dropoffLoc || data.destinationAddressData?.name || "";

  const hasRentalInfo = Boolean(
    data.vehicleModel ||
    data.vehicleType ||
    data.bookingReference ||
    data.bookingStatus ||
    data.price ||
    pickupLoc ||
    dropoffLoc ||
    data.websiteAddress
  );

  const hasContactInfo = Boolean(
    data.contactName || data.contactNumber || data.emailAddress
  );

  const hasNameMismatch =
    data.destinationAddressData?.name &&
    data.destinationAddressData?.name !== data.providerName;

  const themeColor = "#384690";

  return (
    <View className="mt-4 px-2">
      {/* Main Details Body */}
      <View
        className="p-2xl rounded-3xl mb-4 gap-6"
        style={{ backgroundColor: `${themeColor}30` }}
      >
          <View className="flex-row items-start w-full">
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
                      {data.address || locationText ? (
                        <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                          {data.address || locationText}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : data.providerName ? (
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="flex-1">
                      {(data.address || locationText) &&
                      (data.address || locationText) !== data.providerName ? (
                        <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                          {data.address || locationText}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : (
                (data.address || locationText) && (
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
                          {data.address || locationText}
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
                Pick-up
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {data.rentalStartDateTime
                  ? safeFormatTime(data.rentalStartDateTime)
                  : "--:--"}
              </Text>
              <Text className="text-base font-medium text-secondary/50">
                {data.rentalStartDateTime
                  ? safeFormatDate(data.rentalStartDateTime)
                  : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-6">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
                Drop-off
              </Text>
              <Text className="text-2xl font-semibold text-secondary/40">
                {data.rentalEndDateTime
                  ? safeFormatTime(data.rentalEndDateTime)
                  : "--:--"}
              </Text>
              <Text className="text-base font-medium text-secondary/50">
                {data.rentalEndDateTime
                  ? safeFormatDate(data.rentalEndDateTime)
                  : ""}
              </Text>
            </View>
          </View>
        </View>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md "
          style={{ display: hasRentalInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Rental Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">
            <Field
              label="Booking Ref"
              value={data.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
              borderColor="border-[#384690]"
            />
            <Field
              label="Model"
              value={data.vehicleModel}
              icon="directions-car"
              showBorder={false}
              borderColor="border-[#384690]"
            />
            <Field
              label="Vehicle Type"
              value={data.vehicleType}
              icon="commute"
              showBorder={false}
              borderColor="border-[#384690]"
            />
            <Field
              label="Booking Status"
              value={data.bookingStatus}
              icon="info-outline"
              showBorder={false}
              borderColor="border-[#384690]"
            />
            <Field
              label="Price"
              value={formattedPrice}
              icon="attach-money"
              showBorder={false}
              borderColor="border-[#384690]"
            />
            <Field
              label="Website"
              value={data.websiteAddress}
              icon="link"
              showBorder={false}
              isLink={true}
              borderColor="border-[#384690]"
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-xl"
          style={{
            display: hasContactInfo ? "flex" : "none",
          }}
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
              borderColor="border-[#384690]"
            />
            <Field
              label="Contact Number"
              value={data.contactNumber}
              icon="phone"
              showBorder={false}
              borderColor="border-[#384690]"
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

      {data.notes ? (
        <FadeInView delay={180} duration={400}>
          <View className="px-md my-lg">
            <Text className="text-xl font-semibold text-secondary mt-lg">
              Notes
            </Text>
            <View className="rounded-2xl flex-col gap-3 p-2">
              <Text className="text-base text-secondary/60 leading-6">
                {data.notes}
              </Text>
            </View>
          </View>
        </FadeInView>
      ) : null}
    </View>
  );
};
