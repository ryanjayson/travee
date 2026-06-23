import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { CafeRestaurantDetailsDto } from "../../../../../types/TravelDto";

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

const Field = ({
  label,
  value,
  icon,
  onPress,
  isLink,
}: {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  return (
    <View className="flex-row items-start mb-3 gap-6">
      {icon ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={24} color={"#fffefe"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-lg font-medium"
              style={{
                color: "#ffffff",
                textDecorationLine: isLink ? "underline" : "none",
                opacity: 0.6,
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={16} color={"#FFFFFF"} style={{ opacity: 0.6 }} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white opacity-60">{value}</Text>
        )}
      </View>
    </View>
  );
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
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.address}
              </Text>
            </TouchableOpacity>
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
