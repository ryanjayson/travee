import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const HIKE_SUBTYPES = ["Hike", "Camp", "Both"];

interface HikeOrCampTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  formatDateTime: (val: any) => string;
  onOpenCheckinPicker: () => void;
  onOpenCheckoutPicker: () => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function HikeOrCampTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  formatDateTime,
  onOpenCheckinPicker,
  onOpenCheckoutPicker,
  noPadding = false,
  fieldRefs,
}: HikeOrCampTabProps) {
  const { colors } = useTheme();
  const currentSubType = values.hikeOrCampDetails?.subType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="hiking" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Hike / Camp Details
        </Text>
      </View>

      {/* Trail / Site Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.trailOrSiteName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Trail / Site Name"
          value={values.hikeOrCampDetails?.trailOrSiteName || ""}
          onChangeText={handleChange("hikeOrCampDetails.trailOrSiteName")}
          onBlur={handleBlur("hikeOrCampDetails.trailOrSiteName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("hikeOrCamp")}
            />
          }
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address / Location"
          value={values.hikeOrCampDetails?.address || ""}
          onChangeText={handleChange("hikeOrCampDetails.address")}
          onBlur={handleBlur("hikeOrCampDetails.address")}
        />
      </View>

      {/* Sub-type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Activity</Text>
        <View className="flex-row gap-2">
          {HIKE_SUBTYPES.map((tag) => {
            const isActive = currentSubType === tag;
            return (
              <TouchableOpacity
                key={tag}
                accessibilityRole="button"
                onPress={() => setFieldValue("hikeOrCampDetails.subType", isActive ? null : tag)}
                style={{
                  borderRadius: 9999,
                  borderWidth: 1,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
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
      </View>

      {/* Distance & Campsite Name */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.estimatedDistanceKm"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Distance (km)"
            value={values.hikeOrCampDetails?.estimatedDistanceKm || ""}
            onChangeText={handleChange("hikeOrCampDetails.estimatedDistanceKm")}
            onBlur={handleBlur("hikeOrCampDetails.estimatedDistanceKm")}
            keyboardType="numeric"
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.campsiteName"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Campsite Name"
            value={values.hikeOrCampDetails?.campsiteName || ""}
            onChangeText={handleChange("hikeOrCampDetails.campsiteName")}
            onBlur={handleBlur("hikeOrCampDetails.campsiteName")}
          />
        </View>
      </View>

      {/* Permit Required toggle */}
      <View className="flex-row items-center justify-between mb-5 bg-white border border-[#E0E0E0] rounded-2xl px-4 py-3">
        <Text className="text-sm font-semibold text-gray-700">Permit Required</Text>
        <Switch
          value={!!values.hikeOrCampDetails?.permitRequired}
          onValueChange={(v) => setFieldValue("hikeOrCampDetails.permitRequired", v)}
          trackColor={{ false: "#E0E0E0", true: colors.primary }}
          thumbColor="#FFF"
        />
      </View>

      {/* Check-in & Check-out Date/Time */}
      <View className="flex-row gap-2 justify-start items-center mb-2">
        <Text className="text-xs font-bold tracking-wider uppercase text-gray-500">Stay Period</Text>
      </View>
      <View className="flex-row items-center mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.checkinDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Check-in"
            value={values.hikeOrCampDetails?.checkinDateTime ? formatDateTime(values.hikeOrCampDetails.checkinDateTime) : ""}
            editable={false}
            onPress={onOpenCheckinPicker}
            right={
              values.hikeOrCampDetails?.checkinDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("hikeOrCampDetails.checkinDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
          />
        </View>
        <Icon name="arrow-forward" size={16} color="#999" style={{ marginHorizontal: 6 }} />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.checkoutDateTime"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Check-out"
            value={values.hikeOrCampDetails?.checkoutDateTime ? formatDateTime(values.hikeOrCampDetails.checkoutDateTime) : ""}
            editable={false}
            onPress={onOpenCheckoutPicker}
            right={
              values.hikeOrCampDetails?.checkoutDateTime ? (
                <TextInput.Icon icon="close" color="#999" onPress={() => setFieldValue("hikeOrCampDetails.checkoutDateTime", null)} />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
          />
        </View>
      </View>

      {/* Contact Person & Contact Number */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.contactPerson"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Contact Person"
            value={values.hikeOrCampDetails?.contactPerson || ""}
            onChangeText={handleChange("hikeOrCampDetails.contactPerson")}
            onBlur={handleBlur("hikeOrCampDetails.contactPerson")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.contactNumber"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Contact Number"
            value={values.hikeOrCampDetails?.contactNumber || ""}
            onChangeText={handleChange("hikeOrCampDetails.contactNumber")}
            onBlur={handleBlur("hikeOrCampDetails.contactNumber")}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Website Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website Address"
          value={values.hikeOrCampDetails?.websiteAddress || ""}
          onChangeText={handleChange("hikeOrCampDetails.websiteAddress")}
          onBlur={handleBlur("hikeOrCampDetails.websiteAddress")}
        />
      </View>

      {/* Reservation Link */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["hikeOrCampDetails.reservationLink"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Reservation Link"
          value={values.hikeOrCampDetails?.reservationLink || ""}
          onChangeText={handleChange("hikeOrCampDetails.reservationLink")}
          onBlur={handleBlur("hikeOrCampDetails.reservationLink")}
        />
      </View>
    </View>
  );
}
