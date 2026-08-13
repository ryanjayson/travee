import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { MeetupDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";

interface MeetupDetailsCardProps {
  data: MeetupDetailsDto;
}

// const meetupColor = activityIcons.find((icon) => icon.name === (ActivityType as any).meetup)?.color || "#26A69A";

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";

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
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.venueName}
          />
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
