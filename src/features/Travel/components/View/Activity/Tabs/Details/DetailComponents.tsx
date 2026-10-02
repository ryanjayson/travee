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
  AccomodationDetailsDto, TransportationDetailsDto, RideRentalDetailsDto
} from "../../../../../types/TravelDto";

export const hasActivityData = (data: any): boolean => {
  // if (data?.activityStartDate) {
  //   const hasDate = Boolean(
  //     data.activityStartDate && (data.activityStartDate instanceof Date || String(data.activityStartDate).trim() !== "")
  //   );
  //   if (hasDate) return true;
  // }

  if (!data || typeof data !== "object") return false;

  const ignoredKeys = new Set([
    "id",
    "activityId",
    "activity_id",
    "createdAt",
    "created_at",
    "updatedAt",
    "updated_at",
    "_status",
    "_changed",
    "isOffline",
  ]);

  for (const [key, value] of Object.entries(data)) {
    if (ignoredKeys.has(key)) continue;

    if (value !== null && value !== undefined) {
      if (typeof value === "string" && value.trim() !== "") {
        return true;
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return true;
      }
      if (value instanceof Date) {
        return true;
      }
      if (typeof value === "object") {
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
        if (!Array.isArray(value) && Object.keys(value).length > 0) {
          const subValues = Object.values(value);
          if (subValues.some((v) => v !== null && v !== undefined && String(v).trim() !== "")) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

export const NoDetailsAdded = () => (
  <View className="p-8 items-center justify-center flex-1 my-4 bg-gray-50 rounded-2xl mx-2 border border-gray-100">
    <Text className="text-gray-700 text-center text-xl font-bold mb-2">No details added</Text>
    <Text className="text-gray-500 text-center text-sm">
      Tap the edit button <Icon name="edit" size={16} color="#666" /> above to add information
    </Text>
  </View>
);

export const FlightDetails = ({ data }: { data?: FlightDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <FlightDetailsCard data={data!} />;
};

export const AccomodationDetails = ({ data, onFullScreenChange }: { data?: AccomodationDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <AccomodationDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const TransportationDetails = ({ data, onFullScreenChange }: { data?: (TransportationDetailsDto & { destinationData?: any }) | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <TransportationDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const RideRentalDetails = ({ data, onFullScreenChange }: { data?: (RideRentalDetailsDto & { destinationData?: any }) | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <RideRentalDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
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
