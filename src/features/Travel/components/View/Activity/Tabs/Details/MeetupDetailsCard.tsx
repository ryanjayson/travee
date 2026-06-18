import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { MeetupDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface MeetupDetailsCardProps {
  data: MeetupDetailsDto;
}

const meetupColor = activityIcons.find((icon) => icon.name === ActivityType.meetup)?.color || "#26A69A";

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
            {isLink && <Icon name="open-in-new" size={16} color={"#005d54"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white opacity-60">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const MeetupDetailsCard: React.FC<MeetupDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Venue Name
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.venueName || "N/A"}
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

        {/* Row of details: Meetup Type & People count */}
        <View className="flex-row items-center justify-between pt-4 border-t border-dashed border-teal-900">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Meetup Type
            </Text>
            <Text className="text-xl font-semibold text-white/80 capitalize">
              {data.meetupType || "N/A"}
            </Text>
          </View>
          {data.numberOfPeople ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Attendees
              </Text>
              <Text className="text-xl font-semibold text-white/80">
                {data.numberOfPeople}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Stub Area */}
      <View className="p-5 pt-3">
        <View className="flex-col gap-1">
          <Field label="Host / Organizer" value={data.hostOrOrganizer} icon="person" />
          <Field
            label="RSVP Link"
            value={data.rsvpLink}
            icon="insert-link"
            isLink
            onPress={data.rsvpLink ? () => handleOpenLink(data.rsvpLink!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
