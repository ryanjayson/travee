import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions, PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { FAB, Portal, Provider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activityIcons } from "../../../../../components/ActivityIcon";
import { FadeInView } from "../../../../../components/animations";
import TouchButton from "../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../components/Tabs";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useItineraryActivity } from "../../../hooks/useActivity";
import { useTravelPlan } from "../../../hooks/useTravel";
import ChecklistTab from "./Tabs/ChecklistTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import FilesTab from "./Tabs/FilesTab";
import NotesTab from "./Tabs/NotesTab";

import { ActivityType, getActivityTypeLabel } from "../../../../../types/enums";
import { ItineraryActivity, ItineraryExpense, ItineraryNote } from "../../../types/TravelDto";

import { hasActivityData } from "./Tabs/Details/DetailComponents";

interface ViewTripActivityProps {
  id: string;
  onClose: () => void;
  translateY?: Animated.Value;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const getActivityDetailData = (activity: ItineraryActivity | null) => {
  if (!activity) return null;
  switch (activity.type) {
    case ActivityType.flight:
      return activity.flightDetails;
    case ActivityType.stay:
      return activity.accomodationDetails;
    case ActivityType.cafeRestaurant:
      return activity.cafeRestaurantDetails;
    case ActivityType.nature:
      return activity.natureDetails;
    case ActivityType.shopppingAndService:
      return activity.shoppingDetails;
    case ActivityType.entertainmentAndRecreation:
      return activity.entertainmentDetails;
    case ActivityType.transit:
      return activity.transportationDetails;
    // case ActivityType.walk:
    // return activity.walkDetails;
    case ActivityType.sightseeing:
      return activity.sightseeingDetails;
    case ActivityType.preparation:
      return activity.preparationDetails;
    case ActivityType.hikeOrCamp:
      return activity.hikeOrCampDetails;
    case ActivityType.rideRental:
      return activity.rideRentalDetails;
    default:
      return (
        activity.restDetails ||
        activity.motorcycleRideDetails ||
        activity.meetupDetails ||
        null
      );
  }
};

const is60PercentSnap = (type?: ActivityType) => {
  if (type == null) return false;
  return [
    ActivityType.preparation,
    ActivityType.shopppingAndService,
    ActivityType.nature,
    ActivityType.sightseeing,
    // ActivityType.walk,
    ActivityType.entertainmentAndRecreation,
    ActivityType.cafeRestaurant,
  ].includes(type);
};

const hasActivityDetails = (activity?: ItineraryActivity | null) => {
  if (!activity) return false;
  switch (activity.type) {
    case ActivityType.flight:
      return !!activity.flightDetails;
    case ActivityType.stay:
      return !!activity.accomodationDetails;
    case ActivityType.cafeRestaurant:
      return !!activity.cafeRestaurantDetails;
    case ActivityType.nature:
      return !!activity.natureDetails;
    case ActivityType.shopppingAndService:
      return !!activity.shoppingDetails;
    case ActivityType.entertainmentAndRecreation:
      return !!activity.entertainmentDetails;
    // case ActivityType.walk:
    //   return !!activity.walkDetails;
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

const ViewItineraryActivity = ({ id, onClose, translateY: translateYProp, onSwipeLeft, onSwipeRight, hasNext = false, hasPrev = false }: ViewTripActivityProps) => {
  const {
    data: itineraryActivity,
    isLoading,
    isError,
    error,
    refetch,
  } = useItineraryActivity(id);

  const travelId = itineraryActivity?.travelId || "";
  const { data: travelPlan } = useTravelPlan(travelId);

  const sectionName = useMemo(() => {
    if (!travelPlan?.itinerarySection || !itineraryActivity?.sectionId) return null;
    const section = travelPlan.itinerarySection.find(
      (s) => s.id?.toString() === itineraryActivity.sectionId?.toString()
    );
    if (section && !section.isDefaultSection && section.title) {
      return section.title;
    }
    return null;
  }, [travelPlan?.itinerarySection, itineraryActivity?.sectionId]);

  const [fabOpen, setFabOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showMoreButton, setShowMoreButton] = useState<boolean>(false);
  const { openExpenseModal, openNoteModal } = useTravelContext();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const isImageViewerOpenRef = useRef(false);
  isImageViewerOpenRef.current = isImageViewerOpen;

  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const isMapFullScreenRef = useRef(false);
  isMapFullScreenRef.current = isMapFullScreen;

  // ─── Horizontal swipe for activity navigation ───────────────────────────────
  const { width: screenWidth } = Dimensions.get("window");
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current; // fade-in for new content
  const isSwipeAnimating = useRef(false);

  // Derive opacity and scale from horizontal drag position (gallery-style fade)
  const swipeOpacity = translateX.interpolate({
    inputRange: [-screenWidth, -screenWidth * 0.3, 0, screenWidth * 0.3, screenWidth],
    outputRange: [0, 0.4, 1, 0.4, 0],
    extrapolate: "clamp",
  });
  const swipeScale = translateX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [0.92, 1, 0.92],
    extrapolate: "clamp",
  });

  // Keep swipe callbacks in refs to avoid stale closures in PanResponder
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const hasNextRef = useRef(hasNext);
  const hasPrevRef = useRef(hasPrev);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;
  hasNextRef.current = hasNext;
  hasPrevRef.current = hasPrev;

  // Reset horizontal position + fade in new content when activity ID changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
    setShowMoreButton(false);
    translateX.setValue(0);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [id]);

  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (isImageViewerOpenRef.current || isMapFullScreenRef.current) return false;
        // Only claim horizontal gestures, ignore vertical
        const isHorizontal = Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 3;
        return isHorizontal && !isSwipeAnimating.current;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        if (isImageViewerOpenRef.current || isMapFullScreenRef.current) return false;
        const isHorizontal = Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 5;
        return isHorizontal && !isSwipeAnimating.current;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        // Add resistance when swiping past bounds (no next/prev)
        const canGoLeft = hasNextRef.current; // swipe left = go to next
        const canGoRight = hasPrevRef.current; // swipe right = go to prev
        let dx = gs.dx;
        if ((dx < 0 && !canGoLeft) || (dx > 0 && !canGoRight)) {
          dx = dx * 0.25; // rubber-band resistance
        }
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gs) => {
        const SWIPE_THRESHOLD = 25;
        const VELOCITY_THRESHOLD = 0.15;
        const swipedLeft = gs.dx < -SWIPE_THRESHOLD || gs.vx < -VELOCITY_THRESHOLD;
        const swipedRight = gs.dx > SWIPE_THRESHOLD || gs.vx > VELOCITY_THRESHOLD;
        if (swipedLeft && hasNextRef.current) {
          // Slide content off to the left
          isSwipeAnimating.current = true;
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            isSwipeAnimating.current = false;
            onSwipeLeftRef.current?.();
          });
        } else if (swipedRight && hasPrevRef.current) {
          // Slide content off to the right
          isSwipeAnimating.current = true;
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            isSwipeAnimating.current = false;
            onSwipeRightRef.current?.();
          });
        } else {
          // Bounce back
          Animated.spring(translateX, {
            toValue: 0,
            tension: 120,
            friction: 12,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          tension: 120,
          friction: 12,
          useNativeDriver: false,
        }).start();
      },
    })

  ).current;

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const yOffset = insets.top + 60; // Estimated parent modal header offset
  const parentHeight = screenHeight - yOffset;

  // Snap points represent the translateY value (offset from top of parent container)
  // 90% sheet height: translateY = parentHeight * 0.1
  // Min sheet height: 25% sheet height -> 0.75 offset
  const description = itineraryActivity?.description?.trim();
  const SNAP_EXTENDED = description && description.length > 0 ? 166 : 140;
  const SNAP_90 = parentHeight * 0.1;
  const SNAP_MIN = parentHeight - SNAP_EXTENDED;

  const initialDetailData = getActivityDetailData(itineraryActivity);
  const initialHasDetails = hasActivityData(initialDetailData);
  const initialSnapPoint = (itineraryActivity?.type === ActivityType.none || !initialHasDetails) ? SNAP_90 : SNAP_MIN;

  const snappedY = useRef(initialSnapPoint);
  const dragStartY = useRef(0);

  // Use passed translateY prop or fallback to local Animated.Value
  const translateYRef = useRef(translateYProp || new Animated.Value(initialSnapPoint));
  const translateY = translateYProp || translateYRef.current;
  const [currentSnap, setCurrentSnap] = useState(initialSnapPoint);

  // Dynamically update snap configurations once itineraryActivity loads
  React.useEffect(() => {
    if (itineraryActivity) {
      const isNoType = itineraryActivity.type === ActivityType.none;
      const detailData = getActivityDetailData(itineraryActivity);
      const hasDetails = hasActivityData(detailData);

      const targetSnap = (isNoType || !hasDetails) ? SNAP_90 : SNAP_MIN;

      snappedY.current = targetSnap;
      setCurrentSnap(targetSnap);

      Animated.spring(translateY, {
        toValue: targetSnap,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }).start();

      if (targetSnap === SNAP_MIN) {
        setIsDescriptionExpanded(false);
      }
    }
  }, [itineraryActivity?.id, parentHeight, SNAP_MIN, SNAP_90]);

  const detailData = getActivityDetailData(itineraryActivity);
  const hasDetails = hasActivityData(detailData);
  const canSnap = itineraryActivity?.type !== ActivityType.none && hasDetails;
  const canSnapRef = useRef(canSnap);
  canSnapRef.current = canSnap;

  // Slowly changing black overlay opacity as sheet is panned/scrolled towards SNAP_90
  const rangeEnd = SNAP_MIN;
  const overlayOpacity = translateY.interpolate({
    inputRange: [SNAP_90, rangeEnd],
    outputRange: [0.55, 0.04],
    extrapolate: "clamp",
  });

  const snapTo = (toValue: number) => {
    if (!canSnapRef.current && toValue !== SNAP_90) {
      return;
    }
    snappedY.current = toValue;
    setCurrentSnap(toValue);
    Animated.spring(translateY, {
      toValue,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();

    if (toValue === SNAP_MIN) {
      setIsDescriptionExpanded(false);
    }
  };

  const snap90Ref = useRef(SNAP_90);
  const snapMinRef = useRef(SNAP_MIN);
  const parentHeightRef = useRef(parentHeight);
  const snapToRef = useRef(snapTo);

  snap90Ref.current = SNAP_90;
  snapMinRef.current = SNAP_MIN;
  parentHeightRef.current = parentHeight;
  snapToRef.current = snapTo;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (isMapFullScreenRef.current || !canSnapRef.current) return false;
        const touchStartRelativeY = evt.nativeEvent.pageY - (yOffset + snappedY.current);
        return touchStartRelativeY > -30 && touchStartRelativeY < 180;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (isMapFullScreenRef.current || !canSnapRef.current) return false;
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 8;
        if (!isVertical) return false;

        const touchStartRelativeY = evt.nativeEvent.pageY - (yOffset + snappedY.current);
        return touchStartRelativeY > -30 && touchStartRelativeY < 180;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (isMapFullScreenRef.current || !canSnapRef.current) return false;
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
        const clampedY = Math.max(snap90Ref.current, Math.min(snapMinRef.current, nextY));
        translateY.setValue(clampedY - dragStartY.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const nextY = dragStartY.current + gestureState.dy;
        const velocityY = gestureState.vy;

        let target = snapMinRef.current;
        if (velocityY < -0.3) {
          target = snap90Ref.current;
        } else if (velocityY > 0.3) {
          target = snapMinRef.current;
        } else {
          const dist90 = Math.abs(nextY - snap90Ref.current);
          const distMin = Math.abs(nextY - snapMinRef.current);
          target = dist90 < distMin ? snap90Ref.current : snapMinRef.current;
        }
        snapToRef.current(target);
      },
      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        snapToRef.current(snappedY.current);
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
          <Text className="mt-2 text-gray-600">Loading activity details</Text>
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
        initialActiveTabId="checklist"
        expanded={true}
        applyFadeAnimation={false}
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
      isVisible: false,
      title: "Expenses",
      icon: "receipt",
      content: <ExpensesTab activityId={id} onEditExpense={handleEditExpense} />
      ,
    },
    { id: "checklist", title: "Checklists", icon: "checklist", content: <ChecklistTab activityId={id} itineraryActivity={itineraryActivity} /> },

    {
      id: "notes",
      isVisible: false,
      title: "Notes",
      icon: "note",
      content: <NotesTab activityId={id} onEditNote={handleEditNote} />,
    },
    { id: "files", title: "Files", icon: "description", content: <FilesTab itineraryActivity={itineraryActivity} onImageViewerToggle={setIsImageViewerOpen} /> },
  ];

  return (
    <Provider>
      <View className="flex-1">

        {/* Horizontal swipe wrapper — covers entire screen for easy swiping */}
        <Animated.View
          {...swipePanResponder.panHandlers}
          style={{
            flex: 1,
            transform: [{ translateX }, { scale: swipeScale }],

            // opacity: Animated.multiply(swipeOpacity, fadeAnim),
          }}
        >

          {/* Background Details Tab */}
          <View style={{
            height: parentHeight, width: "100%",
          }}>
            <DetailsTab itineraryActivity={itineraryActivity} onFullScreenChange={setIsMapFullScreen} />
            {/* Animated Black Overlay */}
            <TouchableWithoutFeedback
              onPress={() => snapTo(SNAP_MIN)}
              disabled={currentSnap === SNAP_MIN || !canSnap}
            >
              <Animated.View
                pointerEvents={(currentSnap === SNAP_MIN || !canSnap) ? "none" : "auto"}
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
            </TouchableWithoutFeedback>
          </View>

          {/* Snappable Bottom Form Sheet */}
          <Animated.View
            {...(canSnap ? panResponder.panHandlers : {})}
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
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 1,
                shadowRadius: 26,
                elevation: 34,
              },
            ]}
          >
            {/* Drag Handle */}
            <View className="w-full items-center pt-3 pb-2 bg-transparent rounded-t-[32px]">
              {canSnap && <View className="w-10 h-1 bg-gray-300 rounded-full" />}
            </View>

            {sectionName && (
              <View className="items-center py-1 px-md absolute -top-[28px] left-lg">
                <Text
                  className="font-semibold tracking-wide text-md text-white"
                  style={{
                    textShadowColor: "rgba(0, 0, 0, 0.75)",
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 10,
                  }}
                >
                  {sectionName}
                </Text>
              </View>
            )}
            {/* Activity header with edit button */}
            <View className="px-5 pb-2 bg-white mt-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <FadeInView key={`title-${id}`} type="up" delay={50} duration={350}>
                    {itineraryActivity?.type != null && itineraryActivity.type !== ActivityType.plan && (
                      <View className={`flex-row items-center -mt-2 mb-2`}>
                        <View
                          style={{ backgroundColor: getActivityTypeDetails(itineraryActivity.type).color + '20' }}
                          className="items-end rounded-xs px-2 py-0.5"
                        >
                          <Text
                            style={{ color: getActivityTypeDetails(itineraryActivity.type).color }}
                            className="text-[8px] tracking-wider uppercase font-extrabold"
                          >
                            {getActivityTypeDetails(itineraryActivity.type).text}
                          </Text>
                        </View>
                      </View>
                    )}
                    <Text className="text-xl font-semibold" style={{ paddingBottom: description ? 6 : 0 }}>{itineraryActivity?.title}</Text>
                  </FadeInView>

                  {description && (
                    <FadeInView key={`desc-${id}`} type="up" delay={120} duration={350}>
                      <View className="">
                        {/* Hidden text element for un-truncated line measurement */}
                        <Text
                          style={{ position: "absolute", opacity: 0, zIndex: -1000 }}
                          className="text-base text-[#999] leading-6"
                          onTextLayout={(e) => {
                            setShowMoreButton(e.nativeEvent.lines.length > 1);
                          }}
                        >
                          {description}
                        </Text>

                        {/* Visible description text with Show More / Show Less button on same line */}
                        {showMoreButton && !isDescriptionExpanded ? (
                          <View className="flex-row items-center">
                            <Text
                              className="flex-1 text-base text-[#999] leading-6"
                              numberOfLines={1}
                            >
                              {description}
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                if (canSnap && snappedY.current !== SNAP_90) {
                                  snapTo(SNAP_90);
                                }
                                setIsDescriptionExpanded(true);
                              }}
                              accessibilityRole="button"
                              className="ml-1"
                            >
                              <Text className="text-sm text-secondary font-medium underline">
                                Show more
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text className="text-base text-[#999] leading-6">
                            {description}
                            {showMoreButton && isDescriptionExpanded && (
                              <Text
                                onPress={() => {
                                  setIsDescriptionExpanded(false);
                                }}
                                accessibilityRole="button"
                                className="text-sm text-secondary font-medium underline"
                              >
                                {" Show less"}
                              </Text>
                            )}
                          </Text>
                        )}
                      </View>
                    </FadeInView>
                  )}
                </View>
              </View>
            </View>

            {/* Tabs */}
            <Pressable
              onPress={() => {
                if (canSnap && snappedY.current !== SNAP_90) {
                  snapTo(SNAP_90);
                }
              }}
              className="flex-1 "
            >
              <FadeInView key={`tabs-${id}`} type="up" delay={180} duration={400} style={{ flex: 1 }}>
                {renderContent()}
              </FadeInView>
            </Pressable>
          </Animated.View>

          {/* TODO: show when expense implemented */}
          <Portal>
            <FAB.Group
              open={fabOpen}
              visible={false}
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
        </Animated.View>
      </View>
    </Provider>
  );
};

export default ViewItineraryActivity;