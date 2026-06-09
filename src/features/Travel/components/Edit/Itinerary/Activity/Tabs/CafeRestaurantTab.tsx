import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, Linking, TouchableOpacity } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

interface CafeRestaurantTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function CafeRestaurantTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: CafeRestaurantTabProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="restaurant" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Cafe / Restaurant Details
        </Text>
      </View>

      {/* Restaurant Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.restaurantName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Restaurant / Cafe Name"
          value={values.cafeRestaurantDetails?.restaurantName || ""}
          onChangeText={handleChange("cafeRestaurantDetails.restaurantName")}
          onBlur={handleBlur("cafeRestaurantDetails.restaurantName")}
          right={
            <TextInput.Icon
              style={{ backgroundColor: "#F2F4F7" }}
              icon="map-marker-radius-outline"
              color="#263f69"
              onPress={() => onOpenPoiModal("cafeRestaurant")}
            />
          }
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.cafeRestaurantDetails?.address || ""}
          onChangeText={handleChange("cafeRestaurantDetails.address")}
          onBlur={handleBlur("cafeRestaurantDetails.address")}
        />
      </View>

      {/* Cuisine & Price Range */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.cuisine"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Cuisine"
            value={values.cafeRestaurantDetails?.cuisine || ""}
            onChangeText={handleChange("cafeRestaurantDetails.cuisine")}
            onBlur={handleBlur("cafeRestaurantDetails.cuisine")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.priceRange"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Price Range"
            value={values.cafeRestaurantDetails?.priceRange || ""}
            onChangeText={handleChange("cafeRestaurantDetails.priceRange")}
            onBlur={handleBlur("cafeRestaurantDetails.priceRange")}
          />
        </View>
      </View>

      {/* Website */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website"
          value={values.cafeRestaurantDetails?.websiteAddress || ""}
          onChangeText={handleChange("cafeRestaurantDetails.websiteAddress")}
          onBlur={handleBlur("cafeRestaurantDetails.websiteAddress")}
          contentStyle={{ textDecorationLine: "underline" }}
          right={
            values.cafeRestaurantDetails?.websiteAddress ? (
              <TextInput.Icon
                icon={() => (
                  <Text
                    style={{
                      color: colors?.primary || "#263F69",
                      textDecorationLine: "underline",
                      fontWeight: "bold",
                      fontSize: 16,
                      marginTop: 2,
                    }}
                  >
                    Open
                  </Text>
                )}
                style={{ width: 60, height: 30, justifyContent: "center", alignItems: "center" }}
                onPress={() => {
                  let url = values.cafeRestaurantDetails.websiteAddress;
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

      {/* Reservation Link */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.reservationLink"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Reservation Link"
          value={values.cafeRestaurantDetails?.reservationLink || ""}
          onChangeText={handleChange("cafeRestaurantDetails.reservationLink")}
          onBlur={handleBlur("cafeRestaurantDetails.reservationLink")}
        />
      </View>

      {/* Contact Number */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["cafeRestaurantDetails.contactNumber"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Contact Number"
          value={values.cafeRestaurantDetails?.contactNumber || ""}
          onChangeText={handleChange("cafeRestaurantDetails.contactNumber")}
          onBlur={handleBlur("cafeRestaurantDetails.contactNumber")}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );
}
