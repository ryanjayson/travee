import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

const SHOPPING_SUBTYPES = [
  "Mall", "Market", "Clothes Store", "Supermarket", "Convenience Store", "Spa", "ATM", "Bank", "Pharmacy", "Gas Station",
];

interface ShoppingTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function ShoppingTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: ShoppingTabProps) {
  const { colors } = useTheme();
  const currentSubType = values.shoppingDetails?.subType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="shopping-bag" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Shopping & Service Details
        </Text>
      </View>

      {/* Venue Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["shoppingDetails.venueName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Shop / Venue Name"
          value={values.shoppingDetails?.venueName || ""}
          onChangeText={handleChange("shoppingDetails.venueName")}
          onBlur={handleBlur("shoppingDetails.venueName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("shopppingAndService")}
            />
          }
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["shoppingDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.shoppingDetails?.address || ""}
          onChangeText={handleChange("shoppingDetails.address")}
          onBlur={handleBlur("shoppingDetails.address")}
        />
      </View>

      {/* Sub-type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {SHOPPING_SUBTYPES.map((tag) => {
              const isActive = currentSubType === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  accessibilityRole="button"
                  onPress={() => setFieldValue("shoppingDetails.subType", isActive ? null : tag)}
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

      {/* Website */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["shoppingDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website"
          value={values.shoppingDetails?.websiteAddress || ""}
          onChangeText={handleChange("shoppingDetails.websiteAddress")}
          onBlur={handleBlur("shoppingDetails.websiteAddress")}
        />
      </View>
    </View>
  );
}
