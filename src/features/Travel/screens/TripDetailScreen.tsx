import * as React from "react";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GoogleMapView, { GoogleMapPin } from "../../../components/GoogleMapView";
import { useTravelPlan } from "../hooks/useTravel";
import { useTravelContext } from "../../../context/TravelContext";
import ViewTravel from "../components/View";
import Activity from "../components/View/Activity";
import TravelModals from "../components/TravelModals";
import TravelActionFAB from "../components/View/TravelActionFAB";
import { ActivityType } from "../../../types/enums";
import { activityIcons } from "../../../components/ActivityIcon";
import type { RootStackParamList } from "../../../navigation/navigation.types";

type TripDetailRouteProp = RouteProp<RootStackParamList, "TravelDetail">;

interface TripDetailScreenProps {
  travelId?: string;
  onBack?: () => void;
  connectorColor?: string;
}

const getActivityPinColor = (type?: ActivityType | number): string => {
  if (type == null) return "#263F69";
  const iconConfig = activityIcons.find((item) => item.activityType === type);
  return iconConfig ? iconConfig.color : "#263F69";
};

export const getActivityCoordinates = (act: any): { latitude: number; longitude: number } | null => {
  if (!act) return null;

  const extractCoords = (obj: any): { latitude: number; longitude: number } | null => {
    if (!obj) return null;
    let target = obj;
    if (typeof target === "string") {
      try {
        target = JSON.parse(target);
      } catch (e) {
        return null;
      }
    }
    if (!target || typeof target !== "object") return null;

    const c = target.coordinates || target;
    const lat =
      typeof c.latitude === "number"
        ? c.latitude
        : typeof c.latitude === "string"
          ? parseFloat(c.latitude)
          : NaN;
    const lng =
      typeof c.longitude === "number"
        ? c.longitude
        : typeof c.longitude === "string"
          ? parseFloat(c.longitude)
          : NaN;

    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  };

  return (
    extractCoords(act.destinationData) ||
    extractCoords(act.destinationAddressData) ||
    extractCoords(act.accomodationDetails?.destinationAddressData) ||
    extractCoords(act.accomodationDetails?.destinationData) ||
    extractCoords(act.sightseeingDetails?.destinationData) ||
    extractCoords(act.hikeOrCampDetails?.destinationData) ||
    extractCoords(act.natureDetails?.destinationData) ||
    extractCoords(act.cafeRestaurantDetails?.destinationData) ||
    extractCoords(act.entertainmentDetails?.destinationData) ||
    extractCoords(act.shoppingDetails?.destinationData) ||
    extractCoords(act.walkDetails?.destinationData) ||
    extractCoords(act.rideRentalDetails?.destinationData) ||
    extractCoords(act.motorcycleRideDetails?.destinationData) ||
    extractCoords(act.meetupDetails?.destinationData) ||
    extractCoords(act.coordinates) ||
    extractCoords(act)
  );
};

