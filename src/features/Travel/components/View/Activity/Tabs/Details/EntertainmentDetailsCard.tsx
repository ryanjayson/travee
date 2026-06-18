import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { EntertainmentDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface EntertainmentDetailsCardProps {
  data: EntertainmentDetailsDto;
}

const entColor = activityIcons.find((icon) => icon.name === ActivityType.entertainmentAndRecreation)?.color || "#7B1FA2";

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
            backgroundColor: entColor + "20",
            padding: 12,
            borderRadius: 12,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={16} color={entColor + "95"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-base font-bold"
              style={{
                color: isLink ? entColor : "#182230",
                textDecorationLine: isLink ? "underline" : "none",
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={18} color={entColor + "80"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const EntertainmentDetailsCard: React.FC<EntertainmentDetailsCardProps> = ({ data }) => {
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
    <View className="rounded-3xl mb-6 shadow-md overflow-hidden">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-gray-500 mt-2"
        style={{ backgroundColor: `${entColor}1A` }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="local-play" size={20} color={entColor} />
          <Text className="text-gray-700 font-bold text-sm tracking-wider uppercase">
            ENTERTAINMENT / LEISURE
          </Text>
        </View>
      </View>

      {/* Main Details Body */}
      <View className="p-4 border-l-2 border-r-2 border-gray-500 bg-white">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Venue Name
          </Text>
          <Text className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: entColor }}>
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

        {/* Row of details: SubType & Ticket Price */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-gray-200">
          <View className="flex-1">
            <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Type
            </Text>
            <Text className="text-base font-extrabold text-gray-800 capitalize">
              {data.subType || "N/A"}
            </Text>
          </View>
          {data.ticketPrice ? (
            <View className="flex-1 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Ticket Price
              </Text>
              <Text className="text-base font-extrabold text-emerald-600">
                {data.ticketPrice}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3 border-2 border-t-0 -mt-0.5 border-gray-500 rounded-b-3xl bg-white">
        <View className="flex-row justify-between mb-4 gap-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Booking Ref
            </Text>
            {data.bookingReference ? (
              <TouchableOpacity
                onPress={() => handleCopy(data.bookingReference || "", "Booking reference")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-gray-800">
                  {data.bookingReference}
                </Text>
                <Icon name="content-copy" size={18} color="#667085" />
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-bold text-gray-800">N/A</Text>
            )}
          </View>
        </View>

        <View className="pt-3 border-t border-gray-100">
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
