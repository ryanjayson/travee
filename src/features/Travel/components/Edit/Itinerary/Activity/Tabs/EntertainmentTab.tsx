import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const ENTERTAINMENT_SUBTYPES = [
  "Park", "Museum", "Gym", "Cinema", "Stadium", "Zoo", "Concert", "Theme Park",
];

interface EntertainmentTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function EntertainmentTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: EntertainmentTabProps) {
  const { colors } = useTheme();
  const currentSubType = values.entertainmentDetails?.subType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="local-play" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Entertainment Details
        </Text>
      </View>

      {/* Venue Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.venueName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Venue Name"
          value={values.entertainmentDetails?.venueName || ""}
          onChangeText={handleChange("entertainmentDetails.venueName")}
          onBlur={handleBlur("entertainmentDetails.venueName")}
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
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.entertainmentDetails?.address || ""}
          onChangeText={handleChange("entertainmentDetails.address")}
          onBlur={handleBlur("entertainmentDetails.address")}
        />
      </View>

      {/* Sub-type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {ENTERTAINMENT_SUBTYPES.map((tag) => {
              const isActive = currentSubType === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("entertainmentDetails.subType", isActive ? null : tag)}
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

      {/* Ticket Price & Booking Reference */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.ticketPrice"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Ticket Price"
            value={values.entertainmentDetails?.ticketPrice || ""}
            onChangeText={handleChange("entertainmentDetails.ticketPrice")}
            onBlur={handleBlur("entertainmentDetails.ticketPrice")}
            keyboardType="numeric"
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.entertainmentDetails?.bookingReference || ""}
            onChangeText={handleChange("entertainmentDetails.bookingReference")}
            onBlur={handleBlur("entertainmentDetails.bookingReference")}
          />
        </View>
      </View>

      {/* Website */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website"
          value={values.entertainmentDetails?.websiteAddress || ""}
          onChangeText={handleChange("entertainmentDetails.websiteAddress")}
          onBlur={handleBlur("entertainmentDetails.websiteAddress")}
        />
      </View>
    </View>
  );
}
