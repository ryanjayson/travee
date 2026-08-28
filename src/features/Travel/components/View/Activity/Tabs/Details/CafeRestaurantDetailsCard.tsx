import React from "react";
import { Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { CafeRestaurantDetailsDto } from "../../../../../types/TravelDto";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

interface CafeRestaurantDetailsCardProps {
  data: CafeRestaurantDetailsDto;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const CafeRestaurantDetailsCard: React.FC<CafeRestaurantDetailsCardProps> = ({
  data,
  activityStartDate,
  onFullScreenChange,
}) => {
  const dateTimeVal = activityStartDate || (data as any)?.activitydatetime || (data as any)?.startDate;

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="mb-1">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Cafe / Restaurant / Venue
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.restaurantName || "--"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.restaurantName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between pb-xl px-md ">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
            Date & Time
          </Text>
          <View className="flex-row gap-3">
            <Text className="text-2xl font-medium text-white/90 ">
              {safeFormatDate(dateTimeVal)}
            </Text>
            <Text className="text-2xl font-semibold text-white/60">
              {safeFormatTime(dateTimeVal)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md"
        style={{ display: data.reservationLink || data.cuisine || data.priceRange ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dd2c2c]">
          <Field
            label="Reservation / Booking reference"
            value={data.reservationLink}
            icon="book-online"
            isLink
          />
          <Field
            label="Cuisine"
            value={data.cuisine}
            icon="restaurant"
          />
          <Field
            label="Price Range"
            value={data.priceRange}
            icon="money"
          />
        </View>
      </View>
      <View className="px-md mt-sm"
        style={{ display: data.contactNumber || data.websiteAddress ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dd2c2c]">
          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            isCall
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
          />
        </View>
      </View>
    </View>
  );
};
