import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GoogleMapView, { GoogleMapPin } from "../../../components/GoogleMapView";
import type { GoogleMapRouteMode } from "../../../components/GoogleMapView/types";
import { parseAirport } from "../../../utils/airportUtils";
import {
  fetchAirportCoordinates,
  getAirportCoordinates,
} from "../../../utils/airportCoordinates";
import { geocodeAddress } from "../../../utils/geocodeUtils";
import { useTravelPlan } from "../hooks/useTravel";
import { useTravelContext } from "../../../context/TravelContext";
import ViewTravel from "../components/View";
import Activity from "../components/View/Activity";
import TravelModals from "../components/TravelModals";
import TravelActionFAB from "../components/View/TravelActionFAB";
import { TripPlanType } from "../../../types/enums";
import { activityIcons } from "../../../components/ActivityIcon";
import type { RootStackParamList } from "../../../navigation/navigation.types";

type TripDetailRouteProp = RouteProp<RootStackParamList, "TravelDetail">;

interface TripDetailScreenProps {
  travelId?: string;
  onBack?: () => void;
  connectorColor?: string;
}

const EXCLUDED_DEFAULT_TYPES: readonly TripPlanType[] = [
  TripPlanType.flight,
  TripPlanType.stay,
  TripPlanType.rideRental,
  TripPlanType.transit,
];

const getActivityPinColor = (type?: TripPlanType | number): string => {
  if (type == null) return "#263F69";
  const iconConfig = activityIcons.find((item) => item.activityType === type);
  return iconConfig ? iconConfig.color : "#263F69";
};

