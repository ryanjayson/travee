import React from "react";
import { View } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
}

const ItineraryTab = ({ travelPlan }: ItineraryTabProps) => {
  return (
    <View className="flex-1 bg-gray-100">
      <SectionAccordion travelPlan={travelPlan} />
    </View>
  );
};

export default ItineraryTab;
