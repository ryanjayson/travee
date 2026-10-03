import React from "react";
import { Text, View } from "react-native";
import { FlightDetailsCard } from "./FlightDetailsCard";
import { AccomodationDetailsCard } from "./AccomodationDetailsCard";
import { TransportationDetailsCard } from "./TransportationDetailsCard";
import { RideRentalDetailsCard } from "./RideRentalDetailsCard";
import { PlanDetailsCard } from "./PlanDetailsCard";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import {
  ItineraryActivity,
  FlightDetailsDto,
  AccomodationDetailsDto,
  TransportationDetailsDto,
  RideRentalDetailsDto,
} from "../../../../../types/TravelDto";
import { hasActivityData } from "./activityDetailUtils";

export { hasActivityData };

export const NoDetailsAdded = () => (
  <View
    className={
      "p-8 items-center justify-center flex-1 my-4 bg-gray-50 " +
      "rounded-2xl mx-2 border border-gray-100"
    }
  >
    <Text className="text-gray-700 text-center text-xl font-bold mb-2">
      No details added
    </Text>
    <Text className="text-gray-500 text-center text-sm">
      Tap the edit button <Icon name="edit" size={16} color="#666" /> above to
      add information
    </Text>
  </View>
);

export const FlightDetails = ({ data }: { data?: FlightDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <FlightDetailsCard data={data!} />;
};

export const AccomodationDetails = ({
  data,
  onFullScreenChange,
}: {
  data?: AccomodationDetailsDto | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <AccomodationDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const TransportationDetails = ({
  data,
  onFullScreenChange,
}: {
  data?: (TransportationDetailsDto & { destinationData?: any }) | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <TransportationDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const RideRentalDetails = ({
  data,
  onFullScreenChange,
}: {
  data?: (RideRentalDetailsDto & { destinationData?: any }) | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <RideRentalDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const PlanDetails = ({
  data,
  activity,
  onFullScreenChange,
  onEditActivity,
}: {
  data?: any;
  activity?: ItineraryActivity | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  const planItem = activity || data;
  if (!planItem) return <NoDetailsAdded />;
  return (
    <PlanDetailsCard
      activity={planItem}
      onFullScreenChange={onFullScreenChange}
      onEditActivity={onEditActivity}
    />
  );
};
