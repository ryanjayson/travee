import React from "react";
import { View, Text } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ChecklistTabProps {
  travelPlan: TravelPlan;
}

const ChecklistTab = ({ travelPlan }: ChecklistTabProps) => {
  return (
    <View>
      {travelPlan.itinerarySection && travelPlan.itinerarySection.length > 0 ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <View className="flex-1 items-center justify-center h-[300px]">
          <Text className="text-base tracking-widest text-gray-500">No Checklist item added.</Text>
        </View>
      )}
    </View>
  );
};

export default ChecklistTab;
