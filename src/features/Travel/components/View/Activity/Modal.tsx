import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
import { useTravelPlan } from "../../../hooks/useTravel";
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

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const is60PercentSnap = (type?: ActivityType) => {
  if (type == null) return false;
  return [
    ActivityType.preparation,
    ActivityType.shopppingAndService,
    ActivityType.nature,
    ActivityType.sightseeing,
    ActivityType.walk,
    ActivityType.entertainmentAndRecreation,
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
    case ActivityType.walk:
      return !!activity.walkDetails;
    case ActivityType.sightseeing:
      return !!activity.sightseeingDetails;
    case ActivityType.preparation:
      return !!activity.preparationDetails;
    case ActivityType.hikeOrCamp:
      return !!activity.hikeOrCampDetails;
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

  // Track the currently displayed activity ID (may change via swipe)
  const [currentActivityId, setCurrentActivityId] = useState(id);

  // Reset currentActivityId when the modal opens with a new id
  useEffect(() => {
    if (showModal) {
      setCurrentActivityId(id);
    }
  }, [id, showModal]);
  
  // Fetch current activity data for Edit Modal and color
  const { data: itineraryActivity } = useItineraryActivity(currentActivityId);

  // Fetch the full travel plan to get the ordered list of all activities
  const travelId = itineraryActivity?.travelId || selectedTravelPlan?.id || "";
  const { data: travelPlan } = useTravelPlan(travelId);

  // Build flat ordered list of all activity IDs from itinerary sections
  const allActivityIds = useMemo(() => {
    if (!travelPlan?.itinerarySection) return [];
    return travelPlan.itinerarySection.flatMap(
      (section) => (section.itineraryActivity || []).map((a) => a.id).filter(Boolean) as string[]
    );
  }, [travelPlan]);

  // Current index in the ordered list
  const currentIndex = useMemo(() => {
    const idx = allActivityIds.indexOf(currentActivityId);
    return idx >= 0 ? idx : 0;
  }, [allActivityIds, currentActivityId]);

  const totalActivities = allActivityIds.length;
  const hasNext = currentIndex < totalActivities - 1;
  const hasPrev = currentIndex > 0;

  // Swipe navigation callbacks
  const handleSwipeLeft = useCallback(() => {
    if (hasNext) {
      setCurrentActivityId(allActivityIds[currentIndex + 1]);
    }
  }, [hasNext, allActivityIds, currentIndex]);

  const handleSwipeRight = useCallback(() => {
    if (hasPrev) {
      setCurrentActivityId(allActivityIds[currentIndex - 1]);
    }
  }, [hasPrev, allActivityIds, currentIndex]);
  
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);

  const handleCancel = () => setShowModal(false);

  const yOffset = insets.top + 60; // Estimated parent modal header offset
  const parentHeight = screenHeight - yOffset;

  const SNAP_EXTENDED = itineraryActivity?.description?.length !== undefined ? 0.74 : 0.82;
  const SNAP_90 = parentHeight * 0.1;
  const SNAP_MIN = parentHeight * SNAP_EXTENDED;

  const translateY = useRef(new Animated.Value(SNAP_MIN)).current;

  useEffect(() => {
    if (itineraryActivity) {
      translateY.setValue(SNAP_MIN);
    }
  }, [itineraryActivity, parentHeight, translateY, SNAP_MIN]);

  const activityColor = activityIcons.find((icon) => icon.name === itineraryActivity?.type)?.color || "#9E9E9E";

  const { animatedBgColor, overlayOpacity } = useMemo(() => {
    const rangeEnd = SNAP_MIN;

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
  }, [translateY, parentHeight, SNAP_90, SNAP_MIN]);


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

            <View style={{ flexDirection: "row", alignItems: "center", zIndex: 1 }}>
              <TouchableOpacity
                onPress={handleCancel}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                style={{ padding: 4 }}
              >
                <View className="p-2 rounded-full bg-white/10">
                  <Icon name="chevron-left" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Activity counter indicator */}
              {totalActivities > 1 && (
                <Text style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  fontWeight: "600",
                  marginLeft: 4,
                }}>
                  {currentIndex + 1} of {totalActivities}
                </Text>
              )}
            </View>

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

          <Activity
            id={currentActivityId}
            onClose={handleCancel}
            translateY={translateY}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            hasNext={hasNext}
            hasPrev={hasPrev}
          />
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