export const extractCoordinates = (
  obj: any
): { latitude: number; longitude: number } | null => {
  if (!obj) return null;
  let target = obj;
  if (typeof target === "string") {
    try {
      target = JSON.parse(target);
    } catch {
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
        : typeof c.lat === "number"
          ? c.lat
          : typeof c.lat === "string"
            ? parseFloat(c.lat)
            : NaN;
  const lng =
    typeof c.longitude === "number"
      ? c.longitude
      : typeof c.longitude === "string"
        ? parseFloat(c.longitude)
        : typeof c.lon === "number"
          ? c.lon
          : typeof c.lon === "string"
            ? parseFloat(c.lon)
            : typeof c.lng === "number"
              ? c.lng
              : typeof c.lng === "string"
                ? parseFloat(c.lng)
                : NaN;

  if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
};

export const extractPickupCoordinates = (
  destData: any,
  transDetails: any,
  rideDetails: any
): { latitude: number; longitude: number } | null => {
  return (
    extractCoordinates(destData?.pickupCoordinates) ||
    extractCoordinates(destData?.pickupLocation?.coordinates) ||
    extractCoordinates(destData?.pickupLocation) ||
    extractCoordinates(destData?.departureCoordinates) ||
    extractCoordinates(transDetails?.pickupCoordinates) ||
    extractCoordinates(transDetails?.pickupLocation?.coordinates) ||
    extractCoordinates(transDetails?.pickupLocation) ||
    extractCoordinates(rideDetails?.pickupCoordinates) ||
    extractCoordinates(rideDetails?.pickupLocation?.coordinates) ||
    extractCoordinates(rideDetails?.pickupLocation)
  );
};

export const extractDropoffCoordinates = (
  destData: any,
  transDetails: any,
  rideDetails: any
): { latitude: number; longitude: number } | null => {
  return (
    extractCoordinates(destData?.dropoffCoordinates) ||
    extractCoordinates(destData?.dropoffLocation?.coordinates) ||
    extractCoordinates(destData?.dropoffLocation) ||
    extractCoordinates(destData?.arrivalCoordinates) ||
    extractCoordinates(transDetails?.dropoffCoordinates) ||
    extractCoordinates(transDetails?.dropoffLocation?.coordinates) ||
    extractCoordinates(transDetails?.dropoffLocation) ||
    extractCoordinates(rideDetails?.dropoffCoordinates) ||
    extractCoordinates(rideDetails?.dropoffLocation?.coordinates) ||
    extractCoordinates(rideDetails?.dropoffLocation)
  );
};

const getAddressString = (raw: any): string => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.address || raw.name || raw.city || "";
};

const getLocationLabel = (raw: any, fallback: string): string => {
  if (!raw) return fallback;
  if (typeof raw === "string") return raw;
  return raw.name || raw.city || raw.address || fallback;
};

export const getActivityCoordinates = (
  act: any
): { latitude: number; longitude: number } | null => {
  if (!act) return null;

  return (
    extractCoordinates(act.destinationData) ||
    extractCoordinates(act.destinationAddressData) ||
    extractCoordinates(act.transportationDetails?.pickupLocation) ||
    extractCoordinates(act.destinationData?.pickupCoordinates) ||
    extractCoordinates(act.rideRentalDetails?.pickupLocation) ||
    extractCoordinates(act.destinationData?.dropoffCoordinates) ||
    extractCoordinates(act.accomodationDetails?.destinationAddressData) ||
    extractCoordinates(act.accomodationDetails?.destinationData) ||
    extractCoordinates(act.sightseeingDetails?.destinationData) ||
    extractCoordinates(act.hikeOrCampDetails?.destinationData) ||
    extractCoordinates(act.natureDetails?.destinationData) ||
    extractCoordinates(act.cafeRestaurantDetails?.destinationData) ||
    extractCoordinates(act.entertainmentDetails?.destinationData) ||
    extractCoordinates(act.shoppingDetails?.destinationData) ||
    extractCoordinates(act.walkDetails?.destinationData) ||
    extractCoordinates(act.rideRentalDetails?.destinationData) ||
    extractCoordinates(act.motorcycleRideDetails?.destinationData) ||
    extractCoordinates(act.meetupDetails?.destinationData) ||
    extractCoordinates(act.coordinates) ||
    extractCoordinates(act)
  );
};

export const TripDetailScreen = ({
  travelId: propTravelId,
  onBack: propOnBack,
  connectorColor = "#fb2c36",
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
    showActivityPinsInTripMap = true,
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
  const SNAP_EXPANDED = screenHeight * 0.10;
  const SNAP_MID = screenHeight * 0.40;
  const SNAP_COLLAPSED = screenHeight - 125;

  const snappedY = useRef(SNAP_MID);
  const dragStartY = useRef(0);
  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_MID);
  const bottomOffset = Math.max(0, screenHeight - currentSnap);

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

  const isScrollAtTopRef = useRef(true);
  const handleScrollAtTopChange = useCallback((isAtTop: boolean) => {
    isScrollAtTopRef.current = isAtTop;
  }, []);

  useEffect(() => {
    isScrollAtTopRef.current = true;
  }, [activeActivityId, currentSnap]);

  // Bottom Sheet PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const touchRelativeY = evt.nativeEvent.pageY - snappedY.current;
        // When collapsed, allow starting drag anywhere on the collapsed bar (up to 125px)
        if (snappedY.current >= SNAP_COLLAPSED - 15) {
          return touchRelativeY >= 0 && touchRelativeY <= 125;
        }
        return touchRelativeY >= 0 && touchRelativeY <= 40;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const touchRelativeY = evt.nativeEvent.pageY - snappedY.current;

        // Top drag handle area (40px) always captures vertical drags
        if (touchRelativeY >= 0 && touchRelativeY <= 40) {
          return (
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
            Math.abs(gestureState.dy) > 5
          );
        }

        // When collapsed, upward swipe anywhere on the collapsed bar captures
        if (snappedY.current >= SNAP_COLLAPSED - 15) {
          return (
            touchRelativeY >= 0 &&
            touchRelativeY <= 125 &&
            gestureState.dy < -5 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
          );
        }

        // When bottom sheet is at SNAP_EXPANDED or SNAP_MID and child ScrollView is at the top,
        // downward drag snaps the bottom sheet down
        if (
          snappedY.current <= SNAP_MID + 15 &&
          isScrollAtTopRef.current &&
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        ) {
          return true;
        }

        return false;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (snappedY.current <= SNAP_EXPANDED + 5 && gestureState.dy < 0) {
          return false;
        }
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
        // Directional flick: snaps to MID in 1 scroll
        if (velocity < -0.3) {
          // Swiping up: if coming from collapsed / below MID, snap to MID; if already above MID, snap to EXPANDED
          targetSnap = currentY < SNAP_MID ? SNAP_EXPANDED : SNAP_MID;
        } else if (velocity > 0.3) {
          // Swiping down: if coming from expanded / above MID, snap to MID; if already below MID, snap to COLLAPSED
          targetSnap = currentY > SNAP_MID ? SNAP_COLLAPSED : SNAP_MID;
        } else {
          // Dragging without flick velocity:
          // If dragged up from collapsed by more than 40px, snap to MID
          if (dragStartY.current >= SNAP_COLLAPSED - 15 && gestureState.dy < -40) {
            targetSnap = currentY < SNAP_MID ? SNAP_EXPANDED : SNAP_MID;
          } else if (dragStartY.current <= SNAP_EXPANDED + 15 && gestureState.dy > 40) {
            // If dragged down from expanded by more than 40px, snap to MID
            targetSnap = currentY > SNAP_MID ? SNAP_COLLAPSED : SNAP_MID;
          } else {
            const distExpanded = Math.abs(currentY - SNAP_EXPANDED);
            const distMid = Math.abs(currentY - SNAP_MID);
            const distCollapsed = Math.abs(currentY - SNAP_COLLAPSED);
            const minDist = Math.min(distExpanded, distMid, distCollapsed);

            if (minDist === distExpanded) targetSnap = SNAP_EXPANDED;
            else if (minDist === distMid) targetSnap = SNAP_MID;
            else targetSnap = SNAP_COLLAPSED;
          }
        }

        snapTo(targetSnap);
      },
    })
  ).current;

  // Find currently active/opened activity
  const activeActivity = useMemo(() => {
    if (!activeActivityId || !travelPlan?.itinerarySection) return null;
    for (const section of travelPlan.itinerarySection) {
      const act = section.itineraryActivity?.find(
        (a: any) => String(a.id) === String(activeActivityId)
      );
      if (act) return act;
    }
    return null;
  }, [activeActivityId, travelPlan?.itinerarySection]);

  // State for resolved flight departure & arrival airport coordinates
  const [asyncFlightCoords, setAsyncFlightCoords] = useState<{
    activityId: string;
    depCoords?: { latitude: number; longitude: number; name?: string } | null;
    arrCoords?: { latitude: number; longitude: number; name?: string } | null;
  } | null>(null);

  useEffect(() => {
    if (!activeActivity || activeActivity.type !== TripPlanType.flight) {
      setAsyncFlightCoords(null);
      return;
    }

    let isMounted = true;
    const depStr = activeActivity.flightDetails?.departureAirport || activeActivity.destination;
    const arrStr = activeActivity.flightDetails?.arrivalAirport;

    const syncDep = getAirportCoordinates(depStr);
    const syncArr = getAirportCoordinates(arrStr);

    setAsyncFlightCoords({
      activityId: String(activeActivity.id),
      depCoords: syncDep,
      arrCoords: syncArr,
    });

    const fetchMissing = async () => {
      let resolvedDep = syncDep;
      let resolvedArr = syncArr;

      if (!resolvedDep && depStr) {
        resolvedDep = await fetchAirportCoordinates(depStr);
      }
      if (!resolvedArr && arrStr) {
        resolvedArr = await fetchAirportCoordinates(arrStr);
      }

      if (isMounted) {
        setAsyncFlightCoords({
          activityId: String(activeActivity.id),
          depCoords: resolvedDep,
          arrCoords: resolvedArr,
        });
      }
    };

    if (!syncDep || !syncArr) {
      fetchMissing();
    }

    return () => {
      isMounted = false;
    };
  }, [activeActivity]);

  // State for resolved transit / rental pickup & dropoff coordinates
  const [asyncTransitCoords, setAsyncTransitCoords] = useState<{
    activityId: string;
    pickupCoords?: { latitude: number; longitude: number; name?: string } | null;
    dropoffCoords?: { latitude: number; longitude: number; name?: string } | null;
  } | null>(null);

  useEffect(() => {
    if (
      !activeActivity ||
      (activeActivity.type !== TripPlanType.transit && activeActivity.type !== TripPlanType.rideRental)
    ) {
      setAsyncTransitCoords(null);
      return;
    }

    let isMounted = true;
    const destData = activeActivity.destinationData as any;
    const transDetails = activeActivity.transportationDetails as any;
    const rideDetails = activeActivity.rideRentalDetails as any;

    const rawPickup =
      destData?.pickupLocation ||
      transDetails?.pickupLocation ||
      rideDetails?.pickupLocation;
    const pickupAddress = getAddressString(rawPickup);

    const rawDropoff =
      destData?.dropoffLocation ||
      transDetails?.dropoffLocation ||
      rideDetails?.dropoffLocation;
    const dropoffAddress = getAddressString(rawDropoff);

    const syncPickup = extractPickupCoordinates(destData, transDetails, rideDetails);
    const syncDropoff = extractDropoffCoordinates(destData, transDetails, rideDetails);

    setAsyncTransitCoords({
      activityId: String(activeActivity.id),
      pickupCoords: syncPickup,
      dropoffCoords: syncDropoff,
    });

    const bias = travelPlan?.travel?.destinationData?.coordinates || syncPickup || syncDropoff;

    const fetchMissing = async () => {
      let resolvedPickup = syncPickup;
      let resolvedDropoff = syncDropoff;

      if (!resolvedPickup && pickupAddress) {
        resolvedPickup = await geocodeAddress(pickupAddress, bias);
      }
      if (!resolvedDropoff && dropoffAddress) {
        resolvedDropoff = await geocodeAddress(dropoffAddress, bias || resolvedPickup);
      }

      if (isMounted) {
        setAsyncTransitCoords({
          activityId: String(activeActivity.id),
          pickupCoords: resolvedPickup,
          dropoffCoords: resolvedDropoff,
        });
      }
    };

    if ((!syncPickup && pickupAddress) || (!syncDropoff && dropoffAddress)) {
      fetchMissing();
    }

    return () => {
      isMounted = false;
    };
  }, [activeActivity, travelPlan]);

  // Extract Pins for Google Maps
  const { pins, effectiveConnectorColor, effectiveRouteMode, effectiveShowConnectors } = useMemo(() => {
    // 1. If an activity is currently active/opened:
    if (activeActivity) {
      const actType = activeActivity.type;
      const actColor = getActivityPinColor(actType);

      // Case 1: Flight activity -> departure and arrival pins with flight connector line
      if (actType === TripPlanType.flight) {
        const flightPins: GoogleMapPin[] = [];
        const depStr = activeActivity.flightDetails?.departureAirport || activeActivity.destination || "";
        const arrStr = activeActivity.flightDetails?.arrivalAirport || "";
        const depParsed = parseAirport(depStr);
        const arrParsed = parseAirport(arrStr);

        const destData = activeActivity.destinationData as any;
        const depCoords =
          extractCoordinates(destData?.departureCoordinates) ||
          extractCoordinates(destData?.coordinates) ||
          (asyncFlightCoords?.activityId === String(activeActivity.id) && asyncFlightCoords.depCoords
            ? asyncFlightCoords.depCoords
            : getActivityCoordinates(activeActivity));

        const arrCoords =
          extractCoordinates(destData?.arrivalCoordinates) ||
          extractCoordinates(activeActivity.destinationData?.coordinates) ||
          (asyncFlightCoords?.activityId === String(activeActivity.id) && asyncFlightCoords.arrCoords
            ? asyncFlightCoords.arrCoords
            : null);

        if (depCoords) {
          flightPins.push({
            id: `${activeActivity.id}-dep`,
            latitude: depCoords.latitude,
            longitude: depCoords.longitude,
            title: `Departure: ${depParsed.name || depParsed.code || "Departure Airport"}`,
            type: TripPlanType.flight,
            color: actColor,
          });
        }

        if (arrCoords) {
          flightPins.push({
            id: `${activeActivity.id}-arr`,
            latitude: arrCoords.latitude,
            longitude: arrCoords.longitude,
            title: `Arrival: ${arrParsed.name || arrParsed.code || "Arrival Airport"}`,
            type: TripPlanType.flight,
            color: actColor,
          });
        }

        return {
          pins: flightPins,
          effectiveConnectorColor: actColor,
          effectiveRouteMode: "FLIGHT" as GoogleMapRouteMode,
          effectiveShowConnectors: flightPins.length > 1,
        };
      }

      // Case 2: Transit or RideRental activity -> pickup and dropoff pins with connector line
      if (actType === TripPlanType.transit || actType === TripPlanType.rideRental) {
        const transitPins: GoogleMapPin[] = [];
        const destData = activeActivity.destinationData as any;
        const transDetails = activeActivity.transportationDetails as any;
        const rideDetails = activeActivity.rideRentalDetails as any;

        const rawPickup =
          destData?.pickupLocation ||
          transDetails?.pickupLocation ||
          rideDetails?.pickupLocation;
        const pickupLabel = getLocationLabel(rawPickup, destData?.pickupLocation?.name || "Pickup");

        const rawDropoff =
          destData?.dropoffLocation ||
          transDetails?.dropoffLocation ||
          rideDetails?.dropoffLocation;
        const dropoffLabel = getLocationLabel(rawDropoff, destData?.dropoffLocation?.name || "Dropoff");

        const isAsyncTransitForThis = asyncTransitCoords?.activityId === String(activeActivity.id);

        let pickupCoords =
          extractPickupCoordinates(destData, transDetails, rideDetails) ||
          (isAsyncTransitForThis && asyncTransitCoords?.pickupCoords
            ? { latitude: asyncTransitCoords.pickupCoords.latitude, longitude: asyncTransitCoords.pickupCoords.longitude }
            : null);

        let dropoffCoords =
          extractDropoffCoordinates(destData, transDetails, rideDetails) ||
          (isAsyncTransitForThis && asyncTransitCoords?.dropoffCoords
            ? { latitude: asyncTransitCoords.dropoffCoords.latitude, longitude: asyncTransitCoords.dropoffCoords.longitude }
            : null);

        // Fallback: if pickup is present and dropoff is missing, check destinationData or destination coordinates
        if (pickupCoords && !dropoffCoords) {
          const fallbackDrop =
            extractCoordinates(destData?.coordinates) ||
            extractCoordinates(activeActivity.destinationData) ||
            getActivityCoordinates(activeActivity);
          if (
            fallbackDrop &&
            (Math.abs(pickupCoords.latitude - fallbackDrop.latitude) > 0.0001 ||
              Math.abs(pickupCoords.longitude - fallbackDrop.longitude) > 0.0001)
          ) {
            dropoffCoords = fallbackDrop;
          }
        }

        // Fallback: if dropoff is present and pickup is missing, check destinationData or destination coordinates
        if (dropoffCoords && !pickupCoords) {
          const fallbackPick =
            extractCoordinates(destData?.coordinates) ||
            extractCoordinates(activeActivity.destinationData) ||
            getActivityCoordinates(activeActivity);
          if (
            fallbackPick &&
            (Math.abs(dropoffCoords.latitude - fallbackPick.latitude) > 0.0001 ||
              Math.abs(dropoffCoords.longitude - fallbackPick.longitude) > 0.0001)
          ) {
            pickupCoords = fallbackPick;
          }
        }

        // If both pickup and dropoff coordinates exist:
        if (pickupCoords && dropoffCoords) {
          let finalDropoffCoords = dropoffCoords;
          if (
            Math.abs(pickupCoords.latitude - dropoffCoords.latitude) < 0.00005 &&
            Math.abs(pickupCoords.longitude - dropoffCoords.longitude) < 0.00005
          ) {
            finalDropoffCoords = {
              latitude: dropoffCoords.latitude + 0.0003,
              longitude: dropoffCoords.longitude + 0.0003,
            };
          }

          transitPins.push({
            id: `${activeActivity.id}-pickup`,
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            title: `Pickup: ${pickupLabel}`,
            type: actType,
            color: actColor,
          });

          transitPins.push({
            id: `${activeActivity.id}-dropoff`,
            latitude: finalDropoffCoords.latitude,
            longitude: finalDropoffCoords.longitude,
            title: `Dropoff: ${dropoffLabel}`,
            type: actType,
            color: actColor,
          });
        } else if (pickupCoords || dropoffCoords) {
          const singleCoord = pickupCoords || dropoffCoords;
          transitPins.push({
            id: activeActivity.id,
            latitude: singleCoord!.latitude,
            longitude: singleCoord!.longitude,
            title: activeActivity.title || (pickupCoords ? `Pickup: ${pickupLabel}` : `Dropoff: ${dropoffLabel}`),
            type: actType,
            color: actColor,
          });
        }

        const routeMode = (actType === TripPlanType.transit ? "TRANSIT" : "DRIVING") as GoogleMapRouteMode;

        return {
          pins: transitPins,
          effectiveConnectorColor: actColor,
          effectiveRouteMode: routeMode,
          effectiveShowConnectors: transitPins.length > 1,
        };
      }

      // Case 3: Other opened activity types (stay, rental, plan, tour, etc.)
      const coords = getActivityCoordinates(activeActivity);
      const activityPins: GoogleMapPin[] = [];

      if (coords) {
        activityPins.push({
          id: activeActivity.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          title: activeActivity.title || "Activity",
          type: activeActivity.type,
          color: actColor,
        });
      }

      return {
        pins: activityPins,
        effectiveConnectorColor: actColor,
        effectiveRouteMode: "DRIVING" as GoogleMapRouteMode,
        effectiveShowConnectors: activityPins.length > 1,
      };
    }

    // 2. Default trip view (when no activity is open):
    if (!travelPlan) {
      return {
        pins: [],
        effectiveConnectorColor: connectorColor,
        effectiveRouteMode: "DRIVING" as GoogleMapRouteMode,
        effectiveShowConnectors: false,
      };
    }

    const defaultPins: GoogleMapPin[] = [];

    // 1. Destination pin(s)
    if (travelPlan.travel.tripDestinations && travelPlan.travel.tripDestinations.length > 0) {
      travelPlan.travel.tripDestinations.forEach((td: any) => {
        if (td.latitude && td.longitude) {
          defaultPins.push({
            id: `dest-${td.id || td.destination}`,
            latitude: Number(td.latitude),
            longitude: Number(td.longitude),
            title: td.destination || "Destination",
            color: "#263F69",
          });
        }
      });
    }

    // 2. Activities pins (only when showActivityPinsInTripMap is enabled)
    if (showActivityPinsInTripMap) {
      travelPlan.itinerarySection?.forEach((section) => {
        section.itineraryActivity?.forEach((act) => {
          if (EXCLUDED_DEFAULT_TYPES.includes(act.type as any)) {
            return; // Skip flight, stay, rental, transit by default
          }
          const coords = getActivityCoordinates(act);
          if (coords) {
            defaultPins.push({
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
    }

    const hasConnectablePins = showActivityPinsInTripMap && (() => {
      const typeCounts: Record<string, number> = {};
      defaultPins.forEach((p) => {
        if (p.type !== undefined && p.type !== null) {
          typeCounts[String(p.type)] = (typeCounts[String(p.type)] || 0) + 1;
        }
      });
      return Object.values(typeCounts).some((c) => c > 1);
    })();

    return {
      pins: defaultPins,
      effectiveConnectorColor: connectorColor,
      effectiveRouteMode: "DRIVING" as GoogleMapRouteMode,
      effectiveShowConnectors: Boolean(hasConnectablePins),
    };
  }, [activeActivity, asyncFlightCoords, asyncTransitCoords, travelPlan, connectorColor, showActivityPinsInTripMap]);

  // Find coordinates of currently active/opened activity if it has a location
  const selectedActivityCoords = useMemo(() => {
    if (!activeActivityId || !activeActivity) return null;

    // For a flight with both departure & arrival pins, let fitBounds frame both airports!
    if (activeActivity.type === TripPlanType.flight && pins.length > 1) {
      return null;
    }

    // For transit and rental with both pickup & dropoff pins, let fitBounds frame both stops!
    if (
      (activeActivity.type === TripPlanType.transit || activeActivity.type === TripPlanType.rideRental) &&
      pins.length > 1
    ) {
      return null;
    }

    // For single-pin activities:
    if (pins.length > 0) {
      return { latitude: pins[0].latitude, longitude: pins[0].longitude };
    }

    const coords = getActivityCoordinates(activeActivity);
    if (coords) return coords;

    return null;
  }, [activeActivityId, activeActivity, pins]);

  const isExpanded = currentSnap === SNAP_EXPANDED;

  const activityZoom = useMemo(() => {
    if (currentSnap === SNAP_COLLAPSED) return 14;
    if (currentSnap === SNAP_MID) return 16;
    return undefined; // no zoom change when expanded
  }, [currentSnap, SNAP_COLLAPSED, SNAP_MID]);

  const tripZoom = useMemo(() => {
    if (currentSnap === SNAP_COLLAPSED) return 13;
    if (currentSnap === SNAP_MID) return 12;
    return undefined; // no zoom change when expanded
  }, [currentSnap, SNAP_COLLAPSED, SNAP_MID]);

  const mapCenterCoordinates = useMemo(() => {
    if (!selectedActivityCoords) return null;
    return {
      latitude: selectedActivityCoords.latitude,
      longitude: selectedActivityCoords.longitude,
      zoom: activityZoom,
    };
  }, [selectedActivityCoords, activityZoom]);

  const initialCoordinates = useMemo(() => {
    if (pins.length > 0) {
      return {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
      };
    }
    const destCoords =
      extractCoordinates(travelPlan?.travel?.destinationData) ||
      extractCoordinates(travelPlan?.travel);
    if (destCoords) return destCoords;
    return undefined;
  }, [pins, travelPlan?.travel]);

  const handlePinPress = useCallback(
    (pin: GoogleMapPin) => {
      if (pin.id && !pin.id.startsWith("dest-")) {
        const cleanId = pin.id.replace(/-(pickup|dropoff|dep|arr|departure|arrival)$/, "");
        handleOpenActivity(cleanId);
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
          bottomOffset={bottomOffset}
          isExpanded={isExpanded}
          onPinPress={handlePinPress}
          zoom={tripZoom}
          showConnectors={effectiveShowConnectors}
          connectorColor={effectiveConnectorColor}
          routeMode={effectiveRouteMode}
          connectByType={!activeActivityId}
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
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: translateY,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 24,
          zIndex: 10,
        }}
      >
        <View className="flex-1 rounded-t-[28px] overflow-hidden bg-white">
          <View
            className="w-full h-4 pt-2 items-center justify-center bg-transparent"
            accessibilityRole="button"
            accessibilityLabel="Drag bottom sheet up or down"
          >
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Bottom Sheet Content Container */}
          <View className="flex-1 w-full" style={{ flex: 1 }}>
            {/* Trip Overview: View/index called inside the bottom sheet container */}
            <View
              className="flex-1 w-full"
              style={{ flex: 1, display: activeActivityId ? "none" : "flex" }}
              testID="trip-view-container"
            >
              <ViewTravel
                travelPlan={travelPlan}
                onClose={handleBack}
                onRefresh={refetch}
                expanded={currentSnap === SNAP_EXPANDED}
                currentSnap={currentSnap}
              />
            </View>

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
                      <Icon name="chevron-left" size={24} color={"#999"} style={{ opacity: 0.5 }} />
                    </View>
                    {/* <Text className="text-sm font-semibold uppercase text-tertiary/50">
                      Back to Trip
                    </Text> */}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (activeActivity) {
                        openActivityModal(
                          activeActivity,
                          activeActivity.sectionId || undefined,
                          travelPlan?.travel?.id
                        );
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
                    isMidSnap={currentSnap === SNAP_MID}
                    isExpanded={currentSnap === SNAP_EXPANDED}
                    onScrollAtTopChange={handleScrollAtTopChange}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {!activeActivityId && travelPlan && (
        <TravelActionFAB
          currentTab={activeTripViewTab || "details"}
          open={fabOpen}
          setOpen={setFabOpen}
          travelId={travelPlan.travel.id}
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
            console.log(type)
            // if (!type) {
            //   openActivityTypeModal(undefined, travelPlan.travel.id);
            //   return;
            // }
            if (type === TripPlanType.activity) {
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
