import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";
import { ActivityType } from "../../../../../../../types/enums";
import { activityIcons } from "../../../../../../../components/ActivityIcon";

export interface VehicleTypeItem {
  label: string;
  icon: keyof typeof Icon.glyphMap;
}

const VEHICLE_TYPES: VehicleTypeItem[] = [
  { label: "Car", icon: "directions-car" },
  { label: "Motorbike", icon: "two-wheeler" },
  { label: "Motorcycle", icon: "motorcycle" },
  { label: "Scooter", icon: "moped" },
  { label: "Bicycle", icon: "pedal-bike" },
  { label: "RV / Camper", icon: "rv-hookup" },
  { label: "Yacht", icon: "sailing" },
  { label: "Boat", icon: "directions-boat" },
];

interface RideRentalTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  colors?: any;
  onOpenPoiModal?: (category: "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp") => void;
  onOpenMapPinModal?: (field: string, initialValue?: string) => void;
  onOpenGoogleSearch?: (target: "providerName" | "pickupLocation" | "dropoffLocation") => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;

  // DateTime handlers
  onPressDate?: () => void;
  onPressTime?: () => void;
  onClearDate?: () => void;
  onClearTime?: () => void;
  onPressEndDate?: () => void;
  onPressEndTime?: () => void;
  onClearEndDate?: () => void;
  onClearEndTime?: () => void;
}

const FloatingLabelInput = (props: any) => (
  <FloatingLabelInputAtom {...props} />
);

const getLocationTitle = (loc?: any): string => {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  return loc.name || loc.city || "";
};

const getLocationSubtitle = (loc?: any): string => {
  if (!loc) return "";
  if (typeof loc === "string") return "";
  return loc.city && loc.city !== loc.name ? loc.city : loc.country || "";
};