export const TripDetailScreen = ({
  travelId: propTravelId,
  onBack: propOnBack,
  connectorColor = "#0EA5E9",
}: TripDetailScreenProps) => {
  const route = useRoute<TripDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const travelId = propTravelId || route.params?.travelId;

  const { data: travelPlan, isLoading, refetch } = useTravelPlan(travelId);

  const {
    viewActivityId,
    openViewActivity,
    closeViewActivity,
    openActivityModal,
    openActivityTypeModal,
    openNoteModal,
    openChecklistModal,
    openExpenseModal,
    openGoogleSearchModal,
    openSectionModal,
    activeTripViewTab,
  } = useTravelContext();

  const [localActivityId, setLocalActivityId] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState<boolean>(false);

  const allActivities = useMemo(() => {
    return travelPlan?.itinerarySection?.flatMap((s) => s.itineraryActivity || []) || [];
  }, [travelPlan?.itinerarySection]);

  const countryName = useMemo(() => {
    const rawDest = travelPlan?.travel?.destinationData as any;
    if (rawDest && typeof rawDest === "object" && rawDest.country) {
      return rawDest.country;
    }
    const dest = travelPlan?.travel?.destination || "";
    const parts = dest.split(",").map((p: string) => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "";
  }, [travelPlan?.travel?.destination, travelPlan?.travel?.destinationData]);

  const activeActivityId = viewActivityId || localActivityId;

  const handleCloseActivity = useCallback(() => {
    closeViewActivity?.();
    setLocalActivityId(null);
  }, [closeViewActivity]);

  const handleOpenActivity = useCallback(
    (id: string) => {
      if (openViewActivity) {
        openViewActivity(id);
      } else {
        setLocalActivityId(id);
      }
    },
    [openViewActivity]
  );

  // --- Draggable Bottom Sheet Layout & Snaps ---
  const screenHeight =
    Platform.OS === "android"
      ? Dimensions.get("screen").height
      : Dimensions.get("window").height;

  // Snap points
  const SNAP_EXPANDED = insets.top;
  const SNAP_MID = screenHeight * 0.40;
  const SNAP_COLLAPSED = screenHeight - 160;

  const snappedY = useRef(SNAP_MID);
  const dragStartY = useRef(0);
  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_MID);

  const snapTo = useCallback(
    (toValue: number) => {
      snappedY.current = toValue;
      setCurrentSnap(toValue);
      Animated.spring(translateY, {
        toValue,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }).start();
    },
    [translateY]
  );

  const prevActiveActivityIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeActivityId && activeActivityId !== prevActiveActivityIdRef.current) {
      // When opening an activity, ensure bottom sheet is at SNAP_MID so the map and pin are visible
      if (currentSnap === SNAP_COLLAPSED || currentSnap === SNAP_EXPANDED) {
        snapTo(SNAP_MID);
      }
    }
    prevActiveActivityIdRef.current = activeActivityId;
  }, [activeActivityId, currentSnap, SNAP_COLLAPSED, SNAP_EXPANDED, SNAP_MID, snapTo]);

  // Intercept back gesture / hardware back button to return to trip detail instead of closing trip
  useEffect(() => {
    if (!activeActivityId) return;

    const onBackPress = () => {
      handleCloseActivity();
      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    const unsubscribeBeforeRemove = navigation.addListener("beforeRemove", (e: any) => {
      e.preventDefault();
      handleCloseActivity();
    });

    return () => {
      backSubscription.remove();
      unsubscribeBeforeRemove();
    };
  }, [activeActivityId, handleCloseActivity, navigation]);

  const handleBack = useCallback(() => {
    if (activeActivityId) {
      handleCloseActivity();
      return;
    }
    if (propOnBack) {
      propOnBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [activeActivityId, handleCloseActivity, propOnBack, navigation]);

  // Bottom Sheet PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const touchRelativeY = evt.nativeEvent.pageY - snappedY.current;
        return touchRelativeY >= 0 && touchRelativeY <= 80;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isVertical =
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 8;
        return isVertical;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 5
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartY.current = snappedY.current;
        translateY.setOffset(snappedY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = dragStartY.current + gestureState.dy;
        if (nextY >= SNAP_EXPANDED && nextY <= SNAP_COLLAPSED) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentY = dragStartY.current + gestureState.dy;
        const velocity = gestureState.vy;

        let targetSnap = SNAP_MID;
        if (velocity < -0.5) {
          targetSnap = SNAP_EXPANDED;
        } else if (velocity > 0.5) {
          targetSnap = SNAP_COLLAPSED;
        } else {
          const distExpanded = Math.abs(currentY - SNAP_EXPANDED);
          const distMid = Math.abs(currentY - SNAP_MID);
          const distCollapsed = Math.abs(currentY - SNAP_COLLAPSED);
          const minDist = Math.min(distExpanded, distMid, distCollapsed);

          if (minDist === distExpanded) targetSnap = SNAP_EXPANDED;
          else if (minDist === distMid) targetSnap = SNAP_MID;
          else targetSnap = SNAP_COLLAPSED;
        }

        snapTo(targetSnap);
      },
    })
  ).current;

  // Extract Pins for Google Maps
  const pins = useMemo<GoogleMapPin[]>(() => {
    if (!travelPlan) return [];
    const result: GoogleMapPin[] = [];

    // 1. Destination pin(s)
    if (travelPlan.travel.tripDestinations && travelPlan.travel.tripDestinations.length > 0) {
      travelPlan.travel.tripDestinations.forEach((td: any) => {
        if (td.latitude && td.longitude) {
          result.push({
            id: `dest-${td.id || td.destination}`,
            latitude: Number(td.latitude),
            longitude: Number(td.longitude),
            title: td.destination || "Destination",
            color: "#263F69",
          });
        }
      });
    }

    // 2. Activities pins
    travelPlan.itinerarySection?.forEach((section) => {
      section.itineraryActivity?.forEach((act) => {
        const coords = getActivityCoordinates(act);
        if (coords) {
          result.push({
            id: act.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            title: act.title || "Activity",
            type: act.type,
            color: getActivityPinColor(act.type),
            sortOrder: act.sortOrder,
          });
        }
      });
    });

    return result;
  }, [travelPlan]);

  // Find coordinates of currently active/opened activity if it has a location
  const selectedActivityCoords = useMemo(() => {
    if (!activeActivityId) return null;
    if (travelPlan?.itinerarySection) {
      for (const section of travelPlan.itinerarySection) {
        const act = section.itineraryActivity?.find(
          (a: any) => String(a.id) === String(activeActivityId)
        );
        if (act) {
          const coords = getActivityCoordinates(act);
          if (coords) return coords;
        }
      }
    }
    // Fallback: check existing pins list
    const matchingPin = pins.find((p) => String(p.id) === String(activeActivityId));
    if (
      matchingPin &&
      typeof matchingPin.latitude === "number" &&
      typeof matchingPin.longitude === "number" &&
      (matchingPin.latitude !== 0 || matchingPin.longitude !== 0)
    ) {
      return { latitude: matchingPin.latitude, longitude: matchingPin.longitude };
    }
    return null;
  }, [activeActivityId, travelPlan, pins]);

  const mapCenterCoordinates = useMemo(() => {
    if (!selectedActivityCoords) return null;
    // When bottom sheet is at SNAP_MID or open, apply vertical offset so pin is centered in the visible map above the sheet
    const offsetY = currentSnap === SNAP_COLLAPSED ? 0 : Math.round(screenHeight * 0.16);
    return {
      latitude: selectedActivityCoords.latitude,
      longitude: selectedActivityCoords.longitude,
      zoom: 15,
      offsetY,
    };
  }, [selectedActivityCoords, currentSnap, SNAP_COLLAPSED, screenHeight]);

  const initialCoordinates = useMemo(() => {
    if (pins.length > 0) {
      return {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
      };
    }
    return undefined;
  }, [pins]);

  const handlePinPress = useCallback(
    (pin: GoogleMapPin) => {
      if (pin.id && !pin.id.startsWith("dest-")) {
        // Load activity details inside the bottom sheet container
        handleOpenActivity(pin.id);
        snapTo(SNAP_MID);
      }
    },
    [handleOpenActivity, snapTo, SNAP_MID]
  );

  if (isLoading || !travelPlan) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-3 text-sm font-medium text-gray-500">
          Loading Trip Details...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100" testID="trip-detail-screen">
      <StatusBar barStyle="dark-content" />

      {/* 1. Google Map in the background with pins */}
      <View className="absolute inset-0">
        <GoogleMapView
          pins={pins}
          initialCoordinates={initialCoordinates}
          centerCoordinates={mapCenterCoordinates}
          selectedPinId={selectedActivityCoords ? activeActivityId : null}
          onPinPress={handlePinPress}
          zoom={12}
          showConnectors={true}
          connectorColor={connectorColor}
          testID="trip-google-map"
        />
      </View>

      {/* Floating Back Navigation Button */}
      <View className="absolute left-4 z-20" style={{ top: insets.top + 8 }}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full justify-center items-center bg-white shadow-md elevation-4"
        >
          <Icon name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        className="rounded-t-[28px] bg-white shadow-2xl elevation-5 overflow-hidden"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: translateY,
        }}
      >
        <View
          {...panResponder.panHandlers}
          className="w-full h-4 pt-2 items-center justify-center bg-transparent"
          accessibilityRole="button"
          accessibilityLabel="Drag bottom sheet up or down"
        >
          <View className="w-10 h-1 rounded-full bg-gray-300" />
        </View>

        {/* 3 & 4. Bottom Sheet Content Container */}
        <View className="flex-1 w-full" style={{ flex: 1 }}>
          {/* <Text>{JSON.stringify(travelPlan)}</Text> */}

          {activeActivityId ? (
            // Activity Details loaded inside container
            <View className="flex-1 w-full" style={{ flex: 1 }} testID="activity-detail-container">
              {/* Activity Sub-Header with Back to Trip Button */}
              <View className="flex-row items-center justify-between px-4 bg-white">
                <TouchableOpacity
                  onPress={handleCloseActivity}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Trip Details"
                  className="flex-row items-center"
                >
                  <View className="pr-1">
                    <Icon name="chevron-left" size={24} color={"#999"} />
                  </View>
                  <Text
                    className="text-base font-semibold text-tertiary/80"
                  >
                    Back to Trip
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const currentAct = travelPlan?.itinerarySection
                      ?.flatMap((s) => s.itineraryActivity || [])
                      .find((a) => a.id === activeActivityId);
                    if (currentAct) {
                      openActivityModal(currentAct, currentAct.sectionId || undefined, travelPlan?.travel?.id);
                    }
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit activity"
                  className="p-1.5 rounded-full"
                >
                  <Icon name="edit" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Activity Details View */}
              <View className="flex-1 w-full" style={{ flex: 1 }}>
                <Activity
                  id={activeActivityId}
                  onClose={handleCloseActivity}
                />
              </View>
            </View>
          ) : (
            // Trip Overview: View/index called inside the bottom sheet container
            <View className="flex-1 w-full" style={{ flex: 1 }} testID="trip-view-container">
              <ViewTravel
                travelPlan={travelPlan}
                onClose={handleBack}
                onRefresh={refetch}
                expanded={currentSnap === SNAP_EXPANDED}
              />
            </View>
          )}
        </View>
      </Animated.View>
      {!activeActivityId && travelPlan && (
        <TravelActionFAB
          currentTab={activeTripViewTab || "details"}
          open={fabOpen}
          setOpen={setFabOpen}
          travelId={travelPlan.travel.id}
          isIncreasePosition={currentSnap === SNAP_COLLAPSED}
          onEditTrip={() => {
            navigation.navigate("EditTravelPlan", { travelId: travelPlan.travel.id });
          }}
          onAddNote={() => {
            openNoteModal(null, allActivities, travelPlan.travel.id);
          }}
          onAddChecklist={() => {
            openChecklistModal(null, allActivities, travelPlan.travel.id);
          }}
          onAddExpense={() => {
            openExpenseModal(null, undefined, allActivities, travelPlan.travel.id);
          }}
          onAddActivity={(type: any) => {
            if (!type) {
              openActivityTypeModal(undefined, travelPlan.travel.id);
              return;
            }
            if (type === ActivityType.plan) {
              const allTripDestinations =
                travelPlan.travel.tripDestinations && travelPlan.travel.tripDestinations.length > 0
                  ? travelPlan.travel.tripDestinations
                  : travelPlan.travel.destination
                    ? [{ destination: travelPlan.travel.destination, destinationData: travelPlan.travel.destinationData }]
                    : [];

              openGoogleSearchModal(
                undefined,
                travelPlan.travel.id,
                travelPlan.travel.destination,
                travelPlan.travel.destinationData?.coordinates,
                countryName,
                undefined,
                allTripDestinations
              );
            } else {
              openActivityModal(null, undefined, travelPlan.travel.id, type);
            }
          }}
          onAddSection={() => {
            openSectionModal(null, travelPlan.travel.id);
          }}
        />
      )}
      <TravelModals travelPlan={travelPlan} />
    </View>
  );
};

export default TripDetailScreen;
