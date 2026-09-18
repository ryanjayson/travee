import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-paper";
import StatusBadge from "../../../../components/StatusBadge";
import Tabs from "../../../../components/Tabs";
import { useTravelContext } from "../../../../context/TravelContext";
import { TravelPlan } from "../../../Travel/types/TravelDto";
import ShareTripModal from "../ShareOverlay/ShareTripModal";
import DestinationsBottomSheet from "../DestinationsBottomSheet";
import ChecklistTab from "./Tabs/ChecklistTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import ItineraryTab from "./Tabs/ItineraryTab";
import MembersTab from "./Tabs/MembersTab";
import NotesTab from "./Tabs/NotesTab";
import { FadeInView } from "../../../../components/animations";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose?: () => void;
  expanded?: boolean;
  currentSnap?: number;
  onExpandedChange?: (expanded: boolean) => void;
  onScrollY?: (y: number) => void;
  showMap?: boolean;
  setShowMap?: React.Dispatch<React.SetStateAction<boolean>>;
  showShare?: boolean;
  setShowShare?: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => Promise<any>;
  fabOpen?: boolean;
  setFabOpen?: (open: boolean) => void;
  onRegisterCollapse?: (fn: () => void) => void;
  onEditTrip?: () => void;
}

const ViewTravel = ({
  travelPlan,
  expanded,
  currentSnap: propCurrentSnap,
  onExpandedChange,
  showShare = false,
  setShowShare,
  onRefresh,
  onRegisterCollapse,
}: ViewTravelProps) => {
  const [localShowShare, localSetShowShare] = useState<boolean>(false);
  const [showDestinationsSheet, setShowDestinationsSheet] = useState<boolean>(false);

  const travelId = travelPlan.travel.id;
  const isShareVisible = setShowShare ? showShare : localShowShare;
  const setShareVisible = setShowShare ? setShowShare : localSetShowShare;

  const {
    openExpenseModal,
    openNoteModal,
    activeTripViewTab: activeTabId,
    setActiveTripViewTab: setActiveTabId,
  } = useTravelContext();

  const screenHeight =
    Platform.OS === "android"
      ? Dimensions.get("screen").height
      : Dimensions.get("window").height;

  // Snap points matching TripDetailScreen
  const SNAP_EXPANDED = screenHeight * 0.10;
  const SNAP_MAX = SNAP_EXPANDED;
  const SNAP_MID = screenHeight * 0.40;
  const SNAP_COLLAPSED = screenHeight - 125;
  const SNAP_MIN = SNAP_COLLAPSED;

  const snappedY = useRef(SNAP_MID);
  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const [localCurrentSnap, setLocalCurrentSnap] = useState(SNAP_MID);
  const currentSnap = propCurrentSnap !== undefined ? propCurrentSnap : localCurrentSnap;
  const isMinimized = currentSnap === SNAP_MIN || Math.abs(currentSnap - SNAP_MIN) < 2;

  const snapTo = (toValue: number) => {
    snappedY.current = toValue;
    setLocalCurrentSnap(toValue);
    Animated.spring(translateY, {
      toValue,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start(() => {
      onExpandedChange?.(toValue === SNAP_MAX);
    });
  };

  useEffect(() => {
    if (propCurrentSnap !== undefined) {
      snappedY.current = propCurrentSnap;
      setLocalCurrentSnap(propCurrentSnap);
      translateY.setValue(propCurrentSnap);
    }
  }, [propCurrentSnap]);

  useEffect(() => {
    if (propCurrentSnap !== undefined) {
      return;
    }
    if (expanded) {
      snapTo(SNAP_MAX);
      onExpandedChange?.(true);
    } else {
      snapTo(SNAP_MID);
      onExpandedChange?.(false);
    }
  }, [expanded, propCurrentSnap]);

  useEffect(() => {
    onRegisterCollapse?.(() => {
      snapTo(SNAP_MID);
    });
  }, [onRegisterCollapse]);

  /** Extract the country portion from a destination string like "Tokyo, Japan" */
  const countryName = useMemo(() => {
    const destination = travelPlan.travel.destination;
    if (!destination) return "";
    const parts = destination.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || destination;
  }, [travelPlan.travel.destination]);

  const allActivities = useMemo(() => {
    return (travelPlan.itinerarySection ?? [])
      .flatMap((s) => s.itineraryActivity ?? [])
      .filter(
        (a) =>
          a.destinationData?.coordinates &&
          a.destinationData.coordinates.latitude !== 0 &&
          a.destinationData.coordinates.longitude !== 0
      )
      .map((a) => ({
        id: a.id,
        title: a.title || "Activity",
        type: a.type,
        latitude: a.destinationData!.coordinates.latitude,
        longitude: a.destinationData!.coordinates.longitude,
        sortOrder: a.sortOrder,
      }));
  }, [travelPlan.itinerarySection]);

  const doneActivities = useMemo(() => {
    return (travelPlan.itinerarySection ?? [])
      .flatMap((s) => s.itineraryActivity ?? [])
      .filter(
        (a) =>
          a.isDone &&
          a.destinationData?.coordinates &&
          a.destinationData.coordinates.latitude !== 0 &&
          a.destinationData.coordinates.longitude !== 0
      )
      .map((a) => ({
        lat: a.destinationData!.coordinates.latitude,
        lng: a.destinationData!.coordinates.longitude,
        type: a.type,
      }));
  }, [travelPlan.itinerarySection]);

  const destinationInfo = useMemo(() => {
    const { tripDestinations, destination } = travelPlan.travel;
    const validDestinations =
      tripDestinations && tripDestinations.length > 0
        ? tripDestinations.map((d: any) => d.destination).filter(Boolean)
        : destination
          ? destination
            .split(" | ")
            .map((s: string) => s.trim())
            .filter(Boolean)
          : [];
    const hasDestinations = validDestinations.length > 0 || Boolean(destination);
    const isMultiple = validDestinations.length > 1;
    const destinationText = isMultiple
      ? `${validDestinations.length} destinations`
      : validDestinations[0] || destination || "";

    return {
      hasDestinations,
      isMultiple,
      destinationText,
    };
  }, [travelPlan.travel]);

  const formattedDates = useMemo(() => {
    const { startOrDepartureDate, endOrReturnDate } = travelPlan.travel;
    if (!startOrDepartureDate && !endOrReturnDate) return null;

    const startText = startOrDepartureDate
      ? new Date(startOrDepartureDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      })
      : "- ";

    const endText = endOrReturnDate
      ? ` - ${new Date(endOrReturnDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      })}`
      : "";

    return `${startText}${endText}`;
  }, [travelPlan.travel.startOrDepartureDate, travelPlan.travel.endOrReturnDate]);

  const shareDateRange = useMemo(() => {
    const { startOrDepartureDate, endOrReturnDate } = travelPlan.travel;
    if (!startOrDepartureDate) return undefined;

    const startStr = new Date(startOrDepartureDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const endStr = endOrReturnDate
      ? ` → ${new Date(endOrReturnDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
      : "";

    return `${startStr}${endStr}`;
  }, [travelPlan.travel.startOrDepartureDate, travelPlan.travel.endOrReturnDate]);

  const allActivitiesList = useMemo(
    () => travelPlan.itinerarySection?.flatMap((s) => s.itineraryActivity || []) || [],
    [travelPlan.itinerarySection]
  );

  const tabData = useMemo(
    () => [
      {
        id: "details",
        title: "Details",
        applyFadeAnimation: false,
        content: (
          <DetailsTab
            travelPlan={travelPlan}
            onTabChange={setActiveTabId}
          />
        ),
      },
      {
        id: "itinerary",
        title: "Itinerary",
        applyFadeAnimation: false,
        content: (
          <ItineraryTab
            travelPlan={travelPlan}
            onRefresh={onRefresh}
            isMinimized={isMinimized}
          />
        ),
      },
      {
        id: "expenses",
        title: "Expenses",
        isVisible: false,
        content: (
          <ExpensesTab
            travelPlan={travelPlan}
            onEditExpense={(expense) => {
              openExpenseModal(expense, undefined, allActivitiesList, travelId);
            }}
          />
        ),
      },
      {
        id: "checklist",
        title: "Checklist",
        applyFadeAnimation: false,
        content: (
          <ChecklistTab
            travelPlan={travelPlan}
            activities={allActivitiesList}
          />
        ),
      },
      {
        id: "notes",
        title: "Notes",
        isVisible: false,
        content: (
          <NotesTab
            travelPlan={travelPlan}
            onEditNote={(note) => {
              openNoteModal(note, allActivitiesList, travelId);
            }}
          />
        ),
      },
      {
        id: "members",
        title: "Members",
        isVisible: false,
        content: <MembersTab travelPlan={travelPlan} />,
      },
    ],
    [
      travelPlan,
      setActiveTabId,
      onRefresh,
      isMinimized,
      openExpenseModal,
      openNoteModal,
      allActivitiesList,
      travelId,
    ]
  );

  return (
    <Portal.Host>
      {/* Content Sheet */}
      <Animated.View className="flex-1">
        {/* Trip Title & Summary */}
        <View className="px-6 py-3 bg-white flex-row justify-between items-start relative">
          <Animated.View className="flex-1 mr-4">
            <FadeInView type="right" delay={80} duration={200}>
              <View className="flex-row items-center gap-3">
                {travelPlan.travel.status !== undefined && (
                  <View className="absolute -top-sm opacity-75">
                    <StatusBadge type={1} status={travelPlan.travel.status} />
                  </View>
                )}

                <Text
                  className={`${isMinimized ? "text-2xl pr-[80px] mt-lg!" : "text-4xl"} mt-sm leading-relaxed font-semibold text-secondary flex-1`}
                  numberOfLines={isMinimized ? undefined : undefined}
                >
                  {travelPlan.travel.title}
                </Text>
              </View>
            </FadeInView>

            <FadeInView type="right" delay={80} duration={300}>
              <View className="flex-row items-center flex-wrap">
                {destinationInfo.hasDestinations && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View destinations (${destinationInfo.destinationText})`}
                    onPress={() => setShowDestinationsSheet(true)}
                    className="flex-row items-center mr-3 my-0.5"
                  >
                    <Icon name="location-pin" size={18} color="#999" />
                    <Text className="text-md font-medium text-tertiary ml-0.5" numberOfLines={1}>
                      {destinationInfo.destinationText}
                    </Text>
                    {destinationInfo.isMultiple && (
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color="#999"
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </TouchableOpacity>
                )}

                {formattedDates && (
                  <View className="flex-row items-center my-0.5">
                    <Icon name="calendar-month" size={16} color="#999" />
                    <Text className="text-md font-medium text-tertiary ml-0.5">
                      {formattedDates}
                    </Text>
                  </View>
                )}
              </View>
            </FadeInView>
          </Animated.View>
        </View>

        {/* Tabbed Content */}
        <Animated.View className="flex-1 mb-4">
          <FadeInView type="right" delay={80} duration={400} className="flex-1">
            <Tabs
              tabs={tabData}
              initialActiveTabId="details"
              activeTabId={activeTabId}
              type="default"
              onTabChange={setActiveTabId}
              expanded={true}
              wrapperStyle={`bg-white px-1 pb-2 ${activeTabId === "itinerary" ? "border-b border-[#e0e0e0]" : ""
                }`}
            />
          </FadeInView>
        </Animated.View>
      </Animated.View>

      <ShareTripModal
        visible={isShareVisible}
        onClose={() => setShareVisible(false)}
        tripTitle={travelPlan.travel.title || "My Trip"}
        destination={travelPlan.travel.destination || ""}
        countryName={countryName}
        activities={allActivities}
        doneActivities={doneActivities}
        dateRange={shareDateRange}
      />

      <DestinationsBottomSheet
        visible={showDestinationsSheet}
        travel={travelPlan.travel}
        onClose={() => setShowDestinationsSheet(false)}
      />
    </Portal.Host>
  );
};

export default ViewTravel;