export default function RideRentalTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors: propColors,
  onOpenPoiModal,
  onOpenMapPinModal,
  onOpenGoogleSearch,
  noPadding = false,
  fieldRefs,

  onPressDate,
  onPressTime,
  onClearDate,
  onClearTime,
  onPressEndDate,
  onPressEndTime,
  onClearEndDate,
  onClearEndTime,
}: RideRentalTabProps) {
  const paperTheme = useTheme();
  const colors = propColors || paperTheme.colors;
  const currentVehicle = values.rideRentalDetails?.vehicleType || null;
  const activityColor =
    activityIcons.find(
      (icon) => icon.activityType === values.type || icon.name === values.type || icon.activityType === ActivityType.rideRental
    )?.color || colors.primary || "#02899a";

  const pickupTitle = getLocationTitle(values.rideRentalDetails?.pickupLocation);
  const pickupSubtitle = getLocationSubtitle(values.rideRentalDetails?.pickupLocation);
  const dropoffTitle = getLocationTitle(values.rideRentalDetails?.dropoffLocation);
  const dropoffSubtitle = getLocationSubtitle(values.rideRentalDetails?.dropoffLocation);

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5 border-l-3 border-primary pl-4">
        <Icon name="directions-car" size={26} color={"#34405480"} />
        <Text className="text-lg font-semibold tracking-wider uppercase text-secondary">
          Rental Details
        </Text>
      </View>

      {/* Pick-up & Drop-off Location */}
      <Text className="text-lg text-secondary/80 font-semibold mb-3 px-sm">
        Pick-up & Drop-off Location
      </Text>

      {/* Pick-up Location */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.pickupLocation"] = el; }} className="flex-row">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={pickupTitle ? `Pick-up location: ${pickupTitle}` : "Select pick-up location"}
          activeOpacity={0.7}
          onPress={() => onOpenGoogleSearch?.("pickupLocation")}
          className="bg-white border px-4 py-4 rounded-t-3xl w-full border-b-0"
          style={{ borderColor: activityColor + "60" }}
        >
          <View className="flex-row gap-2 items-center">
            <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
              <Icon name="car-rental" size={26} color={pickupTitle ? activityColor : "#98A2B3"} />
              <Text
                className={`text-xs font-bold tracking-wider mt-1 ${pickupTitle ? "text-secondary/70" : "text-secondary/40"}`}
              >
                PICK-UP
              </Text>
            </View>

            <View className="flex-1 justify-center gap-0 px-sm pr-14">
              <Text
                className={`text-2xl font-semibold leading-10px ${pickupTitle ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {pickupTitle || "Select pick-up location"}
              </Text>
              {Boolean(pickupSubtitle) && (
                <Text
                  className="text-lg leading-xl text-secondary/50"
                  numberOfLines={1}
                >
                  {pickupSubtitle}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <View className="flex-row gap-4">
          <View className="flex-1 flex-row justify-end -mb-lg z-50 -mt-3xl absolute right-4" pointerEvents="box-none">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Swap pick-up and drop-off locations"
              activeOpacity={0.8}
              onPress={() => {
                const currentPick = values.rideRentalDetails?.pickupLocation || null;
                const currentDrop = values.rideRentalDetails?.dropoffLocation || null;
                setFieldValue("rideRentalDetails.pickupLocation", currentDrop);
                setFieldValue("rideRentalDetails.dropoffLocation", currentPick);
              }}
              className="w-14 h-14 rounded-full p-3 items-center border-2 justify-center"
              style={{ borderColor: activityColor + "50", backgroundColor: "#fff" }}
            >
              <Icon name="arrow-downward" size={24} color={activityColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Drop-off Location */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.dropoffLocation"] = el; }} className="mb-2 flex-row">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={dropoffTitle ? `Drop-off location: ${dropoffTitle}` : "Select drop-off location"}
            activeOpacity={0.7}
            onPress={() => onOpenGoogleSearch?.("dropoffLocation")}
            className="bg-white border  px-4 py-4 rounded-b-3xl w-full"
            style={{ borderColor: activityColor + "60" }}
          >
            <View className="flex-row gap-2 items-center">
              <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
                <Icon name="place" size={26} color={dropoffTitle ? activityColor : "#98A2B3"} />
                <Text
                  className={`text-xs font-bold tracking-wider mt-1 ${dropoffTitle ? "text-secondary/70" : "text-secondary/40"}`}
                >
                  RETURN
                </Text>
              </View>

              <View className="flex-1 justify-center gap-0 px-sm pr-14">
                <Text
                  className={`text-2xl font-semibold leading-10px ${dropoffTitle ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {dropoffTitle || "Select drop-off location"}
                </Text>
                {Boolean(dropoffSubtitle) && (
                  <Text
                    className="text-lg leading-xl text-secondary/50"
                    numberOfLines={1}
                  >
                    {dropoffSubtitle}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View
          className="items-start justify-start mb-5 px-sm"
          style={{ opacity: values?.rideRentalDetails?.pickupLocation ? 1 : 0.4 }}
        >
          <TouchableOpacity
            onPress={() => {
              if (values.rideRentalDetails?.pickupLocation) {
                setFieldValue(
                  "rideRentalDetails.dropoffLocation",
                  values.rideRentalDetails.pickupLocation
                );
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Same with Pickup Location"
          >
            <Text style={{ color: colors.primary }} className="text-sm underline">
              Same with Pickup Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* 6. Rental Period (DateTime) */}
      <DateTime
        activityType={ActivityType.rideRental}
        title="Rental Period"
        startDate={values.startDate}
        startTime={values.startTime}
        endDate={values.endDate}
        endTime={values.endTime}
        onPressDate={onPressDate || (() => { })}
        onPressTime={onPressTime || (() => { })}
        onClearDate={onClearDate || (() => { })}
        onClearTime={onClearTime || (() => { })}
        onPressEndDate={onPressEndDate}
        onPressEndTime={onPressEndTime}
        onClearEndDate={onClearEndDate}
        onClearEndTime={onClearEndTime}
      />

      {/* 4. Vehicle Type Cards */}
      <View className="mb-3 flex-1">
        <Text className="text-lg text-secondary/80 font-semibold mb-2 px-xs">
          Booking Details
        </Text>


        <View className="flex-row gap-2 justify-start items-center mb-2 px-xs">
          <Text className="text-xs font-bold tracking-wider uppercase text-secondary/40">
            Vehicle Type
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2.5 py-1">
            {VEHICLE_TYPES.map((item) => {
              const isSelected = currentVehicle === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label} vehicle type`}
                  activeOpacity={0.7}
                  onPress={() =>
                    setFieldValue(
                      "rideRentalDetails.vehicleType",
                      isSelected ? null : item.label
                    )
                  }
                  style={{
                    minWidth: 84,
                    height: 94,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? `${activityColor}50` : "#E4E7EC",
                    backgroundColor: isSelected ? `${activityColor}12` : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={24}
                      color={isSelected ? activityColor : "#475467"}

                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? activityColor : "#344054",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* 5. Vehicle Model / Details */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.vehicleModel"] = el; }} className="mb-5 flex-1">
        <FloatingLabelInput
          label="Vehicle Model / Make"
          value={values.rideRentalDetails?.vehicleModel || ""}
          onChangeText={handleChange("rideRentalDetails.vehicleModel")}
          onBlur={handleBlur("rideRentalDetails.vehicleModel")}
        />
      </View>

      {/* 7. Booking Reference */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.bookingReference"] = el; }} className="mb-5 flex-1">
        <FloatingLabelInput
          label="Booking Reference"
          value={values.rideRentalDetails?.bookingReference || ""}
          onChangeText={handleChange("rideRentalDetails.bookingReference")}
          onBlur={handleBlur("rideRentalDetails.bookingReference")}
        />
      </View>

      {/* 8. Website Link */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.websiteAddress"] = el; }} className="mb-5 flex-1">
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

      {/* 9. Contact */}
      <View className="flex-row gap-2 justify-start items-center mb-2 px-sm">
        <Text className="text-xs font-bold tracking-wider uppercase text-secondary/40">
          Contact Info
        </Text>
      </View>


      {/* Contact Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.contactName"] = el; }} className="mb-5 flex-1">
        <FloatingLabelInput
          label="Contact Name"
          value={values.rideRentalDetails?.contactName || ""}
          onChangeText={handleChange("rideRentalDetails.contactName")}
          onBlur={handleBlur("rideRentalDetails.contactName")}
        />
      </View>

      {/* Contact Number & Email Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.contactNumber"] = el; }} className="mb-5 flex-1">
        <FloatingLabelInput
          label="Contact Number"
          value={values.rideRentalDetails?.contactNumber || ""}
          onChangeText={handleChange("rideRentalDetails.contactNumber")}
          onBlur={handleBlur("rideRentalDetails.contactNumber")}
          keyboardType="phone-pad"
        />
      </View>
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["rideRentalDetails.emailAddress"] = el; }} className="mb-5 flex-1">
        <FloatingLabelInput
          label="Email Address"
          value={values.rideRentalDetails?.emailAddress || ""}
          onChangeText={handleChange("rideRentalDetails.emailAddress")}
          onBlur={handleBlur("rideRentalDetails.emailAddress")}
          keyboardType="email-address"
        />
      </View>
    </View >
  );
}
