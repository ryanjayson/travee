import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const VEHICLE_TYPES = ["Car", "Motorbike", "Motorcycle", "Bike", "RV", "Yacht", "Boat"];

interface RideRentalTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  formatDateTime: (val: any) => string;
  onOpenRentalStartPicker: () => void;
  onOpenRentalEndPicker: () => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function RideRentalTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  formatDateTime,
  onOpenRentalStartPicker,
  onOpenRentalEndPicker,
  noPadding = false,
  fieldRefs,
}: RideRentalTabProps) {
  const { colors } = useTheme();
  const currentVehicle = values.rideRentalDetails?.vehicleType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="directions-car" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Ride Rental Details
        </Text>
      </View>

      {/* Provider Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.providerName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Rental Provider"
          value={values.rideRentalDetails?.providerName || ""}
          onChangeText={handleChange("rideRentalDetails.providerName")}
          onBlur={handleBlur("rideRentalDetails.providerName")}
          onPress={() => onOpenPoiModal("shopppingAndService")}
          right={<TextInput.Icon icon="map-marker-radius-outline" color="#999" />}
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.rideRentalDetails?.address || ""}
          onChangeText={handleChange("rideRentalDetails.address")}
          onBlur={handleBlur("rideRentalDetails.address")}
        />
      </View>

      {/* Vehicle type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Vehicle Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {VEHICLE_TYPES.map((tag) => {
              const isActive = currentVehicle === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("rideRentalDetails.vehicleType", isActive ? null : tag)}
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

      {/* Pickup & Drop-off */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.pickupLocation"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Pickup Location"
            value={values.rideRentalDetails?.pickupLocation || ""}
            onChangeText={handleChange("rideRentalDetails.pickupLocation")}
            onBlur={handleBlur("rideRentalDetails.pickupLocation")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.dropoffLocation"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Drop-off Location"
            value={values.rideRentalDetails?.dropoffLocation || ""}
            onChangeText={handleChange("rideRentalDetails.dropoffLocation")}
            onBlur={handleBlur("rideRentalDetails.dropoffLocation")}
          />
        </View>
      </View>

      {/* Rental Start & End Date/Time */}
      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">Rental Period</Text>
      </View>
      <View className="flex-row items-center mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.rentalStartDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Start"
            value={values.rideRentalDetails?.rentalStartDateTime ? formatDateTime(values.rideRentalDetails.rentalStartDateTime) : ""}
            editable={false}
            onPress={onOpenRentalStartPicker}
            right={
              values.rideRentalDetails?.rentalStartDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("rideRentalDetails.rentalStartDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
          />
        </View>
        <Icon name="arrow-forward" size={16} color="#999" style={{ marginHorizontal: 4 }} />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.rentalEndDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="End"
            value={values.rideRentalDetails?.rentalEndDateTime ? formatDateTime(values.rideRentalDetails.rentalEndDateTime) : ""}
            editable={false}
            onPress={onOpenRentalEndPicker}
            right={
              values.rideRentalDetails?.rentalEndDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("rideRentalDetails.rentalEndDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
          />
        </View>
      </View>

      {/* Booking Reference & Price */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.rideRentalDetails?.bookingReference || ""}
            onChangeText={handleChange("rideRentalDetails.bookingReference")}
            onBlur={handleBlur("rideRentalDetails.bookingReference")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.price"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Price"
            value={values.rideRentalDetails?.price || ""}
            onChangeText={handleChange("rideRentalDetails.price")}
            onBlur={handleBlur("rideRentalDetails.price")}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );
}
