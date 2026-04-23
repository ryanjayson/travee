import React from "react";
import { View, Text } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
}

const ItineraryTab = ({ travelPlan }: ItineraryTabProps) => {
  return (
    <View>
      {travelPlan.itinerarySection && travelPlan.itinerarySection.length > 0 ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <View className="flex-1 bg-black items-center justify-center h-[200px]">
          <Text className="text-base tracking-widest text-gray-500">No itinerary Added</Text>
        </View>
      )}
    </View>
  );
};

export default ItineraryTab;
