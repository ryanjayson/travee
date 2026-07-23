import React from "react";
import { View } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
  onRefresh?: () => Promise<any>;
  isMinimized?: boolean;
}

const ItineraryTab = ({ travelPlan, onRefresh, isMinimized }: ItineraryTabProps) => {
  return (
    <View className="flex-1 bg-gray-100 px-3">
      <SectionAccordion travelPlan={travelPlan} onRefresh={onRefresh} isMinimized={isMinimized} />
    </View>
  );
};

export default ItineraryTab;
