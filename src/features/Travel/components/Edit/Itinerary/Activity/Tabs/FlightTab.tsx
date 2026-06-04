import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";
import { TextInput } from "react-native-paper";

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

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: (e: any) => void;
  onFocus?: () => void;
  keyboardType?: "default" | "numeric";
  editable?: boolean;
  placeholder?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  contentStyle?: any;
  onPress?: () => void;
}

const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  keyboardType = "default",
  editable = true,
  placeholder,
  left,
  right,
  contentStyle,
  onPress,
}: FloatingLabelInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const anim = useRef(new Animated.Value(value !== "" ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: (isFocused || value !== "") ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const animatedLabelStyle = {
    position: "absolute" as const,
    left: left ? 58 : 16,
    color: '#98A2B3',
    top: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 12],
    }),
    fontSize: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    zIndex: 10,
    fontWeight: "500" as const,
  };

  return (
    <View className="relative flex-1">
      <Animated.Text style={animatedLabelStyle} pointerEvents="none">
        {label}
      </Animated.Text>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        outlineColor="#E0E0E0"
        activeOutlineColor="#263F69"
        theme={{ colors: { onSurfaceVariant: '#98A2B3' } }}
        outlineStyle={{ borderWidth: 1, backgroundColor: "#FFF", borderRadius: 16 }}
        style={{ height: 64 }}
        contentStyle={contentStyle || { backgroundColor: "transparent", paddingTop: 16 }}
        left={left}
        right={right}
      />
      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: right ? 50 : 0, zIndex: 20 }}
          accessibilityRole="button"
          accessibilityLabel={`Open selector for ${label}`}
        />
      )}
    </View>
  );
};

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
          // placeholder="e.g. Singapore Changi (SIN)"
          value={values.flightDetails?.departureAirport || ""}
          onChangeText={handleChange("flightDetails.departureAirport")}
          onBlur={handleBlur("flightDetails.departureAirport")}
        />
      </View>

      {/* Departure Date & Time */}
      <View className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Departure Date & Time"
          // placeholder="Select date & time"
          value={values.flightDetails?.departureDate ? formatFlightDateTime(values.flightDetails.departureDate) : ""}
          editable={false}
          left={<TextInput.Icon icon="calendar" color="#999" className="pt-xl mr-0" />}
          contentStyle={{ backgroundColor: "transparent", paddingTop: 16, marginLeft: 42 }}
          right={
            values.flightDetails?.departureDate ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.departureDate", null)}
              />
            ) : null
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
          // placeholder="e.g. London Heathrow (LHR)"
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
          left={<TextInput.Icon icon="calendar" color="#999" className="pt-xl mr-0" />}
          contentStyle={{ backgroundColor: "transparent", paddingTop: 16, marginLeft: 42 }}
          right={
            values.flightDetails?.arrivalDate ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.arrivalDate", null)}
              />
            ) : null
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
