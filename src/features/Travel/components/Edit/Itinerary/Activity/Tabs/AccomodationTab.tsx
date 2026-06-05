import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, Text, Linking } from "react-native";
import { TextInput } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";

interface AccomodationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors: any;
  setShowAccomodationDatePickerFor: any;
  formatAccomodationDateTime: any;
  onOpenPoiModal: (category: "accommodation" | "cafeRestaurant" | "attraction") => void;
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
  colors,
  setShowAccomodationDatePickerFor,
  formatAccomodationDateTime,
  onOpenPoiModal,
}: AccomodationTabProps) {
  return (
    <View className="flex-1 pb-6 pt-2 px-5">
      {/* Accomodation Name */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Accomodation Name"
          value={values.accomodationDetails?.accomodationName || ""}
          onChangeText={handleChange("accomodationDetails.accomodationName")}
          onBlur={handleBlur("accomodationDetails.accomodationName")}
          onPress={() => onOpenPoiModal("accommodation")}
        />
      </View>

      {/* Address */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.accomodationDetails?.address || ""}
          onChangeText={handleChange("accomodationDetails.address")}
          onBlur={handleBlur("accomodationDetails.address")}
        />
      </View>

      {/* Check-in Date & Time */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Check-in Date & Time"
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
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowAccomodationDatePickerFor("checkinDateTime")}
        />
      </View>

      {/* Check-out Date & Time */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Check-out Date & Time"
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
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowAccomodationDatePickerFor("checkoutDateTime")}
        />
      </View>

      {/* Website Address */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Website Address"
          value={values.accomodationDetails?.websiteAddress || ""}
          onChangeText={handleChange("accomodationDetails.websiteAddress")}
          onBlur={handleBlur("accomodationDetails.websiteAddress")}
          contentStyle={{ textDecorationLine: "underline" }}
          right={
            values.accomodationDetails?.websiteAddress ? (
              <TouchableOpacity
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
                accessibilityRole="button"
                accessibilityLabel="Open website in browser"
                style={{
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingRight: 16,
                  paddingTop: 16,
                }}
              >
                <Text
                  style={{
                    color: colors?.primary || "#263F69",
                    textDecorationLine: "underline",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Open
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {/* Booking Reference & Booking Status */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Booking Reference"
          value={values.accomodationDetails?.bookingReference || ""}
          onChangeText={handleChange("accomodationDetails.bookingReference")}
          onBlur={handleBlur("accomodationDetails.bookingReference")}
        />
        <FloatingLabelInput
          label="Booking Status"
          value={values.accomodationDetails?.bookingStatus || ""}
          onChangeText={handleChange("accomodationDetails.bookingStatus")}
          onBlur={handleBlur("accomodationDetails.bookingStatus")}
        />
      </View>

      {/* Contact Name */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Contact Name"
          value={values.accomodationDetails?.contactName || ""}
          onChangeText={handleChange("accomodationDetails.contactName")}
          onBlur={handleBlur("accomodationDetails.contactName")}
        />
      </View>

      {/* Contact Number & Email Address */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Contact Number"
          value={values.accomodationDetails?.contactNumber || ""}
          onChangeText={handleChange("accomodationDetails.contactNumber")}
          onBlur={handleBlur("accomodationDetails.contactNumber")}
        />
        <FloatingLabelInput
          label="Email Address"
          value={values.accomodationDetails?.emailAddress || ""}
          onChangeText={handleChange("accomodationDetails.emailAddress")}
          onBlur={handleBlur("accomodationDetails.emailAddress")}
        />
      </View>
    </View>
  );
}
