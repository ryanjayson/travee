import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
  PanResponder,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TouchButton from "../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../components/Tabs";
import { Typography } from "../../../../../styles/common";
import { useItineraryActivity } from "../../../hooks/useActivity";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import NotesTab from "./Tabs/NotesTab";
import ChecklistTab from "./Tabs/ChecklistTab";
import { FAB, Icon, Portal, Provider } from "react-native-paper";
import { useTravelContext } from "../../../../../context/TravelContext";
import { activityIcons } from "../../../../../components/ActivityIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ItineraryActivity, ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";
import { ActivityType, getActivityTypeLabel } from "../../../../../types/enums";

interface ViewTripActivityProps {
  id: string;
  onClose: () => void;
  translateY?: Animated.Value;
}

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

const ViewItineraryActivity = ({ id, onClose, translateY: translateYProp }: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
  } = useItineraryActivity(id);

  const [fabOpen, setFabOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showMoreButton, setShowMoreButton] = useState<boolean>(false);
  const { openExpenseModal, openNoteModal } = useTravelContext();

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const yOffset = insets.top + 60; // Estimated parent modal header offset
  const parentHeight = screenHeight - yOffset;

  // Snap points represent the translateY value (offset from top of parent container)
  // 90% sheet height: translateY = parentHeight * 0.1
  // Min sheet height: based on activity type (60% for preparation -> 0.4 offset; 35% default -> 0.65 offset)
  const SNAP_90 = parentHeight * 0.1;
  const hasDetails = hasActivityDetails(itineraryActivity);
  const SNAP_MIN = hasDetails
    ? (is60PercentSnap(itineraryActivity?.type) ? parentHeight * 0.4 : parentHeight * 0.65)
    : SNAP_90;

  const snappedY = useRef(SNAP_MIN);
  const dragStartY = useRef(0);

  // Use passed translateY prop or fallback to local Animated.Value
  const translateYRef = useRef(translateYProp || new Animated.Value(SNAP_MIN));
  const translateY = translateYProp || translateYRef.current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_MIN);

  // Dynamically update snap configurations once itineraryActivity loads
  React.useEffect(() => {
    if (itineraryActivity) {
      const minSnap = hasActivityDetails(itineraryActivity)
        ? (is60PercentSnap(itineraryActivity.type) ? parentHeight * 0.4 : parentHeight * 0.65)
        : SNAP_90;
      snappedY.current = minSnap;
      setCurrentSnap(minSnap);
      translateY.setValue(minSnap);
    }
  }, [itineraryActivity, parentHeight, SNAP_90]);

  // Slowly changing black overlay opacity as sheet is panned/scrolled towards SNAP_90
  const rangeEnd = SNAP_MIN === SNAP_90 ? SNAP_90 + 1 : SNAP_MIN;
  const overlayOpacity = translateY.interpolate({
    inputRange: [SNAP_90, rangeEnd],
    outputRange: [0.55, 0],
    extrapolate: "clamp",
  });

  const snapTo = (toValue: number) => {
    snappedY.current = toValue;
    setCurrentSnap(toValue);
    Animated.spring(translateY, {
      toValue,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const touchStartRelativeY = evt.nativeEvent.pageY - (yOffset + snappedY.current);
        return touchStartRelativeY > -30 && touchStartRelativeY < 180;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 8;
        if (!isVertical) return false;

        const touchStartRelativeY = evt.nativeEvent.pageY - (yOffset + snappedY.current);
        return touchStartRelativeY > -30 && touchStartRelativeY < 180;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
        if (!isVertical) return false;

        const touchStartRelativeY = evt.nativeEvent.pageY - (yOffset + snappedY.current);
        return touchStartRelativeY > -30 && touchStartRelativeY < 180;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartY.current = snappedY.current;
        translateY.setOffset(snappedY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = dragStartY.current + gestureState.dy;
        const clampedY = Math.max(SNAP_90, Math.min(parentHeight, nextY));
        translateY.setValue(clampedY - dragStartY.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const nextY = dragStartY.current + gestureState.dy;
        const velocityY = gestureState.vy;

        let target = SNAP_MIN;
        if (velocityY < -0.3) {
          target = SNAP_90;
        } else if (velocityY > 0.3) {
          target = SNAP_MIN;
        } else {
          const dist90 = Math.abs(nextY - SNAP_90);
          const distMin = Math.abs(nextY - SNAP_MIN);
          target = dist90 < distMin ? SNAP_90 : SNAP_MIN;
        }
        snapTo(target);
      },
      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        snapTo(snappedY.current);
      },
    })
  ).current;

  // Stable callbacks so tabs don't re-render on unrelated state changes
  const handleOpenAddExpense = useCallback(() => {
    setFabOpen(false);
    openExpenseModal(
      {
        activityId: id,
        travelId: itineraryActivity?.travelId,
        title: "",
        amount: 0,
        dateTime: new Date(),
      } as ItineraryExpense,
      id,
      itineraryActivity ? [itineraryActivity] : []
    );
  }, [id, itineraryActivity, openExpenseModal]);


  const getActivityTypeDetails = (type: any) => {
    if (type == null) return { text: "None", color: "#9E9E9E" };
    const iconConfig = activityIcons.find((i) => i.activityType === type);
    const color = iconConfig?.color ?? "#9E9E9E";
    const text = type != null ? getActivityTypeLabel(type) : "None";
    return { text, color };
  };

  const handleOpenAddNote = useCallback(() => {
    setFabOpen(false);
    openNoteModal(
      {
        activityId: id,
        travelId: itineraryActivity?.travelId,
        title: "",
      } as ItineraryNote,
      itineraryActivity ? [itineraryActivity] : []
    );
  }, [id, itineraryActivity, openNoteModal]);

  const handleEditExpense = useCallback((expense: ItineraryExpense) => {
    openExpenseModal(
      expense,
      id,
      itineraryActivity ? [itineraryActivity] : []
    );
  }, [id, itineraryActivity, openExpenseModal]);

  const handleEditNote = useCallback((note: ItineraryNote) => {
    openNoteModal(note, itineraryActivity ? [itineraryActivity] : []);
  }, [itineraryActivity, openNoteModal]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#263F69" />
          <Text className="mt-2 text-gray-600">Loading activity details...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-600 text-sm mb-4 text-center">
            Error: {error?.message || "Failed to load activity."}
          </Text>
          <TouchButton buttonText="Retry" onPress={() => refetch()} />
        </View>
      );
    }

    return (
      <Tabs
        tabs={tabData}
        type="default"
        initialActiveTabId="expenses"
        expanded={true}
        onTabChange={() => {
          if (snappedY.current !== SNAP_90) {
            snapTo(SNAP_90);
          }
        }}
      />
    );
  };

  const tabData = [
    // { id: "details", title: "Details",  content: <DetailsTab itineraryActivity={itineraryActivity} /> },
    // { id: "details", title: "Details",  content: <View><Text>Detail</Text></View> },
    {
      id: "expenses",
      title: "Expenses",
      icon: "receipt",
      content: <ExpensesTab activityId={id} onEditExpense={handleEditExpense} />
,
    },
    { id: "checklist", title: "Checklist", icon: "checklist", content: <ChecklistTab activityId={id} /> },

    {
      id: "notes",
      title: "Notes",
      icon: "note",
      content: <NotesTab activityId={id} onEditNote={handleEditNote} />,
    },
    { id: "files", title: "Files", icon: "description", content: <></> },
  ];

  return (
    <Provider>
      <View className="flex-1 bg-white">

        {/* Image gallery */}
        {/* {itineraryActivity?.images && itineraryActivity.images.length > 0 && (
          <View className="my-1">
            <FlatList
              data={itineraryActivity.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => `${item.url}-${idx}`}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setActiveImageIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={{ width: Dimensions.get("window").width, height: 200 }}
                  resizeMode="cover"
                />
              )}
            />
            {itineraryActivity.images.length > 1 && (
              <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5">
                {itineraryActivity.images.map((_, idx) => (
                  <View
                    key={idx}
                    className={`w-2 h-2 rounded-full ${idx === activeImageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </View>
            )}
          </View>
        )} */}

        {/* Background Details Tab */}
        <Pressable
          onPress={() => {
            if (snappedY.current !== SNAP_MIN) {
              snapTo(SNAP_MIN);
            }
          }}
          style={{ height: parentHeight, width: "100%" }}
        >
          <DetailsTab itineraryActivity={itineraryActivity} />
          {/* Animated Black Overlay */}
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
            }}
          />
        </Pressable>

        {/* Snappable Bottom Form Sheet */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            {
              transform: [{ translateY }],
              height: parentHeight,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              // borderWidth: 2,
              borderBottomWidth: 0,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 1, height: 1},
              shadowOpacity: 1,
              shadowRadius: 26,
              elevation: 34,
            },
          ]}
        >
          {/* Drag Handle */}
          <View className="w-full items-center pt-3 pb-1 bg-white rounded-t-3xl">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          {/* Activity header with edit button */}
          <View className="px-5 pt-2 pb-2 bg-white">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                {itineraryActivity?.type != null && itineraryActivity.type !== ActivityType.none && (
                   <View className={`flex-row items-center`}>
                    <View 
                        style={{ backgroundColor: getActivityTypeDetails(itineraryActivity.type).color + '20' }} 
                        className="items-end rounded-xs px-2 py-0.5"
                      >
                        <Text 
                          style={{ color: getActivityTypeDetails(itineraryActivity.type).color }} 
                          className="text-[10px] tracking-wider uppercase font-extrabold"
                        >
                          {getActivityTypeDetails(itineraryActivity.type).text}
                        </Text>
                      </View>
                    </View>
                )}
                <Text className="text-xl font-semibold mt-2">{itineraryActivity?.title}</Text>
                  {itineraryActivity?.description && (
                      <View className="">
                        <Text 
                          className="text-base text-tertiary leading-6 mt-2"
                          numberOfLines={isDescriptionExpanded ? undefined : 2}
                          onTextLayout={(e) => {
                            if (!showMoreButton && e.nativeEvent.lines.length >= 2) {
                              setShowMoreButton(true);
                            }
                          }}
                        >
                          {itineraryActivity?.description || null}
                        </Text>
                        {showMoreButton && (
                          <TouchableOpacity 
                            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            accessibilityRole="button"
                          >
                            <Text className="text-secondary font-medium mt-1">
                              {isDescriptionExpanded ? "Show less" : "Show more"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                  )}
              </View>
            </View>
          </View>

          {/* Tabs */}
          <Pressable
            onPress={() => {
              if (snappedY.current !== SNAP_90) {
                snapTo(SNAP_90);
              }
            }}
            className="flex-1 bg-gray-100"
          >
            {renderContent()}
          </Pressable>
        </Animated.View>

        {/* FAB Speed-dial */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={true}
            icon={fabOpen ? "close" : "plus"}
            actions={[
              {
                icon: "cash",
                label: "Add Expense",
                style: {
                    elevation: 0,
                    borderRadius: 50,
                    padding: 6,
                    backgroundColor: '#263F69',
                    marginRight: -6,
                    marginBottom: 10
                },
                color: 'white',
                onPress: handleOpenAddExpense,
              },
              {
                icon: "fountain-pen-tip",
                label: "Add Note",
                style: {
                    elevation: 0,
                    borderRadius: 50,
                    padding: 6,
                    backgroundColor: '#263F69',
                    marginRight: -6,
                    marginBottom: 10
                },
                color: 'white',
                onPress: handleOpenAddNote,
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={{
                backgroundColor: fabOpen ? '#82181a' : '#263F69',
                borderRadius: 50,
            }}
            color="white"
          />
        </Portal>
      </View>
    </Provider>
  );
};

export default ViewItineraryActivity;
