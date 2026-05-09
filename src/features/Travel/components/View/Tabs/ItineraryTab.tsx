import React from "react";
import { View, Text } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
}

//TODO in the future use travel contex data to avoid API calling 
const ItineraryTab = ({ travelPlan }: ItineraryTabProps) => {
  console.log(travelPlan);
  return (
    <View>
      {travelPlan.itinerarySection && travelPlan.itinerarySection?.length > 0 ? (
        <>
          <Text>{travelPlan.travel.title}</Text>
          <Text>{travelPlan.itinerarySection.length}</Text>
          <SectionAccordion iterarysections={travelPlan.itinerarySection} />
        </>
      ) : (
        <View className="flex-1 items-center justify-center h-[300px]">
          <Text className="text-sm text-[#555] tracking-wider leading-5">No itinerary Added</Text>
        </View>
      )}
    </View>
  );
};

export default ItineraryTab;
