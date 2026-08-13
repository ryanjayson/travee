import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { CafeRestaurantDetailsDto } from "../../../../../types/TravelDto";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { safeFormatTime, safeFormatDate } from "../../../../../../../utils/dateTimeUtils";

interface CafeRestaurantDetailsCardProps {
  data: CafeRestaurantDetailsDto;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};


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
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Cafe / Restaurant / Venue
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.restaurantName || "N/A"}
          </Text>
          {data.address ? (
            <>
              <TouchableOpacity
                onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
                className="flex-row items-center gap-3 mt-1 mb-2  pr-xl"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="location-on" size={18} color="#FFFFFF" />
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.address}
                </Text>
              </TouchableOpacity>
              <MapboxAddressMap address={data.address} coordinates={data.destinationAddressData?.coordinates} title={data.restaurantName} height={180} onFullScreenChange={onFullScreenChange} />
            </>
          ) : null}
        </View>

      </View>

      <View className="flex-row items-center justify-between pb-xl px-md ">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
            Date & Time
          </Text>
          <View className="flex-row gap-3">
            <Text className="text-2xl font-medium text-white/80 ">
              {safeFormatDate(dateTimeVal)}
            </Text>
            <Text className="text-2xl font-semibold text-white/80">
              {safeFormatTime(dateTimeVal)}
            </Text>
          </View>
        </View>
      </View>


      {/* Stub Area */}
      <View className="px-md">
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dd2c2c]">
          <Field
            label="Reservation Link"
            value={data.reservationLink}
            icon="book-online"
            isLink
          />
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
    </View>
  );
};
