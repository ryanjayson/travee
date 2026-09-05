import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

interface FlightTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  openFlightModal: any;
  setShowFlightDatePickerFor: any;
  formatFlightDateTime: any;
  handleFlightSelect: (flightData: any, setFieldValue: any) => void;
  onOpenAirportLookup?: (mode: "departure" | "arrival") => void;
  showArrivalPrefillNotice?: boolean;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  tripStartDate?: Date | string | null;
}

export default function FlightTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  openFlightModal,
  setShowFlightDatePickerFor,
  formatFlightDateTime,
  handleFlightSelect,
  onOpenAirportLookup,
  showArrivalPrefillNotice = false,
  noPadding = false,
  fieldRefs,
  tripStartDate,
}: FlightTabProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="local-airport" size={30} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Flight Details
        </Text>
      </View>


      {/* Departure Airport */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.departureAirport"] = el; }} className="mb-5 flex-row">
        <FloatingLabelInput
          label="Departure Airport"
          value={values.flightDetails?.departureAirport || ""}
          editable={false}
          onPress={() => onOpenAirportLookup?.("departure")}
          right={
            values.flightDetails?.departureAirport ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.departureAirport", "")}
              />
            ) : (
              <TextInput.Icon
                icon="airplane-takeoff"
                color="#999"
                onPress={() => onOpenAirportLookup?.("departure")}
              />
            )
          }
        />
      </View>

      {/* Departure Date & Time */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.departureDate"] = el; }} className="flex-row gap-4 mb-5">
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

      <View className="items-center justify-center mb-5">
        <Icon name="arrow-downward" size={24} color={colors.primary} />
      </View>

      {/* Arrival Airport */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.arrivalAirport"] = el; }} className="mb-5 flex-row">
        <FloatingLabelInput
          label="Arrival Airport"
          value={values.flightDetails?.arrivalAirport || ""}
          editable={false}
          onPress={() => onOpenAirportLookup?.("arrival")}
          right={
            values.flightDetails?.arrivalAirport ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.arrivalAirport", "")}
              />
            ) : (
              <TextInput.Icon
                icon="airplane-landing"
                color="#999"
                onPress={() => onOpenAirportLookup?.("arrival")}
              />
            )
          }
        />
      </View>

      {/* Arrival Date & Time */}
      <View
        ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.arrivalDate"] = el; }}
        className="flex-col mb-10"
      >
        <View className="flex-row gap-4">
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
        <Text className={`text-xs text-[#DC6803] mt-1 ml-2 font-medium ${showArrivalPrefillNotice ? "" : "hidden"}`}>
          Please check the actual date of your flight arrival and update accordingly.
        </Text>
      </View>

      {/* Flight Number & Airline */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.flightNumber"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Flight Number"
          value={values.flightDetails?.flightNumber || ""}
          onChangeText={handleChange("flightDetails.flightNumber")}
          onBlur={handleBlur("flightDetails.flightNumber")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.airline"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Airline"
            value={values.flightDetails?.airline || ""}
            onChangeText={handleChange("flightDetails.airline")}
            onBlur={handleBlur("flightDetails.airline")}
          />
        </View>
      </View>

      {/* Gate & Terminal */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.gate"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Gate"
          value={values.flightDetails?.gate || ""}
          onChangeText={handleChange("flightDetails.gate")}
          onBlur={handleBlur("flightDetails.gate")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.terminal"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Terminal"
            value={values.flightDetails?.terminal || ""}
            onChangeText={handleChange("flightDetails.terminal")}
            onBlur={handleBlur("flightDetails.terminal")}
          />
        </View>
      </View>

      {/* Seat Number & Booking Reference */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.seatNumber"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Seat Number"
          value={values.flightDetails?.seatNumber || ""}
          onChangeText={handleChange("flightDetails.seatNumber")}
          onBlur={handleBlur("flightDetails.seatNumber")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.flightDetails?.bookingReference || ""}
            onChangeText={handleChange("flightDetails.bookingReference")}
            onBlur={handleBlur("flightDetails.bookingReference")}
          />
        </View>
      </View>

      {/* Price */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.price"] = el; }} className="mb-5">
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
