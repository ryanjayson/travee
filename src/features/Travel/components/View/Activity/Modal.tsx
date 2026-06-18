import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import Activity from ".";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useItineraryActivity } from "../../../hooks/useActivity";
import ActivityModal from "../../Edit/Itinerary/Activity/Modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { activityIcons } from "../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../types/enums";
import { ItineraryActivity } from "../../../types/TravelDto";

// AnimatedIcon removed to prevent TypeError on setNativeProps

interface ViewActivityModalProps {
  id: string;
  showModal?: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const { height: screenHeight } = Dimensions.get("window");

const is60PercentSnap = (type?: ActivityType) => {
  if (type == null) return false;
  return [
    ActivityType.preparation,
    ActivityType.shopppingAndService,
    ActivityType.nature,
    ActivityType.transportation,
    ActivityType.sightseeing,
    ActivityType.rest,
    ActivityType.walk,
    ActivityType.meetup,
    ActivityType.entertainmentAndRecreation,
    ActivityType.motorcycleRide,
    ActivityType.cafeRestaurant,
  ].includes(type);
};

const hasActivityDetails = (activity?: ItineraryActivity | null) => {
  if (!activity) return false;
  switch (activity.type) {
    case ActivityType.flight:
      return !!activity.flightDetails;
    case ActivityType.accomodation:
      return !!activity.accomodationDetails;
    case ActivityType.cafeRestaurant:
      return !!activity.cafeRestaurantDetails;
    case ActivityType.nature:
      return !!activity.natureDetails;
    case ActivityType.shopppingAndService:
      return !!activity.shoppingDetails;
    case ActivityType.entertainmentAndRecreation:
      return !!activity.entertainmentDetails;
    case ActivityType.transportation:
      return !!activity.transportationDetails;
    case ActivityType.walk:
      return !!activity.walkDetails;
    case ActivityType.sightseeing:
      return !!activity.sightseeingDetails;
    case ActivityType.preparation:
      return !!activity.preparationDetails;
    case ActivityType.rest:
      return !!activity.restDetails;
    case ActivityType.hikeOrCamp:
      return !!activity.hikeOrCampDetails;
    case ActivityType.motorcycleRide:
      return !!activity.motorcycleRideDetails;
    case ActivityType.meetup:
      return !!activity.meetupDetails;
    case ActivityType.rideRental:
      return !!activity.rideRentalDetails;
    default:
      return false;
  }
};

const ViewActivityModal = ({
  id,
  showModal = false,
  setShowModal,
}: ViewActivityModalProps) => {
  const insets = useSafeAreaInsets();
  const modalHeight = useMemo(() => screenHeight, []);
  const { selectedTravelPlan } = useTravelContext();
  const { keyboardVisible, isFloating } = useKeyboardVisible();
  
  // Fetch activity data here to pass to Edit Modal
  const { data: itineraryActivity } = useItineraryActivity(id);
  
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);

  const handleCancel = () => setShowModal(false);

  const yOffset = insets.top + 60; // Estimated parent modal header offset
  const parentHeight = screenHeight - yOffset;

  const SNAP_90 = parentHeight * 0.1;
  const hasDetails = hasActivityDetails(itineraryActivity);
  const SNAP_MIN = hasDetails
    ? (is60PercentSnap(itineraryActivity?.type) ? parentHeight * 0.4 : parentHeight * 0.65)
    : SNAP_90;

  const translateY = useRef(new Animated.Value(SNAP_MIN)).current;

  useEffect(() => {
    if (itineraryActivity) {
      const minSnap = hasActivityDetails(itineraryActivity)
        ? (is60PercentSnap(itineraryActivity.type) ? parentHeight * 0.4 : parentHeight * 0.65)
        : SNAP_90;
      translateY.setValue(minSnap);
    }
  }, [itineraryActivity, parentHeight, translateY, SNAP_90]);

  const activityColor = activityIcons.find((icon) => icon.name === itineraryActivity?.type)?.color || "#9E9E9E";

  const { animatedBgColor, overlayOpacity } = useMemo(() => {
    const minSnap = hasActivityDetails(itineraryActivity)
      ? (is60PercentSnap(itineraryActivity?.type) ? parentHeight * 0.4 : parentHeight * 0.65)
      : SNAP_90;
    const rangeEnd = minSnap === SNAP_90 ? SNAP_90 + 1 : minSnap;

    return {
      animatedBgColor: translateY.interpolate({
        inputRange: [SNAP_90, rangeEnd],
        outputRange: ["rgba(0, 0, 0, 0.55)", "transparent"],
        extrapolate: "clamp",
      }),
      overlayOpacity: translateY.interpolate({
        inputRange: [SNAP_90, rangeEnd],
        outputRange: [0.55, 0],
        extrapolate: "clamp",
      }),
    };
  }, [translateY, itineraryActivity, parentHeight, SNAP_90]);


  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleCancel}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: activityColor, justifyContent: "flex-start" }}>

        <Animated.View 
          style={{ 
            height: modalHeight, 
            backgroundColor: animatedBgColor,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflow: "hidden",
            paddingTop: insets.top,
          }}
        >
          {/* Header View using activity background color, showing only back and edit icons */}
          <View style={{ 
            height: 52, 
            width: "100%", 
            backgroundColor: activityColor,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            position: "relative",
          }}>
            {/* Background overlay is rendered first so that it sits behind buttons */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#000000",
                opacity: overlayOpacity,
                zIndex: 0,
              }}
            />

            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              style={{ padding: 4, zIndex: 1 }}
            >
              <View className="p-2 rounded-full bg-white/10">
                <Icon name="chevron-left" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEditActivityModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit activity"
              style={{ padding: 8, marginRight: 8, zIndex: 1 }}
            >
              <Icon name="edit" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Activity id={id} onClose={handleCancel} translateY={translateY} />
        </Animated.View>
      </View>

      {/* Edit Activity Modal */}
      {itineraryActivity && (
        <ActivityModal
          visible={showEditActivityModal}
          itineraryActivity={itineraryActivity}
          onClose={() => setShowEditActivityModal(false)}
        />
      )}
    </Modal>
  );
};

export default ViewActivityModal;
