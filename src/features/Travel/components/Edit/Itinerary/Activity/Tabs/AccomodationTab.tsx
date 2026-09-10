import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, Text, Linking, ScrollView } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";
import { ActivityType } from "../../../../../../../types/enums";

export interface AccommodationTypeItem {
  label: string;
  icon: keyof typeof Icon.glyphMap;
}

const ACCOMMODATION_SUBTYPES: AccommodationTypeItem[] = [
  { label: "Hotel", icon: "hotel" },
  { label: "Resort", icon: "beach-access" },
  { label: "Hostel", icon: "single-bed" },
  { label: "Apartment", icon: "apartment" },
  { label: "Villa", icon: "villa" },
  { label: "Airbnb", icon: "home-work" },
  { label: "Guesthouse", icon: "night-shelter" },
  { label: "Motel", icon: "local-hotel" },
  { label: "Cabin", icon: "cabin" },
  { label: "Glamping", icon: "holiday-village" },
  { label: "Homestay", icon: "house" },
  { label: "Bed & Breakfast", icon: "free-breakfast" },
  { label: "Other", icon: "more-horiz" },
];

interface AccomodationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors?: any;
  setShowAccomodationDatePickerFor: any;
  formatAccomodationDateTime: any;
  onOpenPoiModal: (category: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp") => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;

  onPressDate: () => void;
  onPressTime: () => void;
  onClearDate: () => void;
  onClearTime: () => void;
  onPressEndDate?: () => void;
  onPressEndTime?: () => void;
  onClearEndDate?: () => void;
  onClearEndTime?: () => void;
  onPressLocationMap?: () => void;
}

const FloatingLabelInput = (props: any) => (
  <FloatingLabelInputAtom
    {...props}
  />
);

export default function AccomodationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors: propColors,
  setShowAccomodationDatePickerFor,
  formatAccomodationDateTime,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,

  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
  onPressEndDate,
  onPressEndTime,
  onClearEndDate,
  onClearEndTime,
  onPressLocationMap,
}: AccomodationTabProps) {
  const { colors: themeColors } = useTheme();
  const colors = propColors || themeColors;
  const currentSubType = values.accomodationDetails?.subType || null;

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5 border-l-3 border-primary pl-4">
        <Icon name="hotel" size={24} color={"#344054"} />
        <Text className="text-lg font-semibold tracking-wider uppercase text-secondary">
          Stay Details
        </Text>
      </View>


      {/* Date & Time Section */}
      <DateTime
        activityType={ActivityType.stay}
        title="Check-In Date & Time"
        startDate={values.startDate}
        startTime={values.startTime}
        endDate={values.endDate}
        endTime={values.endTime}
        onPressDate={onPressDate}
        onPressTime={onPressTime}
        onClearDate={onClearDate}
        onClearTime={onClearTime}
        onPressEndDate={onPressEndDate}
        onPressEndTime={onPressEndTime}
        onClearEndDate={onClearEndDate}
        onClearEndTime={onClearEndTime}
      />


      {/* <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Check-in/out date & time
        </Text>
      </View>
      <View className="flex-row justify-center items-center mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.checkinDateTime"] = el; }} className="flex-1 gap-4 ">
          <FloatingLabelInput
            label="Check-in"
            value={values.accomodationDetails?.checkinDateTime ? formatAccomodationDateTime(values.accomodationDetails.checkinDateTime) : ""}
            editable={false}
            right={
              values.accomodationDetails?.checkinDateTime ? (
                <TextInput.Icon
                  icon="close"
                  color="#999"
                  onPress={() => setFieldValue("accomodationDetails.checkinDateTime", null)}
                />
              ) : (
                <TextInput.Icon icon="calendar" color="#999"
                  onPress={() => setShowAccomodationDatePickerFor("checkinDateTime")} />
              )
            }
            onPress={() => setShowAccomodationDatePickerFor("checkinDateTime")}
          />
        </View>
        <Icon name="arrow-forward" size={16} color="#999" className="mt-sm" />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.checkoutDateTime"] = el; }} className="flex-1 gap-4">
          <FloatingLabelInput
            label="Check-out"
            value={values.accomodationDetails?.checkoutDateTime ? formatAccomodationDateTime(values.accomodationDetails.checkoutDateTime) : ""}
            editable={false}
            right={
              values.accomodationDetails?.checkoutDateTime ? (
                <TextInput.Icon
                  icon="close"
                  color="#999"
                  onPress={() => setFieldValue("accomodationDetails.checkoutDateTime", null)}
                />
              ) : (
                <TextInput.Icon icon="calendar" color="#999"
                  onPress={() => setShowAccomodationDatePickerFor("checkoutDateTime")} />
              )
            }
            onPress={() => setShowAccomodationDatePickerFor("checkoutDateTime")}
          />
        </View>
      </View> */}

      {/* Accommodation Type (Sub-type) */}
      <View className="mb-5">
        <Text className="text-lg text-secondary/80 font-semibold mb-2">
          Stay Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2.5 py-1">
            {ACCOMMODATION_SUBTYPES.map((item) => {
              const isSelected = currentSubType === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label} stay type`}
                  activeOpacity={0.7}
                  onPress={() =>
                    setFieldValue(
                      "accomodationDetails.subType",
                      isSelected ? null : item.label
                    )
                  }
                  style={{
                    minWidth: 84,
                    height: 94,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : "#E4E7EC",
                    backgroundColor: isSelected ? `${colors.primary}12` : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isSelected ? `${colors.primary}22` : "#F2F4F7",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={24}
                      color={isSelected ? colors.primary : "#475467"}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? colors.primary : "#344054",
                      textAlign: "center",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>


      {/* Website Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website Address"
          value={values.accomodationDetails?.websiteAddress || ""}
          onChangeText={handleChange("accomodationDetails.websiteAddress")}
          onBlur={handleBlur("accomodationDetails.websiteAddress")}
          contentStyle={{ textDecorationLine: "underline" }}
          right={
            values.accomodationDetails?.websiteAddress ? (
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
                  let url = values.accomodationDetails.websiteAddress;
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

      {/* Booking Reference & Booking Status */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.bookingReference"] = el; }} className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Booking Reference"
          value={values.accomodationDetails?.bookingReference || ""}
          onChangeText={handleChange("accomodationDetails.bookingReference")}
          onBlur={handleBlur("accomodationDetails.bookingReference")}
        />
        {/* <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.bookingStatus"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Status"
            value={values.accomodationDetails?.bookingStatus || ""}
            onChangeText={handleChange("accomodationDetails.bookingStatus")}
            onBlur={handleBlur("accomodationDetails.bookingStatus")}
          />
        </View> */}
      </View>

      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Contact
        </Text>
      </View>

      {/* Contact Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.contactName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Contact Name"
          value={values.accomodationDetails?.contactName || ""}
          onChangeText={handleChange("accomodationDetails.contactName")}
          onBlur={handleBlur("accomodationDetails.contactName")}
        />
      </View>

      {/* Contact Number & Email Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.contactNumber"] = el; }} className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Contact Number"
          value={values.accomodationDetails?.contactNumber || ""}
          onChangeText={handleChange("accomodationDetails.contactNumber")}
          onBlur={handleBlur("accomodationDetails.contactNumber")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.emailAddress"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Email Address"
            value={values.accomodationDetails?.emailAddress || ""}
            onChangeText={handleChange("accomodationDetails.emailAddress")}
            onBlur={handleBlur("accomodationDetails.emailAddress")}
          />
        </View>
      </View>
    </View>
  );
}
