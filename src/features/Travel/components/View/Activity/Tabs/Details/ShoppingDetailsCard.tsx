import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { ShoppingDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface ShoppingDetailsCardProps {
  data: ShoppingDetailsDto;
}

const shopColor = activityIcons.find((icon) => icon.name === ActivityType.shopppingAndService)?.color || "#E91E63";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
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
            backgroundColor: shopColor + "20",
            padding: 12,
            borderRadius: 12,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={16} color={shopColor + "95"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-base font-bold"
              style={{
                color: isLink ? shopColor : "#182230",
                textDecorationLine: isLink ? "underline" : "none",
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={18} color={shopColor + "80"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const ShoppingDetailsCard: React.FC<ShoppingDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${shopColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="shopping-bag" size={20} color={shopColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            SHOPPING & SERVICES
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-gray-500 bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Store / Venue Name
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: shopColor }}>
            {data.venueName || "N/A"}
          </Text>
          {data.address ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center gap-1 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={14} color="#667085" />
              <Text className="text-base text-gray-500 underline flex-1" numberOfLines={2}>
                {data.address}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Row of details: Store Type */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Store Type
            </Text>
            <Text className="text-base font-extrabold text-gray-800 capitalize">
              {data.subType || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3 border-2 border-t-0 -mt-0.5 border-gray-500 rounded-b-3xl bg-white">
        <View className="flex-col gap-1">
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
