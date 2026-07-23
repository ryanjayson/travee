import React from "react";
import { View } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
  onRefresh?: () => Promise<any>;
}

const ItineraryTab = ({ travelPlan, onRefresh }: ItineraryTabProps) => {
  return (
    <View className="flex-1 bg-gray-100 px-3">
      <SectionAccordion travelPlan={travelPlan} onRefresh={onRefresh} />
    </View>
  );
};

export default ItineraryTab;
