import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

type PoiCategory = "accommodation" | "cafeRestaurant" | "nature" | "shopppingAndService" | "entertainmentAndRecreation" | "hikeOrCamp";

interface SightseeingTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  onOpenPoiModal: (category: PoiCategory) => void;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function SightseeingTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  onOpenPoiModal,
  noPadding = false,
  fieldRefs,
}: SightseeingTabProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="photo-camera" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Sightseeing Details
        </Text>
      </View>

      {/* Attraction Name — searchable */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["sightseeingDetails.attractionName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Attraction Name"
          value={values.sightseeingDetails?.attractionName || ""}
          onChangeText={handleChange("sightseeingDetails.attractionName")}
          onBlur={handleBlur("sightseeingDetails.attractionName")}
          onPress={() => onOpenPoiModal("entertainmentAndRecreation")}
          right={<Icon name="map-marker-radius-outline" size={20} color="#999" />}
        />
      </View>

      {/* Address */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["sightseeingDetails.address"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Address"
          value={values.sightseeingDetails?.address || ""}
          onChangeText={handleChange("sightseeingDetails.address")}
          onBlur={handleBlur("sightseeingDetails.address")}
        />
      </View>

      {/* Entry Fee */}
      <View className="mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["sightseeingDetails.entryFee"] = el; }} className="flex-1">
          <FloatingLabelInput
            label="Entry Fee"
            value={values.sightseeingDetails?.entryFee || ""}
            onChangeText={handleChange("sightseeingDetails.entryFee")}
            onBlur={handleBlur("sightseeingDetails.entryFee")}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Website */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["sightseeingDetails.websiteAddress"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Website"
          value={values.sightseeingDetails?.websiteAddress || ""}
          onChangeText={handleChange("sightseeingDetails.websiteAddress")}
          onBlur={handleBlur("sightseeingDetails.websiteAddress")}
        />
      </View>
    </View>
  );
}
