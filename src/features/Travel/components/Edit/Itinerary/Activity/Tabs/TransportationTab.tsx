import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInputAtom from "../../../../../../../components/atoms/FloatingLabelInput";
import DateTime from "../DateTime";
import { ActivityType } from "../../../../../../../types/enums";
import { activityIcons } from "../../../../../../../components/ActivityIcon";

export interface TransitModeItem {
  label: string;
  icon: keyof typeof Icon.glyphMap;
}

const TRANSIT_MODES: TransitModeItem[] = [
  { label: "Train", icon: "train" },
  { label: "Bus", icon: "directions-bus" },
  { label: "Subway", icon: "subway" },
  { label: "Ferry", icon: "directions-boat" },
  { label: "Taxi", icon: "local-taxi" },
  { label: "Rideshare", icon: "directions-car" },
  { label: "Car", icon: "drive-eta" },
  { label: "Shuttle", icon: "airport-shuttle" },
  { label: "Boat", icon: "sailing" },
  { label: "Tram", icon: "tram" },
  { label: "Cable Car", icon: "cable" },
  { label: "Bike", icon: "pedal-bike" },
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
  onOpenMapPinModal?: (field: string, initialValue?: string) => void;
  onOpenGoogleSearch?: (target: "operatorProvider" | "pickupLocation" | "dropoffLocation") => void;
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

export default function TransportationTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  colors: propColors,
  setShowTransportationDatePickerFor,
  formatTransportationDateTime,
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
}: TransportationTabProps) {
  const paperTheme = useTheme();
  const colors = propColors || paperTheme.colors;
  const currentMode = values.transportationDetails?.mode || null;
  const activityColor =
    activityIcons.find(
      (icon) => icon.activityType === values.type || icon.name === values.type || icon.activityType === ActivityType.transit
    )?.color || colors.primary || "#02899a";

  return (
    <View className={`flex-1 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5 border-l-3 border-primary pl-4">
        <Icon name="directions-bus" size={26} color={"#344054"} />
        <Text className="text-lg font-semibold tracking-wider uppercase text-secondary">
          Transit Details
        </Text>
      </View>

      {/* Pickup & Drop-off Location */}
      <Text className="text-lg text-secondary/80 font-semibold mb-3 px-sm">
        Pickup & Drop-off Location
      </Text>

      {/* Pickup / Departure Location */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.pickupLocation"] = el; }} className="flex-row">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={values.transportationDetails?.pickupLocation ? `Pickup location: ${values.transportationDetails.pickupLocation}` : "Select pickup location"}
          activeOpacity={0.7}
          onPress={() => onOpenGoogleSearch?.("pickupLocation")}
          className="bg-white border  px-4 py-4 rounded-t-3xl w-full border-b-0"
          style={{ borderColor: activityColor }}
        >
          <View className="flex-row gap-2 items-center">
            <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
              <Icon name="departure-board" size={26} color={values.transportationDetails?.pickupLocation ? activityColor : "#98A2B3"} />
              <Text
                className={`text-xs font-bold tracking-wider mt-1 ${values.transportationDetails?.pickupLocation ? "text-secondary/70" : "text-secondary/40"}`}
              >
                DEPART
              </Text>
            </View>

            <View className="flex-1 justify-center gap-0 px-sm pr-14">
              <Text className="text-lg text-secondary/80">From</Text>
              <Text
                className={`text-2xl font-semibold ${values.transportationDetails?.pickupLocation ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {values.transportationDetails?.pickupLocation || "Select departure location"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <View className="flex-row gap-4">
          <View className="flex-1 flex-row justify-end -mb-lg z-50 -mt-3xl absolute right-4" pointerEvents="box-none">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Swap pickup and drop-off locations"
              activeOpacity={0.8}
              onPress={() => {
                const currentPick = values.transportationDetails?.pickupLocation || "";
                const currentDrop = values.transportationDetails?.dropoffLocation || "";
                setFieldValue("transportationDetails.pickupLocation", currentDrop);
                setFieldValue("transportationDetails.dropoffLocation", currentPick);
              }}
              className="w-14 h-14 rounded-full p-3 items-center justify-center"
              style={{ backgroundColor: activityColor }}
            >
              <Icon name="swap-vert" size={24} color={"#fff"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Drop-off / Arrival Location */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["transportationDetails.dropoffLocation"] = el; }} className="mb-5 flex-row">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={values.transportationDetails?.dropoffLocation ? `Drop-off location: ${values.transportationDetails.dropoffLocation}` : "Select drop-off location"}
            activeOpacity={0.7}
            onPress={() => onOpenGoogleSearch?.("dropoffLocation")}
            className="bg-white border px-4 py-4 rounded-b-3xl w-full"
            style={{ borderColor: activityColor }}

          >
            <View className="flex-row gap-2 items-center">
              <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
                <Icon name="place" size={26} color={values.transportationDetails?.dropoffLocation ? activityColor : "#98A2B3"} />
                <Text
                  className={`text-xs font-bold tracking-wider mt-1 ${values.transportationDetails?.dropoffLocation ? "text-secondary/70" : "text-secondary/40"}`}
                >
                  ARRIVE
                </Text>
              </View>

              <View className="flex-1 justify-center gap-0 px-sm pr-14">
                <Text className="text-lg text-secondary/80">To</Text>
                <Text
                  className={`text-2xl font-semibold ${values.transportationDetails?.dropoffLocation ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {values.transportationDetails?.dropoffLocation || "Select arrival location"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>


      {/* Date & Time Section */}
      <DateTime
        activityType={ActivityType.transit}
        title="Departure & Arrival Date & Time"
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

      {/* Transit Mode Cards */}
      <View className="mb-5">
        <Text className="text-lg text-secondary/80 font-semibold mb-2">
          Transit Mode
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2.5 py-1">
            {TRANSIT_MODES.map((item) => {
              const isSelected = currentMode === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label} mode`}
                  onPress={() => setFieldValue("transportationDetails.mode", isSelected ? null : item.label)}
                  activeOpacity={0.7}
                  style={{
                    width: 88,
                    height: 94,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? activityColor : "#E4E7EC",
                    backgroundColor: isSelected ? `${activityColor}12` : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 6,
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
