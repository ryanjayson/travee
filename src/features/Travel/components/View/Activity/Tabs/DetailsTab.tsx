import React from "react";
import { ScrollView, View, Text, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { ActivityType } from "../../../../../../types/enums";
import { activityIcons } from "../../../../../../components/ActivityIcon";
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
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const yOffset = insets.top + 60;
  const parentHeight = screenHeight - yOffset;
  const paddingBottom = parentHeight * 0.35 + 40; // 35% sheet height + extra spacing

  if (!itineraryActivity) return null;

  const activityColor = activityIcons.find((icon) => icon.name === itineraryActivity.type)?.color || "#9E9E9E";

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
      case ActivityType.walk:
        return <WalkDetails data={itineraryActivity.walkDetails} />;
      case ActivityType.sightseeing:
        return <SightseeingDetails data={itineraryActivity.sightseeingDetails} />;
      case ActivityType.preparation:
        return <PreparationDetails data={itineraryActivity.preparationDetails} />;
      case ActivityType.hikeOrCamp:
        return <HikeOrCampDetails data={itineraryActivity.hikeOrCampDetails} />;
      default:
        return <Text className="text-white p-4 text-center">No type-specific details available.</Text>;
    }
  };

  return (
    <View className="flex-1 relative"
    style={{
      backgroundColor: activityColor,
    }}>
      {/* <LinearGradient
        colors={["rgba(33, 150, 243, 0.20)", "#FFFFFF"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      /> */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom }} className="flex-1">
        <View className="px-3">{renderDetails()}</View>
      </ScrollView>
    </View>
  );
};

export default DetailsTab;





