import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { CafeRestaurantDetailsDto } from "../../../../../types/TravelDto";
import MapboxAddressMap from "../../../../../../../components/MapboxAddressMap";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
interface CafeRestaurantDetailsCardProps {
  data: CafeRestaurantDetailsDto;
}

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

const handleCall = (phone: string) => {
  if (phone) {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Failed to make call", err));
  }
};

export const CafeRestaurantDetailsCard: React.FC<CafeRestaurantDetailsCardProps> = ({ data }) => {

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
                className="flex-row items-center gap-6 mt-1 mb-2  pr-xl"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Icon name="location-on" size={24} color="#FFFFFF" />
                <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                  {data.address}
                </Text>
              </TouchableOpacity>
              <MapboxAddressMap address={data.address} title={data.restaurantName} height={180} />
            </>
          ) : null}
        </View>

        {/* Row of details: Cuisine & Price Range */}
        <View className="flex-row items-center justify-between  pt-4 border-t-2 border-dashed border-[#d32222]">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Cuisine
            </Text>
            <Text className="text-xl font-semibold text-white/80">
              {data.cuisine || "N/A"}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Price Range
            </Text>
            <Text className="text-xl font-semibold text-white/80 text-right">
              {data.priceRange || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
        {/* Contact Info and reservation */}
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#dd2c2c]">

          <Field
            label="Contact Number"
            value={data.contactNumber}
            icon="phone"
            onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined}
          />
          <Field
            label="Reservation"
            value={data.reservationLink}
            icon="book-online"
            isLink
            onPress={data.reservationLink ? () => handleOpenLink(data.reservationLink!) : undefined}
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
            onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
