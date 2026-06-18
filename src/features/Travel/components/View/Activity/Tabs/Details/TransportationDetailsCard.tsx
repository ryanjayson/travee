import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { TransportationDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface TransportationDetailsCardProps {
  data: TransportationDetailsDto;
}

const transColor = activityIcons.find((icon) => icon.name === ActivityType.transportation)?.color || "#00BCD4";

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
        <View style={{ alignItems: "center", justifyContent: "center" }}>
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
            {isLink && <Icon name="open-in-new" size={16} color={"#005d69"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white opacity-60">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const TransportationDetailsCard: React.FC<TransportationDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied to clipboard`);
    }
  };

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Operator / Provider
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.operatorProvider || "N/A"}
          </Text>
        </View>

        {/* Mode & Price Row */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-cyan-800 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Transit Mode
            </Text>
            <Text className="text-xl font-semibold text-white/80 capitalize">
              {data.mode || "N/A"}
            </Text>
          </View>
          {data.price ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Price
              </Text>
              <Text className="text-xl font-semibold text-white/80">
                ₱{Number(data.price).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pickup Location */}
        {data.pickupLocation ? (
          <View className="mb-3 pt-3 border-t border-gray-100/10">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Pickup Point
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.pickupLocation || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="pin-drop" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.pickupLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Dropoff Location */}
        {data.dropoffLocation ? (
          <View className="mb-1 pt-3 border-t border-gray-100/10">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Dropoff Point
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.dropoffLocation || "")}`)}
              className="flex-row items-center gap-6 mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="place" size={24} color="#FFFFFF" />
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.dropoffLocation}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3">
        <View className="flex-row justify-between mb-1 gap-4">
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            onPress={data.bookingReference ? () => handleCopy(data.bookingReference || "", "Booking reference") : undefined}
          />
        </View>
      </View>
    </View>
  );
};
