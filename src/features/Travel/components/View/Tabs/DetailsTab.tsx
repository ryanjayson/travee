import React from "react";
import { View, Text } from "react-native";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface DetailsTabProps {
  travelPlan: TravelPlan;
}

const DetailsTab = ({ travelPlan }: DetailsTabProps) => {
  return (
    <View>
      <View>
        <Text className="text-sm text-[#555] leading-5">20 - Total Activity </Text>
      </View>
      <View>
        <Text className="text-sm text-[#555] leading-5">10 - Paticipants</Text>
      </View>
      <View>
        <Text className="text-sm text-[#555] leading-5">$1000 - Running Expenses</Text>
      </View>
    </View>
  );
};

export default DetailsTab;
