import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";

const TRANSPORT_MODES = [
  "Ride", "Bike", "Boat", "Bus", "Taxi", "Train", "Ferry", "Tuk-tuk", "Jeepney",
];

interface TransportationTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  onPressDate?: () => void;
  onPressTime?: () => void;
  onClearDate?: () => void;
  onClearTime?: () => void;
}

export default function TransportationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  noPadding = false,
  fieldRefs,
  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
}: TransportationTabProps) {
  const { colors } = useTheme();
  const currentMode = values.transportationDetails?.mode || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="directions-bus" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Transportation Details
        </Text>
      </View>

      {/* Mode tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Mode</Text>
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

      {/* Operator / Provider — searchable label */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.operatorProvider"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Operator / Provider"
          value={values.transportationDetails?.operatorProvider || ""}
          onChangeText={handleChange("transportationDetails.operatorProvider")}
          onBlur={handleBlur("transportationDetails.operatorProvider")}
        />
      </View>

      {/* Pickup & Drop-off */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.pickupLocation"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Pickup Location"
            value={values.transportationDetails?.pickupLocation || ""}
            onChangeText={handleChange("transportationDetails.pickupLocation")}
            onBlur={handleBlur("transportationDetails.pickupLocation")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.dropoffLocation"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Drop-off Location"
            value={values.transportationDetails?.dropoffLocation || ""}
            onChangeText={handleChange("transportationDetails.dropoffLocation")}
            onBlur={handleBlur("transportationDetails.dropoffLocation")}
          />
        </View>
      </View>

      {/* Booking Reference & Price */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
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
    </View>
  );
}
