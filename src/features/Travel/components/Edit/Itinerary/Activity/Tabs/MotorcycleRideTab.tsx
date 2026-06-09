import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, Text } from "react-native";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";

interface MotorcycleRideTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
}

export default function MotorcycleRideTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  noPadding = false,
  fieldRefs,
}: MotorcycleRideTabProps) {
  return (
    <View className={`flex-1 pb-6 pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-5">
        <Icon name="two-wheeler" size={20} color="#000" />
        <Text className="text-md font-bold tracking-wider uppercase">
          Motorcycle Ride Details
        </Text>
      </View>

      {/* Route Name */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.routeName"] = el; }} className="mb-5">
        <FloatingLabelInput
          label="Route Name"
          value={values.motorcycleRideDetails?.routeName || ""}
          onChangeText={handleChange("motorcycleRideDetails.routeName")}
          onBlur={handleBlur("motorcycleRideDetails.routeName")}
        />
      </View>

      {/* Starting & Ending Point */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.startingPoint"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Starting Point"
            value={values.motorcycleRideDetails?.startingPoint || ""}
            onChangeText={handleChange("motorcycleRideDetails.startingPoint")}
            onBlur={handleBlur("motorcycleRideDetails.startingPoint")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.endingPoint"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Ending Point"
            value={values.motorcycleRideDetails?.endingPoint || ""}
            onChangeText={handleChange("motorcycleRideDetails.endingPoint")}
            onBlur={handleBlur("motorcycleRideDetails.endingPoint")}
          />
        </View>
      </View>

      {/* Distance & Road Type */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.estimatedDistanceKm"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Distance (km)"
            value={values.motorcycleRideDetails?.estimatedDistanceKm || ""}
            onChangeText={handleChange("motorcycleRideDetails.estimatedDistanceKm")}
            onBlur={handleBlur("motorcycleRideDetails.estimatedDistanceKm")}
            keyboardType="numeric"
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.roadType"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Road Type"
            value={values.motorcycleRideDetails?.roadType || ""}
            onChangeText={handleChange("motorcycleRideDetails.roadType")}
            onBlur={handleBlur("motorcycleRideDetails.roadType")}
          />
        </View>
      </View>

      {/* Bike Model & Fuel Stops */}
      <View className="flex-row gap-4 mb-5">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.bikeModel"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Bike Model"
            value={values.motorcycleRideDetails?.bikeModel || ""}
            onChangeText={handleChange("motorcycleRideDetails.bikeModel")}
            onBlur={handleBlur("motorcycleRideDetails.bikeModel")}
          />
        </View>
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["motorcycleRideDetails.fuelStops"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Fuel Stops"
            value={values.motorcycleRideDetails?.fuelStops || ""}
            onChangeText={handleChange("motorcycleRideDetails.fuelStops")}
            onBlur={handleBlur("motorcycleRideDetails.fuelStops")}
          />
        </View>
      </View>
    </View>
  );
}
