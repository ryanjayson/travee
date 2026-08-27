import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { RideRentalDetailsDto } from "../../../../../types/TravelDto";
import { safeFormatTime, safeFormatDate } from "../../../../../../../utils/dateTimeUtils";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

interface RideRentalDetailsCardProps {
  data: RideRentalDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}


export const RideRentalDetailsCard: React.FC<RideRentalDetailsCardProps> = ({
  data,
  onFullScreenChange,
}) => {

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-0">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Rental Provider
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.providerName || "N/A"}
          </Text>
        </View>

        {/* Pickup & Dropoff Route Map */}
        {data.pickupLocation || data.dropoffLocation ? (
          <View className="mb-2">
            <ActivityDetailCardAddress
              pickupAddress={data.pickupLocation}
              dropoffAddress={data.dropoffLocation}
              title={data.providerName ? `${data.providerName} Route` : "Rental Route"}
              onFullScreenChange={onFullScreenChange}
            />
          </View>
        ) : null}

        {/* Start & End Dates Row */}
        <View className="flex-row items-center justify-between pt-4"
          style={{ display: data.rentalStartDateTime || data.rentalEndDateTime ? "flex" : "none" }}
        >
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Rental Start
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {safeFormatTime(data.rentalStartDateTime)}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5">
              {safeFormatDate(data.rentalStartDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Rental End
            </Text>
            <Text className="text-xl font-semibold text-white/80 text-right">
              {data.rentalEndDateTime ? safeFormatTime(data.rentalEndDateTime) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-white/80 mt-0.5 text-right">
              {data.rentalEndDateTime ? safeFormatDate(data.rentalEndDateTime) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md"
        style={{ display: data.vehicleModel || data.vehicleType || data.bookingReference || data.bookingStatus || data.price || data.websiteAddress ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#3e4ca4]">
          <Field
            label="Vehicle Model"
            value={data.vehicleModel}
            icon="directions-car"
          />
          <Field
            label="Vehicle Type"
            value={data.vehicleType}
            icon="commute"
          />
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            isCopy
          />
          <Field
            label="Booking Status"
            value={data.bookingStatus}
            icon="info-outline"
          />
          <Field
            label="Price"
            value={data.price ? `₱${Number(data.price).toLocaleString()}` : null}
            icon="attach-money"
          />
          <Field
            label="Website / Link"
            value={data.websiteAddress}
            icon="language"
            isLink
          />
        </View>
      </View>

      <View className="px-md mt-sm"
        style={{ display: data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#3e4ca4]">
          <Field
            label="Contact Person"
            value={data.contactName}
            icon="person"
            showBorder={false}
          />
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            showBorder={false}
            isCall
          />
          <Field
            label="Email Address"
            value={data.emailAddress}
            icon="email"
            isEmail
          />
        </View>
      </View>
    </View>
  );
};
