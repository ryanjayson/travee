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
    <View className="mt-2 px-2 overflow-hidden">
      {/* Main Details Body */}

      <FadeInView type="down" delay={180} duration={200}>
        <View className="p-2xl rounded-3xl flex-1 mb-4 bg-[#384690+30]">
          <View className="flex-row items-start w-full">
            <View className="flex-col gap-2 flex-1">
              {data.destinationAddressData?.name && data.destinationAddressData?.name != data.providerName ? (
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="pt-0.5">
                      <Icon name="location-on" size={28} color={"#384690"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-secondary/70 uppercase tracking-wide">
                        {data.vehicleType ? `${data.vehicleType} Rental` : "Ride & Rental"}
                      </Text>
                      <Text className="text-xl leading-xl font-semibold text-secondary">
                        {data.destinationAddressData?.name}
                      </Text>
                      <Text className="text-secondary/60 font-semibold text-base">
                        {data.address || locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (data.address || locationText) ? (
                <View className="flex flex-col flex-1">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="pt-0.5">
                      <Icon name="location-on" size={28} color={"#384690"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                        Address
                      </Text>
                      <Text className="mb-1 text-secondary/80 text-base font-semibold">
                        {data.address || locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : data.providerName ? (
                <View className="flex flex-col flex-1">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="pt-0.5">
                      <Icon name="directions-car" size={28} color={"#384690"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-secondary/70 uppercase tracking-wide">
                        {data.vehicleType ? `${data.vehicleType} Rental` : "Ride & Rental"}
                      </Text>
                      <Text className="text-xl leading-xl font-semibold text-secondary">
                        {data.providerName}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View
            className="flex-1 p-5 rounded-3xl"
            style={{
              display: data.rentalStartDateTime ? "flex" : "none",
              backgroundColor: "#38469050",
            }}
          >
            <View className="flex-1 mb-3">
              <Icon name="timer" size={28} color={"#384690"} />
            </View>
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
              Pick-up
            </Text>
            <Text className="text-2xl font-semibold text-secondary/70">
              {safeFormatTime(data.rentalStartDateTime)}
            </Text>
            <Text className="text-base font-medium text-secondary/70 mt-0.5">
              {safeFormatDate(data.rentalStartDateTime)}
            </Text>
          </View>

          <View
            className="flex-1 p-5 rounded-3xl"
            style={{
              display: data.rentalEndDateTime ? "flex" : "none",
              backgroundColor: "#38469030",
            }}
          >
            <View className="flex-1 mb-3">
              <Icon name="timer-off" size={28} color={"#384690"} />
            </View>
            <Text className="text-xs font-semibold text-secondary uppercase tracking-widest">
              Drop-off
            </Text>
            <Text className="text-2xl font-semibold text-secondary/70">
              {data.rentalEndDateTime ? safeFormatTime(data.rentalEndDateTime) : "--:--"}
            </Text>
            <Text className="text-base font-medium text-secondary/70 mt-0.5">
              {data.rentalEndDateTime ? safeFormatDate(data.rentalEndDateTime) : ""}
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-xl"
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
            display:
              data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none",
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
