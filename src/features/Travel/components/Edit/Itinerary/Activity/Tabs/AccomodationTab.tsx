import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";
import { TextInput } from "react-native-paper";

interface AccomodationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors: any;
  setShowAccomodationDatePickerFor: any;
  formatAccomodationDateTime: any;
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
  right?: React.ReactNode;
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
  right,
  onPress,
}: FloatingLabelInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const anim = useRef(new Animated.Value(value !== "" ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: (isFocused || value !== "") ? 1 : 0,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

  const animatedLabelStyle = {
    position: "absolute" as const,
    left: 16,
    color: '#98A2B3',
    top: 20,
    fontSize: 16,
    zIndex: 10,
    fontWeight: "400" as const,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -labelWidth * 0.125],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.75],
        }),
      },
    ] as any,
  };

  return (
    <View className="relative flex-1">
      <Animated.Text
        style={animatedLabelStyle}
        pointerEvents="none"
        onLayout={(e) => {
          setLabelWidth(e.nativeEvent.layout.width);
        }}
      >
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
        contentStyle={{ backgroundColor: "transparent", paddingTop: 16, textDecorationLine: "underline" }}
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

export default function AccomodationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors,
  setShowAccomodationDatePickerFor,
  formatAccomodationDateTime,
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
