import React from "react";
import { View } from "react-native";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import TripMembers from "../../Forms/TripMembers";

interface MembersTabProps {
  travelPlan: TravelPlan;
}

const MembersTab = ({ travelPlan }: MembersTabProps) => {
  return (
    <View className="flex-1 bg-gray-100">
      <TripMembers travelId={travelPlan.travel.id || ""} />
    </View>
  );
};

export default MembersTab;
