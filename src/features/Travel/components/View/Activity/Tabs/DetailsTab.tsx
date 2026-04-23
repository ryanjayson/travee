import React from "react";
import { View } from "react-native";
import { ItineraryActivity } from "../../../types/TravelDto";

interface DetailsTabProps {
  itineraryActivity?: ItineraryActivity;
}

const DetailsTab = ({ itineraryActivity }: DetailsTabProps) => {
  return (
    <View className="p-3 bg-white">
      <View className="flex-2"></View>
    </View>
  );
};

export default DetailsTab;
