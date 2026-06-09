import React from "react";
import { ScrollView, View, Text } from "react-native";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { ActivityType } from "../../../../../../types/enums";
import {
  FlightDetails,
  AccomodationDetails,
  CafeRestaurantDetails,
  NatureDetails,
  ShoppingDetails,
  EntertainmentDetails,
  TransportationDetails,
  WalkDetails,
  SightseeingDetails,
  PreparationDetails,
  RestDetails,
  HikeOrCampDetails,
  MotorcycleRideDetails,
  MeetupDetails,
  RideRentalDetails,
} from "./Details/DetailComponents";

interface DetailsTabProps {
  itineraryActivity?: ItineraryActivity;
}

const DetailsTab = ({ itineraryActivity }: DetailsTabProps) => {
  if (!itineraryActivity) return null;

  const renderDetails = () => {
    switch (itineraryActivity.type) {
      case ActivityType.flight:
        return <FlightDetails data={itineraryActivity.flightDetails} />;
      case ActivityType.accomodation:
        return <AccomodationDetails data={itineraryActivity.accomodationDetails} />;
      case ActivityType.cafeRestaurant:
        return <CafeRestaurantDetails data={itineraryActivity.cafeRestaurantDetails} />;
      case ActivityType.nature:
        return <NatureDetails data={itineraryActivity.natureDetails} />;
      case ActivityType.shopppingAndService:
        return <ShoppingDetails data={itineraryActivity.shoppingDetails} />;
      case ActivityType.entertainmentAndRecreation:
        return <EntertainmentDetails data={itineraryActivity.entertainmentDetails} />;
      case ActivityType.transportation:
        return <TransportationDetails data={itineraryActivity.transportationDetails} />;
      case ActivityType.walk:
        return <WalkDetails data={itineraryActivity.walkDetails} />;
      case ActivityType.sightseeing:
        return <SightseeingDetails data={itineraryActivity.sightseeingDetails} />;
      case ActivityType.preparation:
        return <PreparationDetails data={itineraryActivity.preparationDetails} />;
      case ActivityType.rest:
        return <RestDetails data={itineraryActivity.restDetails} />;
      case ActivityType.hikeOrCamp:
        return <HikeOrCampDetails data={itineraryActivity.hikeOrCampDetails} />;
      case ActivityType.motorcycleRide:
        return <MotorcycleRideDetails data={itineraryActivity.motorcycleRideDetails} />;
      case ActivityType.meetup:
        return <MeetupDetails data={itineraryActivity.meetupDetails} />;
      case ActivityType.rideRental:
        return <RideRentalDetails data={itineraryActivity.rideRentalDetails} />;
      default:
        return <Text className="text-gray-500 italic p-4 text-center">No type-specific details available.</Text>;
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="bg-gray-25 flex-1">
      <View className="p-4">{renderDetails()}</View>
    </ScrollView>
  );
};

export default DetailsTab;





