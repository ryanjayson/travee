import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { DestinationDto, RideRentalDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const getLocationTitle = (loc?: string | DestinationDto | null): string => {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  return loc.name || loc.city || loc.address || "";
};

export const RideRentalDetailsCard: React.FC<RideRentalDetailsCardProps> = ({
  data,
}) => {
  const formattedPrice = data.price
    ? data.price.startsWith("₱") || data.price.startsWith("$")
      ? data.price
      : !isNaN(Number(data.price))
      ? `₱${Number(data.price).toLocaleString()}`
      : data.price
    : null;

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

  return (
    <View className="mt-4 overflow-hidden">
      {/* Main Details Body */}
      <FadeInView delay={180} duration={400}>
        <View className="p-5 pb-0 bg-[#384690+30] rounded-t-3xl">
          <View className="">
            <Text className="text-xs font-medium text-secondary/80 uppercase tracking-wide mb-1">
              {data.vehicleType ? `${data.vehicleType} Rental` : "Ride & Rental"}
            </Text>
            <Text className="text-2xl leading-2xl font-semibold mb-1 text-secondary">
              {data.providerName || data.destinationAddressData?.name || "N/A"}
            </Text>

            <Text className="text-lg font-semibold mb-1 text-secondary/40">
              {locationText || "N/A"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between p-5 bg-[#384690+30] rounded-b-3xl">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-secondary/500 uppercase tracking-widest mb-1">
              Pick-up
            </Text>
            <Text className="text-2xl font-semibold text-secondary/80">
              {safeFormatTime(data.rentalStartDateTime)}
            </Text>
            <Text className="text-base font-medium text-secondary/80 mt-0.5">
              {safeFormatDate(data.rentalStartDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={30} color={"#384690"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
              Drop-off
            </Text>
            <Text className="text-2xl font-semibold text-secondary/80 text-right">
              {data.rentalEndDateTime ? safeFormatTime(data.rentalEndDateTime) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-secondary/80 mt-0.5 text-right">
              {data.rentalEndDateTime ? safeFormatDate(data.rentalEndDateTime) : ""}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md my-lg"
          style={{ display: hasRentalInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Rental Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2">
            <Field
              label="Booking Ref"
              value={data.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
              borderColor="border-[#384690]"
            />
            <Field
              label="Vehicle Model"
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
              label="Pick-up Location"
              value={pickupLoc}
              icon="place"
              showBorder={false}
              borderColor="border-[#384690]"
            />
            <Field
              label="Drop-off Location"
              value={dropoffLoc}
              icon="pin-drop"
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
          className="px-md"
          style={{
            display:
              data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none",
          }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2 pb-1 pl-1">
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
