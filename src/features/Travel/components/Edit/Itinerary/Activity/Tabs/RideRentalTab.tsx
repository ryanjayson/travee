import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const VEHICLE_TYPES = ["Car", "Motorbike", "Motorcycle", "Scooter", "Bicycle", "RV / Camper", "Yacht", "Boat"];

interface RideRentalTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors?: any;
  onOpenPoiModal?: (category: PoiCategory) => void;
  onOpenMapPinModal?: (field: string, initialValue?: string) => void;
  formatDateTime?: (val: any) => string;
  onOpenRentalStartPicker?: () => void;
  onOpenRentalEndPicker?: () => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

const FloatingLabelInput = (props: any) => (
  <FloatingLabelInputAtom {...props} />
);

export default function RideRentalTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors: propColors,
  onOpenPoiModal,
  onOpenMapPinModal,
  formatDateTime,
  onOpenRentalStartPicker,
  onOpenRentalEndPicker,
  noPadding = false,
  fieldRefs,
}: RideRentalTabProps) {
  const paperTheme = useTheme();
  const colors = propColors || paperTheme.colors;
  const currentVehicle = values.rideRentalDetails?.vehicleType || null;

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="directions-car" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Rental Details
        </Text>
      </View>

      {/* Provider Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.providerName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Rental Provider"
          value={values.rideRentalDetails?.providerName || ""}
          onChangeText={handleChange("rideRentalDetails.providerName")}
          onBlur={handleBlur("rideRentalDetails.providerName")}
          right={
            onOpenPoiModal ? (
              <TextInput.Icon
                style={{ backgroundColor: "#F2F4F7" }}
                icon="map-marker-radius-outline"
                color="#263f69"
                onPress={() => onOpenPoiModal("shopppingAndService")}
              />
            ) : null
          }
        />
      </View>


      {/* Pickup & Drop-off */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2" ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.pickupLocation"] = el; }}>
          <FloatingLabelInput
            label="Pickup Location"
            value={values.rideRentalDetails?.pickupLocation || ""}
            onChangeText={handleChange("rideRentalDetails.pickupLocation")}
            onBlur={handleBlur("rideRentalDetails.pickupLocation")}
          />
          <TouchableOpacity
            onPress={() => {
              onOpenMapPinModal?.(
                "rideRentalDetails.pickupLocation",
                values.rideRentalDetails?.pickupLocation
              );
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Pin pickup location on map"
          >
            <Icon name="pin-drop" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-5">
        <View className="flex-row items-center gap-2" ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.dropoffLocation"] = el; }}>
          <FloatingLabelInput
            label="Drop-off Location"
            value={values.rideRentalDetails?.dropoffLocation || ""}
            onChangeText={handleChange("rideRentalDetails.dropoffLocation")}
            onBlur={handleBlur("rideRentalDetails.dropoffLocation")}
          />

          <TouchableOpacity
            onPress={() => {
              onOpenMapPinModal?.(
                "rideRentalDetails.dropoffLocation",
                values.rideRentalDetails?.dropoffLocation
              );
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Pin drop-off location on map"
          >
            <Icon name="pin-drop" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View className=" items-start justify-start"
          style={{ opacity: values?.rideRentalDetails?.address ? 1 : 0.3 }}>
          <TouchableOpacity
            onPress={() => {
              setFieldValue("rideRentalDetails.dropoffLocation", values.rideRentalDetails?.pickupLocation || "");
            }}
            accessibilityRole="button"
            accessibilityLabel=" Same with Pickup Address"
          >
            <Text style={{ color: colors.primary }} className="text-sm underline">
              Same with Pickup Address
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Vehicle Model / Details */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.vehicleModel"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Vehicle Model / Make"
          value={values.rideRentalDetails?.vehicleModel || ""}
          onChangeText={handleChange("rideRentalDetails.vehicleModel")}
          onBlur={handleBlur("rideRentalDetails.vehicleModel")}
        />
      </View>

      {/* Rental Period (Start & End Date/Time) */}
      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">Rental Period</Text>
      </View>
      <View className="flex-row items-center mb-10">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.rentalStartDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Start"
            value={values.rideRentalDetails?.rentalStartDateTime && formatDateTime ? formatDateTime(values.rideRentalDetails.rentalStartDateTime) : ""}
            editable={false}
            onPress={onOpenRentalStartPicker}
            right={
              values.rideRentalDetails?.rentalStartDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("rideRentalDetails.rentalStartDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" onPress={onOpenRentalStartPicker} />
              )
            }
          />
        </View>
        <Icon name="arrow-forward" size={16} color="#999" style={{ marginHorizontal: 4 }} />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.rentalEndDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="End"
            value={values.rideRentalDetails?.rentalEndDateTime && formatDateTime ? formatDateTime(values.rideRentalDetails.rentalEndDateTime) : ""}
            editable={false}
            onPress={onOpenRentalEndPicker}
            right={
              values.rideRentalDetails?.rentalEndDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("rideRentalDetails.rentalEndDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" onPress={onOpenRentalEndPicker} />
              )
            }
          />
        </View>
      </View>

      {/* Booking Reference & Booking Status */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.rideRentalDetails?.bookingReference || ""}
            onChangeText={handleChange("rideRentalDetails.bookingReference")}
            onBlur={handleBlur("rideRentalDetails.bookingReference")}
          />
        </View>
        {/* <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.bookingStatus"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Status"
            value={values.rideRentalDetails?.bookingStatus || ""}
            onChangeText={handleChange("rideRentalDetails.bookingStatus")}
            onBlur={handleBlur("rideRentalDetails.bookingStatus")}
          />
        </View> */}
      </View>

      {/* Price & Website Link */}
      <View className="flex-row gap-4 mb-5">
        {/* <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.price"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Price"
            value={values.rideRentalDetails?.price || ""}
            onChangeText={handleChange("rideRentalDetails.price")}
            onBlur={handleBlur("rideRentalDetails.price")}
            keyboardType="numeric"
          />
        </View> */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.websiteAddress"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Website / Link"
            value={values.rideRentalDetails?.websiteAddress || ""}
            onChangeText={handleChange("rideRentalDetails.websiteAddress")}
            onBlur={handleBlur("rideRentalDetails.websiteAddress")}
            contentStyle={{ textDecorationLine: "underline" }}
            right={
              values.rideRentalDetails?.websiteAddress ? (
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
                    let url = values.rideRentalDetails.websiteAddress;
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
      </View>

      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase">
          Contact
        </Text>
      </View>

      {/* Contact Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.contactName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Contact Name"
          value={values.rideRentalDetails?.contactName || ""}
          onChangeText={handleChange("rideRentalDetails.contactName")}
          onBlur={handleBlur("rideRentalDetails.contactName")}
        />
      </View>

      {/* Contact Number & Email Address */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.contactNumber"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Contact Number"
            value={values.rideRentalDetails?.contactNumber || ""}
            onChangeText={handleChange("rideRentalDetails.contactNumber")}
            onBlur={handleBlur("rideRentalDetails.contactNumber")}
            keyboardType="phone-pad"
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.emailAddress"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Email Address"
            value={values.rideRentalDetails?.emailAddress || ""}
            onChangeText={handleChange("rideRentalDetails.emailAddress")}
            onBlur={handleBlur("rideRentalDetails.emailAddress")}
            keyboardType="email-address"
          />
        </View>
      </View>
    </View>
  );
}
