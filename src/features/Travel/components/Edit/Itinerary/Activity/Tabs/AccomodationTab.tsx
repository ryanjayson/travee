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
  onOpenPoiModal: (category: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp") => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
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
  noPadding = false,
  fieldRefs,
}: AccomodationTabProps) {
  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="hotel" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Accommodation Details
        </Text>
       </View>
      {/* Accomodation Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.accomodationName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Accomodation Name"   
          value={values.accomodationDetails?.accomodationName || ""}
          onChangeText={handleChange("accomodationDetails.accomodationName")}
          onBlur={handleBlur("accomodationDetails.accomodationName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("accommodation")}
            />
          }
        />
      </View>
 
      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.accomodationDetails?.address || ""}
          onChangeText={handleChange("accomodationDetails.address")}
          onBlur={handleBlur("accomodationDetails.address")}
        />
      </View>
 

 <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Check-in/out date & time
        </Text>
       </View>
 <View className="flex-row justify-center items-center mb-5">
{/* Check-in Date & Time */}
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
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowAccomodationDatePickerFor("checkinDateTime")}
        />
      </View>
      <Icon name="arrow-forward" size={16} color="#999" className="mt-sm" />
      {/* Check-out Date & Time */}
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
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowAccomodationDatePickerFor("checkoutDateTime")}
        />
      </View>
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
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["accomodationDetails.bookingStatus"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Status"
            value={values.accomodationDetails?.bookingStatus || ""}
            onChangeText={handleChange("accomodationDetails.bookingStatus")}
            onBlur={handleBlur("accomodationDetails.bookingStatus")}
          />
        </View>
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
