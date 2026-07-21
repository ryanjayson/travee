import React, { useState, useCallback, useRef, useEffect } from "react";
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
  TouchableWithoutFeedback,
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
import FilesTab from "./Tabs/FilesTab";
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
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

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

const ViewItineraryActivity = ({ id, onClose, translateY: translateYProp, onSwipeLeft, onSwipeRight, hasNext = false, hasPrev = false }: ViewTripActivityProps) => {
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
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const isImageViewerOpenRef = useRef(false);
  isImageViewerOpenRef.current = isImageViewerOpen;

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
        if (isImageViewerOpenRef.current) return false;
        // Only claim horizontal gestures, ignore vertical
        const isHorizontal = Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 3;
        return isHorizontal && !isSwipeAnimating.current;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        if (isImageViewerOpenRef.current) return false;
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
  const SNAP_EXTENDED = itineraryActivity?.description && itineraryActivity.description.length > 0 ? 0.78 : 0.81;
  const SNAP_90 = parentHeight * 0.1;
  const SNAP_MIN = parentHeight * SNAP_EXTENDED;

  const snappedY = useRef(SNAP_MIN);
  const dragStartY = useRef(0);

  // Use passed translateY prop or fallback to local Animated.Value
  const translateYRef = useRef(translateYProp || new Animated.Value(SNAP_MIN));
  const translateY = translateYProp || translateYRef.current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_MIN);

  // Dynamically update snap configurations once itineraryActivity loads
  React.useEffect(() => {
    if (itineraryActivity) {
      const isNoType = itineraryActivity.type === ActivityType.none;
      const isAt90 = Math.abs(snappedY.current - SNAP_90) < 1;
      const targetSnap = (isNoType || isAt90) ? SNAP_90 : SNAP_MIN;

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
  }, [itineraryActivity, parentHeight, SNAP_MIN, SNAP_90]);

  // Slowly changing black overlay opacity as sheet is panned/scrolled towards SNAP_90
  const rangeEnd = SNAP_MIN;
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
    { id: "checklist", title: "Checklist", icon: "checklist", content: <ChecklistTab activityId={id} itineraryActivity={itineraryActivity} /> },

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
          <View style={{ height: parentHeight, width: "100%" ,
            }}>
            <DetailsTab itineraryActivity={itineraryActivity} />
            {/* Animated Black Overlay */}
            <TouchableWithoutFeedback
              onPress={() => snapTo(SNAP_MIN)}
              disabled={currentSnap === SNAP_MIN || itineraryActivity?.type === ActivityType.none}
            >
              <Animated.View
                pointerEvents={(currentSnap === SNAP_MIN || itineraryActivity?.type === ActivityType.none) ? "none" : "auto"}
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
            {...(itineraryActivity?.type !== ActivityType.none ? panResponder.panHandlers : {})}
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
            <View className="w-full items-center pt-3 pb-1 bg-transparent rounded-t-[32px]">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* Activity header with edit button */}
            <View className="px-5 pb-2 bg-white mt-2">
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
                            className="text-[8px] tracking-wider uppercase font-extrabold"
                          >
                            {getActivityTypeDetails(itineraryActivity.type).text}
                          </Text>
                        </View>
                      </View>
                  )}
                  <Text className="text-xl font-semibold">{itineraryActivity?.title}</Text>
                    {itineraryActivity?.description && (
                        <View className="">
                          <Text 
                            className="text-base text-[#999] leading-6"
                            numberOfLines={isDescriptionExpanded ? undefined : 1}
                            onTextLayout={(e) => {
                              if (!showMoreButton && e.nativeEvent.lines.length >= 1) {
                                setShowMoreButton(true);
                              }
                            }}
                          >
                            {itineraryActivity?.description || null}
                          </Text>
                          {showMoreButton && (
                            <TouchableOpacity 
                              onPress={() => {
                                if (snappedY.current !== SNAP_90) {
                                  snapTo(SNAP_90);
                                }
                                setIsDescriptionExpanded(!isDescriptionExpanded)
                              }}
                              accessibilityRole="button"
                            >
                              <Text className="text-sm text-secondary font-medium -mb-1 underline">
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
              className="flex-1 "
            >
              {renderContent()}
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