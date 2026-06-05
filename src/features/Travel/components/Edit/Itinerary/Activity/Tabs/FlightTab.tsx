import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { TextInput } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

interface FlightTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors: any;
  openFlightModal: any;
  setShowFlightDatePickerFor: any;
  formatFlightDateTime: any;
  handleFlightSelect: (flightData: any, setFieldValue: any) => void;
}

export default function FlightTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors,
  openFlightModal,
  setShowFlightDatePickerFor,
  formatFlightDateTime,
  handleFlightSelect,
}: FlightTabProps) {
  return (
    <View className="flex-1 pb-6 pt-2 px-5">
      <TouchableOpacity
        onPress={() => {
          openFlightModal((flightData: any) => {
            handleFlightSelect(flightData, setFieldValue);
          });
        }}
        className="mb-10 mt-3 p-4 rounded-2xl border border-dashed border-[#263F69] bg-blue-50/50 flex-row items-center gap-3 active:bg-blue-50"
        accessibilityRole="button"
        accessibilityLabel="Search airport and fill flight details"
      >
        <Icon name="local-airport" size={26} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">
            Search for Airport
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Lookup airports worldwide to populate dates and destination.
          </Text>
        </View>
        <Icon name="search" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Departure Airport */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Departure Airport"
          value={values.flightDetails?.departureAirport || ""}
          onChangeText={handleChange("flightDetails.departureAirport")}
          onBlur={handleBlur("flightDetails.departureAirport")}
        />
      </View>

      {/* Departure Date & Time */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Departure Date & Time"
          value={values.flightDetails?.departureDate ? formatFlightDateTime(values.flightDetails.departureDate) : ""}
          editable={false}
          right={
            values.flightDetails?.departureDate ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.departureDate", null)}
              />
            ) : (
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowFlightDatePickerFor("departureDate")}
        />
      </View>

      <View className="flex-1 items-center justify-center mb-5 ">
        <Icon name="arrow-downward" size={24} color="#263F69"/>
      </View>

      {/* Arrival Airport */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Arrival Airport"
          value={values.flightDetails?.arrivalAirport || ""}
          onChangeText={handleChange("flightDetails.arrivalAirport")}
          onBlur={handleBlur("flightDetails.arrivalAirport")}
        />
      </View>

      {/* Arrival Date & Time */}
      <View className="flex-row gap-4 mb-10">
        <FloatingLabelInput
          label="Arrival Date & Time"
          value={values.flightDetails?.arrivalDate ? formatFlightDateTime(values.flightDetails.arrivalDate) : ""}
          editable={false}
          right={
            values.flightDetails?.arrivalDate ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.arrivalDate", null)}
              />
            ) : (
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowFlightDatePickerFor("arrivalDate")}
        />
      </View>

      {/* Flight Number & Airline */}
      <View className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Flight Number"
          value={values.flightDetails?.flightNumber || ""}
          onChangeText={handleChange("flightDetails.flightNumber")}
          onBlur={handleBlur("flightDetails.flightNumber")}
        />
        <FloatingLabelInput
          label="Airline"
          value={values.flightDetails?.airline || ""}
          onChangeText={handleChange("flightDetails.airline")}
          onBlur={handleBlur("flightDetails.airline")}
        />
      </View>

      {/* Gate & Terminal */}
      <View className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Gate"
          value={values.flightDetails?.gate || ""}
          onChangeText={handleChange("flightDetails.gate")}
          onBlur={handleBlur("flightDetails.gate")}
        />
        <FloatingLabelInput
          label="Terminal"
          value={values.flightDetails?.terminal || ""}
          onChangeText={handleChange("flightDetails.terminal")}
          onBlur={handleBlur("flightDetails.terminal")}
        />
      </View>

      {/* Seat Number & Booking Reference */}
      <View className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Seat Number"
          value={values.flightDetails?.seatNumber || ""}
          onChangeText={handleChange("flightDetails.seatNumber")}
          onBlur={handleBlur("flightDetails.seatNumber")}
        />
        <FloatingLabelInput
          label="Booking Reference"
          value={values.flightDetails?.bookingReference || ""}
          onChangeText={handleChange("flightDetails.bookingReference")}
          onBlur={handleBlur("flightDetails.bookingReference")}
        />
      </View>

      {/* Price */}
      <View className="mb-5">
        <FloatingLabelInput
          label="Price"
          keyboardType="numeric"
          value={values.flightDetails?.price != null ? String(values.flightDetails.price) : ""}
          onChangeText={handleChange("flightDetails.price")}
          onBlur={handleBlur("flightDetails.price")}
        />
      </View>
    </View>
  );
}
