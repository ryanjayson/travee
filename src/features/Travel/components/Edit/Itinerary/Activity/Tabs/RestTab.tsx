import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

const REST_LOCATION_TYPES = ["Home", "Hotel", "Vehicle", "Tent", "Other"];

interface RestTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function RestTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  noPadding = false,
  fieldRefs,
}: RestTabProps) {
  const { colors } = useTheme();
  const currentType = values.restDetails?.restLocationType || null;

  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="hotel" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Rest Details
        </Text>
      </View>

      {/* Rest Location Name — searchable / text */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["restDetails.restLocationName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Location Name"
          value={values.restDetails?.restLocationName || ""}
          onChangeText={handleChange("restDetails.restLocationName")}
          onBlur={handleBlur("restDetails.restLocationName")}
        />
      </View>

      {/* Location type tags */}
      <View className="mb-5">
        <Text className="text-xs font-bold tracking-wider uppercase mb-2">Location Type</Text>
        <View className="flex-row gap-2 flex-wrap">
          {REST_LOCATION_TYPES.map((tag) => {
            const isActive = currentType === tag;
            return (
              <TouchableOpacity
                key={tag}
                accessibilityRole="button"
                onPress={() => setFieldValue("restDetails.restLocationType", isActive ? null : tag)}
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
      </View>
    </View>
  );
}
