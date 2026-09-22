import React from "react";
import { Text, View } from "react-native";
import { FlightDetailsCard } from "./FlightDetailsCard";
import { AccomodationDetailsCard } from "./AccomodationDetailsCard";
import { CafeRestaurantDetailsCard } from "./CafeRestaurantDetailsCard";
import { HikeOrCampDetailsCard } from "./HikeOrCampDetailsCard";
import { TransportationDetailsCard } from "./TransportationDetailsCard";
import { RideRentalDetailsCard } from "./RideRentalDetailsCard";
import { SightseeingDetailsCard } from "./SightseeingDetailsCard";
import { EntertainmentDetailsCard } from "./EntertainmentDetailsCard";
import { NatureDetailsCard } from "./NatureDetailsCard";
import { ShoppingDetailsCard } from "./ShoppingDetailsCard";
import { WalkDetailsCard } from "./WalkDetailsCard";
import { PreparationDetailsCard } from "./PreparationDetailsCard";
import { RestDetailsCard } from "./RestDetailsCard";
import { MotorcycleRideDetailsCard } from "./MotorcycleRideDetailsCard";
import { MeetupDetailsCard } from "./MeetupDetailsCard";
import { PlanDetailsCard } from "./PlanDetailsCard";
import { MaterialIcons as Icon } from "@expo/vector-icons";

import {
  ItineraryActivity,
  FlightDetailsDto,
  AccomodationDetailsDto,
  CafeRestaurantDetailsDto,
  NatureDetailsDto,
  ShoppingDetailsDto,
  EntertainmentDetailsDto,
  TransportationDetailsDto,
  WalkDetailsDto,
  SightseeingDetailsDto,
  PreparationDetailsDto,
  RestDetailsDto,
  HikeOrCampDetailsDto,
  MotorcycleRideDetailsDto,
  MeetupDetailsDto,
  RideRentalDetailsDto,
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

export const CafeRestaurantDetails = ({
  data,
  activityStartDate,
  onFullScreenChange,
}: {
  data?: CafeRestaurantDetailsDto | null;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  const hasDate = Boolean(
    activityStartDate && (activityStartDate instanceof Date || String(activityStartDate).trim() !== "")
  );
  if (!hasActivityData(data) && !hasDate) return <NoDetailsAdded />;
  return (
    <CafeRestaurantDetailsCard
      data={data || ({} as any)}
      activityStartDate={activityStartDate}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const NatureDetails = ({
  data,
  activityStartDate,
  onFullScreenChange,
}: {
  data?: NatureDetailsDto | null;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  const hasDate = Boolean(
    activityStartDate && (activityStartDate instanceof Date || String(activityStartDate).trim() !== "")
  );
  if (!hasActivityData(data) && !hasDate) return <NoDetailsAdded />;
  return (
    <NatureDetailsCard
      data={data || ({} as any)}
      activityStartDate={activityStartDate}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const ShoppingDetails = ({ data, onFullScreenChange }: { data?: ShoppingDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <ShoppingDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const EntertainmentDetails = ({
  data,
  activityStartDate,
  onFullScreenChange,
}: {
  data?: EntertainmentDetailsDto | null;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}) => {
  const hasDate = Boolean(
    activityStartDate && (activityStartDate instanceof Date || String(activityStartDate).trim() !== "")
  );
  if (!hasActivityData(data) && !hasDate) return <NoDetailsAdded />;
  return (
    <EntertainmentDetailsCard
      data={data || ({} as any)}
      activityStartDate={activityStartDate}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const TransportationDetails = ({ data, onFullScreenChange }: { data?: TransportationDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <TransportationDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const WalkDetails = ({ data }: { data?: WalkDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <WalkDetailsCard data={data!} />;
};

export const SightseeingDetails = ({ data, onFullScreenChange }: { data?: SightseeingDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <SightseeingDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const PreparationDetails = ({ data }: { data?: PreparationDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <PreparationDetailsCard data={data!} />;
};

export const RestDetails = ({ data }: { data?: RestDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <RestDetailsCard data={data!} />;
};

export const HikeOrCampDetails = ({ data, onFullScreenChange }: { data?: HikeOrCampDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  const dataWithoutPermit = { ...data, permitRequired: null }
  if (!hasActivityData(dataWithoutPermit)) return <NoDetailsAdded />;
  return <HikeOrCampDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const MotorcycleRideDetails = ({ data }: { data?: MotorcycleRideDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <MotorcycleRideDetailsCard data={data!} />;
};

export const MeetupDetails = ({ data, onFullScreenChange }: { data?: MeetupDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <MeetupDetailsCard data={data!} onFullScreenChange={onFullScreenChange} />;
};

export const RideRentalDetails = ({ data, onFullScreenChange }: { data?: RideRentalDetailsDto | null; onFullScreenChange?: (fullScreen: boolean) => void }) => {
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
