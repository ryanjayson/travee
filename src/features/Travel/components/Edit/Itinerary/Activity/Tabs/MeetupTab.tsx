import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme, TextInput } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const MEETUP_TYPES = ["Casual", "Business", "Group Ride", "Club", "Event", "Tour"];

interface MeetupTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  onPressDate?: () => void;
  onPressTime?: () => void;
  onClearDate?: () => void;
  onClearTime?: () => void;
}

export default function MeetupTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
}: MeetupTabProps) {
  const { colors } = useTheme();
  const currentType = values.meetupDetails?.meetupType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="people" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Meetup Details
        </Text>
      </View>

      {/* Venue Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["meetupDetails.venueName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Venue Name"
          value={values.meetupDetails?.venueName || ""}
          onChangeText={handleChange("meetupDetails.venueName")}
          onBlur={handleBlur("meetupDetails.venueName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("entertainmentAndRecreation")}
            />
          }
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["meetupDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.meetupDetails?.address || ""}
          onChangeText={handleChange("meetupDetails.address")}
          onBlur={handleBlur("meetupDetails.address")}
        />
      </View>

      {onPressDate && onPressTime && onClearDate && onClearTime && (
        <DateTime
          startDate={values.startDate}
          startTime={values.startTime}
          onPressDate={onPressDate}
          onPressTime={onPressTime}
          onClearDate={onClearDate}
          onClearTime={onClearTime}
        />
      )}

      {/* Type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Meetup Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {MEETUP_TYPES.map((tag) => {
              const isActive = currentType === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("meetupDetails.meetupType", isActive ? null : tag)}
                  style={{
                    borderRadius: 9999,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderColor: isActive ? colors.primary : "#EAECF0",
                    backgroundColor: isActive ? `${colors.primary}15` : "#FFF",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: isActive ? "600" : "500", color: isActive ? colors.primary : "#475467" }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Host & Number of People */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["meetupDetails.hostOrOrganizer"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Host / Organizer"
            value={values.meetupDetails?.hostOrOrganizer || ""}
            onChangeText={handleChange("meetupDetails.hostOrOrganizer")}
            onBlur={handleBlur("meetupDetails.hostOrOrganizer")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["meetupDetails.numberOfPeople"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="No. of People"
            value={values.meetupDetails?.numberOfPeople || ""}
            onChangeText={handleChange("meetupDetails.numberOfPeople")}
            onBlur={handleBlur("meetupDetails.numberOfPeople")}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* RSVP Link */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["meetupDetails.rsvpLink"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="RSVP Link"
          value={values.meetupDetails?.rsvpLink || ""}
          onChangeText={handleChange("meetupDetails.rsvpLink")}
          onBlur={handleBlur("meetupDetails.rsvpLink")}
        />
      </View>
    </View>
  );
}
