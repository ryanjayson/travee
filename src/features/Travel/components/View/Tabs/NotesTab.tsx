import React from "react";
import { View, Text } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface NotesTabProps {
  travelPlan: TravelPlan;
}

const NotesTab = ({ travelPlan }: NotesTabProps) => {
  return (
    <View>
      {travelPlan.itinerarySection && travelPlan.itinerarySection.length > 0 ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <View className="flex-1 bg-black items-center justify-center h-[200px]">
          <Text className="text-base tracking-widest text-gray-500">No note added.</Text>
        </View>
      )}
    </View>
  );
};

export default NotesTab;
