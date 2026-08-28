import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";

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
  onOpenMapPinModal?: (field: string, initialValue?: string) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  onPressDate?: () => void;
  onPressTime?: () => void;
  onClearDate?: () => void;
  onClearTime?: () => void;
}

export default function EntertainmentTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  onOpenMapPinModal,
  noPadding = false,
  fieldRefs,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
}: EntertainmentTabProps) {
  const { colors } = useTheme();
  const currentSubType = values.entertainmentDetails?.subType || null;

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
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
      <View className="mb-5">
        <View className="flex-row items-center gap-2" ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.address"] = el; }}>
          <FloatingLabelInput
            label="Address"
            value={values.entertainmentDetails?.address || ""}
            onChangeText={handleChange("entertainmentDetails.address")}
            onBlur={handleBlur("entertainmentDetails.address")}
          />
          <TouchableOpacity
            onPress={() => {
              onOpenMapPinModal?.(
                "entertainmentDetails.address",
                values.entertainmentDetails?.address
              );
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Pin address on map"
          >
            <Icon name="pin-drop" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
                    borderRadius: 10,
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
          contentStyle={{ textDecorationLine: "underline" }}
          right={
            values.entertainmentDetails?.websiteAddress ? (
              <TextInput.Icon
                icon={() => (
                  <Text
                    style={{
                      color: colors?.primary || "#263F69",
                      textDecorationLine: "underline",
                      fontWeight: "bold",
                      fontSize: 14,
                      marginTop: 2,
                      opacity: 0.8,
                    }}
                  >
                    open
                  </Text>
                )}
                style={{ width: 60, height: 30, justifyContent: "center", alignItems: "center" }}
                onPress={() => {
                  let url = values.entertainmentDetails.websiteAddress;
                  if (url) {
                    if (!/^https?:\/\//i.test(url)) {
                      url = "https://" + url;
                    }
                    Linking.openURL(url).catch((err) =>
                      console.error("Failed to open URL", err)
                    );
                  }
                }}
              />
            ) : null
          }
        />
      </View>

      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Contact
        </Text>
      </View>

      {/* Contact Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.contactName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Contact Name"
          value={values.entertainmentDetails?.contactName || ""}
          onChangeText={handleChange("entertainmentDetails.contactName")}
          onBlur={handleBlur("entertainmentDetails.contactName")}
        />
      </View>

      {/* Contact Number & Email Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.contactNumber"] = el; }} className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Contact Number"
          value={values.entertainmentDetails?.contactNumber || ""}
          onChangeText={handleChange("entertainmentDetails.contactNumber")}
          onBlur={handleBlur("entertainmentDetails.contactNumber")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["entertainmentDetails.emailAddress"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Email Address"
            value={values.entertainmentDetails?.emailAddress || ""}
            onChangeText={handleChange("entertainmentDetails.emailAddress")}
            onBlur={handleBlur("entertainmentDetails.emailAddress")}
          />
        </View>
      </View>
    </View>
  );
}
