import React, { useRef, useState } from "react";
import { ScrollView, View, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { TripPlanType } from "../../../../../../types/enums";
import {
  FlightDetails,
  AccomodationDetails, TransportationDetails, RideRentalDetails,
  PlanDetails
} from "./Details/DetailComponents";

interface DetailsTabProps {
  itineraryActivity?: ItineraryActivity;
  onFullScreenChange?: (fullScreen: boolean) => void;
  scrollEnabled?: boolean;
  isMidSnap?: boolean;
  isExpanded?: boolean;
  onScrollAtTopChange?: (isAtTop: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}

const DetailsTab = ({
  itineraryActivity,
  onFullScreenChange,
  scrollEnabled = true,
  isMidSnap = false,
  isExpanded = false,
  onScrollAtTopChange,
  onEditActivity,
}: DetailsTabProps) => {
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Lock ScrollView when bottom sheet snap is mid.
  // Enable ScrollView when snap is expanded (so it can scroll up when content overflows).
  const shouldScroll = isMidSnap ? false : isExpanded ? true : scrollEnabled;

  React.useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setIsAtTop(true);
    onScrollAtTopChange?.(true);
  }, [itineraryActivity?.id, onScrollAtTopChange]);

  React.useEffect(() => {
    if (!isExpanded && !isMidSnap) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      setIsAtTop(true);
      onScrollAtTopChange?.(true);
    }
  }, [isExpanded, isMidSnap, onScrollAtTopChange]);

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
      case TripPlanType.flight:
        return <FlightDetails data={itineraryActivity.flightDetails} />;
      case TripPlanType.stay:
        return <AccomodationDetails data={itineraryActivity.accomodationDetails} onFullScreenChange={onFullScreenChange} />;
      case TripPlanType.transit:
        return <TransportationDetails data={itineraryActivity.transportationDetails} onFullScreenChange={onFullScreenChange} />;
      case TripPlanType.rideRental:
        return <RideRentalDetails data={itineraryActivity.rideRentalDetails} onFullScreenChange={onFullScreenChange} />;
      case TripPlanType.activity:
      default:
        return (
          <PlanDetails
            activity={itineraryActivity}
            onFullScreenChange={onFullScreenChange}
            onEditActivity={onEditActivity}
          />
        );
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollViewRef}
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





