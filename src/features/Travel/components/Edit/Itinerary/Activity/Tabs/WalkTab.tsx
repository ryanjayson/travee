import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text } from "react-native";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

interface WalkTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function WalkTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  noPadding = false,
  fieldRefs,
}: WalkTabProps) {
  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="directions-walk" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Walk Details
        </Text>
      </View>

      {/* Route Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["walkDetails.routeName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Route Name"
          value={values.walkDetails?.routeName || ""}
          onChangeText={handleChange("walkDetails.routeName")}
          onBlur={handleBlur("walkDetails.routeName")}
        />
      </View>

      {/* Distance & Duration */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["walkDetails.estimatedDistanceKm"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Distance (km)"
            value={values.walkDetails?.estimatedDistanceKm || ""}
            onChangeText={handleChange("walkDetails.estimatedDistanceKm")}
            onBlur={handleBlur("walkDetails.estimatedDistanceKm")}
            keyboardType="numeric"
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["walkDetails.estimatedDuration"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Est. Duration"
            value={values.walkDetails?.estimatedDuration || ""}
            onChangeText={handleChange("walkDetails.estimatedDuration")}
            onBlur={handleBlur("walkDetails.estimatedDuration")}
            placeholder="e.g. 1h 30min"
          />
        </View>
      </View>
    </View>
  );
}
