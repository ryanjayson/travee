import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const NATURE_SUBTYPES = [
  "Beach", "Mountain", "Lake", "River", "Waterfall", "Forest", "Jungle", "Cave", "Desert", "Canyon", "Volcano",
];

interface NatureTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function NatureTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: NatureTabProps) {
  const { colors } = useTheme();
  const currentSubType = values.natureDetails?.subType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="terrain" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Nature Details
        </Text>
      </View>

      {/* Spot Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["natureDetails.spotName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Spot Name"
          value={values.natureDetails?.spotName || ""}
          onChangeText={handleChange("natureDetails.spotName")}
          onBlur={handleBlur("natureDetails.spotName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("nature")}
            />
          }
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["natureDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address / Location"
          value={values.natureDetails?.address || ""}
          onChangeText={handleChange("natureDetails.address")}
          onBlur={handleBlur("natureDetails.address")}
        />
      </View>

      {/* Sub-type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 flex-wrap">
            {NATURE_SUBTYPES.map((tag) => {
              const isActive = currentSubType === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("natureDetails.subType", isActive ? null : tag)}
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

      {/* Entry Fee */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["natureDetails.entryFee"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Entry Fee"
          value={values.natureDetails?.entryFee || ""}
          onChangeText={handleChange("natureDetails.entryFee")}
          onBlur={handleBlur("natureDetails.entryFee")}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}
