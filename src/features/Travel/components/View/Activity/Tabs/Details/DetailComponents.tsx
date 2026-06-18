import React from "react";
import { Text } from "react-native";
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

export const FlightDetails = ({ data }: { data?: FlightDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No flight details available.</Text>;
  return <FlightDetailsCard data={data} />;
};

export const AccomodationDetails = ({ data }: { data?: AccomodationDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No accommodation details available.</Text>;
  return <AccomodationDetailsCard data={data} />;
};

export const CafeRestaurantDetails = ({ data }: { data?: CafeRestaurantDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No restaurant details available.</Text>;
  return <CafeRestaurantDetailsCard data={data} />;
};

export const NatureDetails = ({ data }: { data?: NatureDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No spot details available.</Text>;
  return <NatureDetailsCard data={data} />;
};

export const ShoppingDetails = ({ data }: { data?: ShoppingDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No shopping details available.</Text>;
  return <ShoppingDetailsCard data={data} />;
};

export const EntertainmentDetails = ({ data }: { data?: EntertainmentDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No entertainment details available.</Text>;
  return <EntertainmentDetailsCard data={data} />;
};

export const TransportationDetails = ({ data }: { data?: TransportationDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No transportation details available.</Text>;
  return <TransportationDetailsCard data={data} />;
};

export const WalkDetails = ({ data }: { data?: WalkDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No walk details available.</Text>;
  return <WalkDetailsCard data={data} />;
};

export const SightseeingDetails = ({ data }: { data?: SightseeingDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No sightseeing details available.</Text>;
  return <SightseeingDetailsCard data={data} />;
};

export const PreparationDetails = ({ data }: { data?: PreparationDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No preparation details available.</Text>;
  return <PreparationDetailsCard data={data} />;
};

export const RestDetails = ({ data }: { data?: RestDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No rest details available.</Text>;
  return <RestDetailsCard data={data} />;
};

export const HikeOrCampDetails = ({ data }: { data?: HikeOrCampDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No hike or camp details available.</Text>;
  return <HikeOrCampDetailsCard data={data} />;
};

export const MotorcycleRideDetails = ({ data }: { data?: MotorcycleRideDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No motorcycle ride details available.</Text>;
  return <MotorcycleRideDetailsCard data={data} />;
};

export const MeetupDetails = ({ data }: { data?: MeetupDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No meetup details available.</Text>;
  return <MeetupDetailsCard data={data} />;
};

export const RideRentalDetails = ({ data }: { data?: RideRentalDetailsDto | null }) => {
  if (!data) return <Text className="text-white p-4 text-center">No rental details available.</Text>;
  return <RideRentalDetailsCard data={data} />;
};
