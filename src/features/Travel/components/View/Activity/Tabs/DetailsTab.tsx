import React, { useRef, useState } from "react";
import { ScrollView, View, Text, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { ActivityType } from "../../../../../../types/enums";
import { activityIcons } from "../../../../../../components/ActivityIcon";
import { FadeInView } from "../../../../../../components/animations";
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
  PlanDetails,
} from "./Details/DetailComponents";

interface DetailsTabProps {
  itineraryActivity?: ItineraryActivity;
  onFullScreenChange?: (fullScreen: boolean) => void;
  scrollEnabled?: boolean;
  isMidSnap?: boolean;
  isExpanded?: boolean;
  onScrollAtTopChange?: (isAtTop: boolean) => void;
}

const DetailsTab = ({
  itineraryActivity,
  onFullScreenChange,
  scrollEnabled = true,
  isMidSnap = false,
  isExpanded = false,
  onScrollAtTopChange,
}: DetailsTabProps) => {
  const [isAtTop, setIsAtTop] = useState(true);

  // Lock ScrollView when bottom sheet snap is mid.
  // Enable ScrollView when snap is expanded (so it can scroll up when content overflows).
  const shouldScroll = isMidSnap ? false : isExpanded ? true : scrollEnabled;

  React.useEffect(() => {
    setIsAtTop(true);
    onScrollAtTopChange?.(true);
  }, [itineraryActivity?.id, isExpanded]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const atTop = y <= 2;
    setIsAtTop(atTop);
    onScrollAtTopChange?.(atTop);
  };

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const yOffset = insets.top + 60;
  const parentHeight = screenHeight - yOffset;
  const paddingBottom = 100; //parentHeight * 0.35 + 40; // 35% sheet height + extra spacing

  if (!itineraryActivity) return null;

  // const activityColor = activityIcons.find((icon) => icon.name === itineraryActivity.type)?.color || "#9E9E9E";

  const renderDetails = () => {
    switch (itineraryActivity.type) {
      case ActivityType.flight:
        return <FlightDetails data={itineraryActivity.flightDetails} />;
      case ActivityType.stay:
        return <AccomodationDetails data={itineraryActivity.accomodationDetails} onFullScreenChange={onFullScreenChange} />;
      // case ActivityType.cafeRestaurant:
      //   return (
      //     <CafeRestaurantDetails
      //       data={itineraryActivity.cafeRestaurantDetails}
      //       activityStartDate={itineraryActivity.startDate}
      //       onFullScreenChange={onFullScreenChange}
      //     />
      //   );
      // case ActivityType.nature:
      //   return (
      //     <NatureDetails
      //       data={itineraryActivity.natureDetails}
      //       activityStartDate={itineraryActivity.startDate}
      //       onFullScreenChange={onFullScreenChange}
      //     />
      //   );
      // case ActivityType.shopppingAndService:
      //   return <ShoppingDetails data={itineraryActivity.shoppingDetails} onFullScreenChange={onFullScreenChange} />;
      // case ActivityType.entertainmentAndRecreation:
      //   return (
      //     <EntertainmentDetails
      //       data={itineraryActivity.entertainmentDetails}
      //       activityStartDate={itineraryActivity.startDate}
      //       onFullScreenChange={onFullScreenChange}
      //     />
      //   );
      // case ActivityType.walk:
      //   return <WalkDetails data={itineraryActivity.walkDetails} />;
      // case ActivityType.sightseeing:
      //   return <SightseeingDetails data={itineraryActivity.sightseeingDetails} onFullScreenChange={onFullScreenChange} />;
      // case ActivityType.preparation:
      //   return <PreparationDetails data={itineraryActivity.preparationDetails} />;
      // case ActivityType.hikeOrCamp:
      //   return <HikeOrCampDetails data={itineraryActivity.hikeOrCampDetails} onFullScreenChange={onFullScreenChange} />;
      case ActivityType.transit:
        return <TransportationDetails data={itineraryActivity.transportationDetails} onFullScreenChange={onFullScreenChange} />;
      case ActivityType.rideRental:
        return <RideRentalDetails data={itineraryActivity.rideRentalDetails} onFullScreenChange={onFullScreenChange} />;
      // case ActivityType.meetup:
      //   return <MeetupDetails data={itineraryActivity.meetupDetails} onFullScreenChange={onFullScreenChange} />;
      case ActivityType.plan:
      default:
        return <PlanDetails activity={itineraryActivity} onFullScreenChange={onFullScreenChange} />;
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={shouldScroll}
        scrollEnabled={shouldScroll}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        className="flex-1"
      >
        <View className="px-3">
          {renderDetails()}
        </View>
      </ScrollView>
    </View>
  );
};

export default DetailsTab;





