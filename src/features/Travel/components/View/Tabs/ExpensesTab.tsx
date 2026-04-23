import React from "react";
import { View, Text } from "react-native";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ExpensesTabProps {
  travelPlan: TravelPlan;
}

const ExpensesTab = ({ travelPlan }: ExpensesTabProps) => {
  return (
    <View>
      {travelPlan.itinerarySection && travelPlan.itinerarySection.length > 0 ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text className="text-sm text-[#555] leading-5">No Expenses added.</Text>
      )}
    </View>
  );
};

export default ExpensesTab;
