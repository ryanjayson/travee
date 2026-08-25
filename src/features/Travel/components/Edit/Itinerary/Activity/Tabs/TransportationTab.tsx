import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";

const TRANSPORT_MODES = [
  "Train", "Bus", "Ferry", "Subway", "Taxi", "Rideshare", "Car", "Shuttle", "Boat", "Tram", "Cable Car",
];

interface TransportationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors?: any;
  setShowTransportationDatePickerFor?: (field: "departureDateTime" | "arrivalDateTime" | null) => void;
  formatTransportationDateTime?: (dateVal: any) => string;
  onOpenPoiModal?: (category: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp") => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

const FloatingLabelInput = (props: any) => (
  <FloatingLabelInputAtom {...props} />
);

export default function TransportationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors: propColors,
  setShowTransportationDatePickerFor,
  formatTransportationDateTime,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: TransportationTabProps) {
  const paperTheme = useTheme();
  const colors = propColors || paperTheme.colors;
  const currentMode = values.transportationDetails?.mode || null;

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="directions-bus" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Transportation Details
        </Text>
      </View>



      {/* Operator / Provider */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.operatorProvider"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Operator / Provider"
          value={values.transportationDetails?.operatorProvider || ""}
          onChangeText={handleChange("transportationDetails.operatorProvider")}
          onBlur={handleBlur("transportationDetails.operatorProvider")}
        />
      </View>

      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Pickup - drop-off Location
        </Text>
      </View>
      {/* Pickup Location */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.pickupLocation"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Pickup / Departure"
          value={values.transportationDetails?.pickupLocation || ""}
          onChangeText={handleChange("transportationDetails.pickupLocation")}
          onBlur={handleBlur("transportationDetails.pickupLocation")}
        />
      </View>

      {/* Drop-off Location */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.dropoffLocation"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Drop-off / Arrival"
          value={values.transportationDetails?.dropoffLocation || ""}
          onChangeText={handleChange("transportationDetails.dropoffLocation")}
          onBlur={handleBlur("transportationDetails.dropoffLocation")}
        />
      </View>


      {/* Departure / Arrival Date & Time */}
      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Departure / Arrival Date & Time
        </Text>
      </View>
      <View className="flex-row justify-center items-center mb-10">
        {/* Departure Date & Time */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.departureDateTime"] = el; }} className="flex-1 gap-4">
          <FloatingLabelInput
            label="Departure"
            value={
              values.transportationDetails?.departureDateTime && formatTransportationDateTime
                ? formatTransportationDateTime(values.transportationDetails.departureDateTime)
                : ""
            }
            editable={false}
            right={
              values.transportationDetails?.departureDateTime ? (
                <TextInput.Icon
                  icon="close"
                  color="#999"
                  onPress={() => setFieldValue("transportationDetails.departureDateTime", null)}
                />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
            onPress={() => setShowTransportationDatePickerFor?.("departureDateTime")}
          />
        </View>
        <Icon name="arrow-forward" size={16} color="#999" className="mt-sm mx-1" />
        {/* Arrival Date & Time */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.arrivalDateTime"] = el; }} className="flex-1 gap-4">
          <FloatingLabelInput
            label="Arrival"
            value={
              values.transportationDetails?.arrivalDateTime && formatTransportationDateTime
                ? formatTransportationDateTime(values.transportationDetails.arrivalDateTime)
                : ""
            }
            editable={false}
            right={
              values.transportationDetails?.arrivalDateTime ? (
                <TextInput.Icon
                  icon="close"
                  color="#999"
                  onPress={() => setFieldValue("transportationDetails.arrivalDateTime", null)}
                />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
            onPress={() => setShowTransportationDatePickerFor?.("arrivalDateTime")}
          />
        </View>
      </View>

      {/* Transportation Mode Chips */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Transit Mode</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {TRANSPORT_MODES.map((tag) => {
              const isActive = currentMode === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("transportationDetails.mode", isActive ? null : tag)}
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

      {/* Seat / Coach / Vehicle Number & Booking Reference */}
      <View className="mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.seatOrVehicleNumber"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Seat / Coach / Vehicle #"
            value={values.transportationDetails?.seatOrVehicleNumber || ""}
            onChangeText={handleChange("transportationDetails.seatOrVehicleNumber")}
            onBlur={handleBlur("transportationDetails.seatOrVehicleNumber")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.bookingReference"] = el; }} style={{ flex: 1 }}>

        </View>
      </View>

      {/* Booking Status & Price */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.bookingStatus"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.transportationDetails?.bookingReference || ""}
            onChangeText={handleChange("transportationDetails.bookingReference")}
            onBlur={handleBlur("transportationDetails.bookingReference")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.price"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Price"
            value={values.transportationDetails?.price || ""}
            onChangeText={handleChange("transportationDetails.price")}
            onBlur={handleBlur("transportationDetails.price")}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Website Address / Ticket Link */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website Address / Ticket Link"
          value={values.transportationDetails?.websiteAddress || ""}
          onChangeText={handleChange("transportationDetails.websiteAddress")}
          onBlur={handleBlur("transportationDetails.websiteAddress")}
          contentStyle={{ textDecorationLine: "underline" }}
          right={
            values.transportationDetails?.websiteAddress ? (
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
                  let url = values.transportationDetails.websiteAddress;
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

      {/* Contact Number */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.contactNumber"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Contact Number"
          value={values.transportationDetails?.contactNumber || ""}
          onChangeText={handleChange("transportationDetails.contactNumber")}
          onBlur={handleBlur("transportationDetails.contactNumber")}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );
}
