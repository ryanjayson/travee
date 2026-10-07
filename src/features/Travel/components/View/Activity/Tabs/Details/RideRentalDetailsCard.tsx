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
import {
  formatPrice,
  getLocationAddress,
  getLocationTitle,
} from "./activityDetailUtils";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto & { destinationData?: any };
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const RideRentalDetailsCard: React.FC<RideRentalDetailsCardProps> = ({
  data,
}) => {
  const formattedPrice = formatPrice(data.price);

  const pickupLoc = getLocationTitle(data.pickupLocation);
  const pickupSubtitle = getLocationAddress(data.pickupLocation);
  const dropoffLoc = getLocationTitle(data.dropoffLocation);
  const dropoffSubtitle = getLocationAddress(data.dropoffLocation);
  const addressLoc = getLocationTitle(data.address);

  const locationText =
    pickupLoc && dropoffLoc && pickupLoc !== dropoffLoc
      ? `${pickupLoc} → ${dropoffLoc}`
      : addressLoc ||
        pickupLoc ||
        dropoffLoc ||
        data.destinationAddressData?.name ||
        "";

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
                    <Text
                      className={
                        "text-2xl leading-xl font-semibold " +
                        "text-secondary tracking-tight"
                      }
                    >
                      {data.providerName}
                    </Text>
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
                  <View className="flex flex-row gap-1 items-start flex-1">
                    <View className="flex-1 gap-0">
                      <Text className="text-xl font-semibold text-secondary ">
                        Address
                      </Text>
                      <Text className="text-secondary/60 font-normal leading-relaxed text-xl">
                        {data.address || locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>

        {/* Pick-up Info Block */}
        <View className="flex-row gap-6 pl-xl">
          <View className="mb-2">
            <Icon name="departure-board" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-xl font-semibold text-secondary">
              Pick-up
            </Text>

            {pickupLoc ? (
              <View className="">
                <Text className="text-lg font-semibold text-secondary/60 leading-relaxed">
                  {pickupLoc}
                </Text>
                {pickupSubtitle && pickupSubtitle !== pickupLoc ? (
                  <Text className="text-lg text-secondary/60">
                    {pickupSubtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {data.rentalStartDateTime && (
              <View className="flex-row items-end gap-2">
                <Text className="text-xl font-semibold text-secondary/40">
                  {safeFormatTime(data.rentalStartDateTime)}
                </Text>
                <Text className="text-base text-secondary/50">
                  {safeFormatDate(data.rentalStartDateTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Drop-off Info Block */}
        <View className="flex-row gap-6 px-xl">
          <View className="mb-2">
            <Icon name="place" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-xl font-semibold text-secondary">
              Drop-off
            </Text>

            {dropoffLoc ? (
              <View className="">
                <Text className="text-lg font-semibold text-secondary/60 leading-relaxed">
                  {dropoffLoc}
                </Text>
                {dropoffSubtitle && dropoffSubtitle !== dropoffLoc ? (
                  <Text className="text-lg text-secondary/60 leading-relaxed">
                    {dropoffSubtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {data.rentalEndDateTime && (
              <View className="flex-row items-end gap-2">
                <Text className="text-xl font-semibold text-secondary/40">
                  {safeFormatTime(data.rentalEndDateTime)}
                </Text>
                <Text className="text-base font-medium text-secondary/50">
                  {safeFormatDate(data.rentalEndDateTime)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-sm"
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
                borderColor="border-[#384690]"
              />
            ) : null}
            <Field
              label="Contact Number"
              value={data.contactNumber}
              icon="phone"
              showBorder={false}
              borderColor="border-[#384690]"
              isCall
            />
            {data.emailAddress ? (
              <Field
                label="Email Address"
                value={data.emailAddress}
                icon="email"
                showBorder={false}
                borderColor="border-[#384690]"
                isEmail={true}
              />
            ) : null}
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
