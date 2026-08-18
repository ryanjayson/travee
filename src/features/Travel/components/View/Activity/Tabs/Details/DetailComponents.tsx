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
import { MaterialIcons as Icon } from "@expo/vector-icons";

import {
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
  <View className="p-4 items-center justify-center flex-1 my-6">
    <Text className="text-white text-center text-2xl font-bold mb-1">No details added</Text>
    <Text className="text-white text-center text-base">
      Tap edit button <Icon name="edit" size={14} color="#FFFFFF" /> to add information
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
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <CafeRestaurantDetailsCard
      data={data!}
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
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <NatureDetailsCard
      data={data!}
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
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return (
    <EntertainmentDetailsCard
      data={data!}
      activityStartDate={activityStartDate}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const TransportationDetails = ({ data }: { data?: TransportationDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <TransportationDetailsCard data={data!} />;
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

export const HikeOrCampDetails = ({ data }: { data?: HikeOrCampDetailsDto | null }) => {
  const dataWithoutPermit = { ...data, permitRequired: null }
  if (!hasActivityData(dataWithoutPermit)) return <NoDetailsAdded />;
  return <HikeOrCampDetailsCard data={data!} />;
};

export const MotorcycleRideDetails = ({ data }: { data?: MotorcycleRideDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <MotorcycleRideDetailsCard data={data!} />;
};

export const MeetupDetails = ({ data }: { data?: MeetupDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <MeetupDetailsCard data={data!} />;
};

export const RideRentalDetails = ({ data }: { data?: RideRentalDetailsDto | null }) => {
  if (!hasActivityData(data)) return <NoDetailsAdded />;
  return <RideRentalDetailsCard data={data!} />;
};
