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
import { Portal, useTheme } from "react-native-paper";
import StatusBadge from "../../../../components/StatusBadge";
import Tabs from "../../../../components/Tabs";
import { useTravelContext } from "../../../../context/TravelContext";
import { useConfirm } from "../../../../context/ConfirmContext";
import { TravelMenuAction } from "../../../../types/enums";
import { TravelPlan } from "../../../Travel/types/TravelDto";
import ShareTripModal from "../ShareOverlay/ShareTripModal";
import DestinationsBottomSheet from "../DestinationsBottomSheet";
import TravelMenuNavigation from "../TravelMenuNavigation";
import CreateTripModal from "../CreateOrEdit/Modal";
import {
  useArchiveTravel,
  useCancelTravel,
  useDeleteTravel,
  useUnarchiveTravel,
} from "../../hooks/useTravel";
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
  onClose,
  expanded,
  currentSnap: propCurrentSnap,
  onExpandedChange,
  showShare = false,
  setShowShare,
  onRefresh,
  onRegisterCollapse,
  onEditTrip,
}: ViewTravelProps) => {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const [localShowShare, localSetShowShare] = useState<boolean>(false);
  const [showDestinationsSheet, setShowDestinationsSheet] = useState<boolean>(false);
  const [showTravelNavigationModal, setShowTravelNavigationModal] = useState<boolean>(false);
  const [showEditTripModal, setShowEditTripModal] = useState<boolean>(false);

  const { mutate: deleteTravel } = useDeleteTravel();
  const { mutate: cancelTravel } = useCancelTravel();
  const { mutate: archiveTravel } = useArchiveTravel();
  const { mutate: unarchiveTravel } = useUnarchiveTravel();

  const handleSelectNavigationMenu = async (menuAction: TravelMenuAction) => {
    const id = travelPlan?.travel?.id;

    if (menuAction === TravelMenuAction.EditTravel) {
      if (onEditTrip) {
        onEditTrip();
      } else {
        setShowEditTripModal(true);
      }
    } else if (menuAction === TravelMenuAction.Cancel) {
      const isConfirmed = await confirm({
        title: "Cancel Trip",
        message: "Are you sure you want to cancel this trip? This will mark it as cancelled.",
        confirmText: "Cancel Trip",
        cancelText: "No",
        type: "danger",
      });
      if (isConfirmed && id != null) {
        cancelTravel(String(id), {
          onSuccess: () => {
            onRefresh?.();
          },
        });
      }
    } else if (menuAction === TravelMenuAction.Delete) {
      const isConfirmed = await confirm({
        title: "Delete Trip",
        message: "Are you sure you want to permanently delete this trip? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });
      if (isConfirmed && id != null) {
        deleteTravel(String(id), {
          onSuccess: () => {
            onClose?.();
          },
        });
      }
    } else if (menuAction === TravelMenuAction.Archive) {
      const isConfirmed = await confirm({
        title: "Archive Trip",
        message: "Are you sure you want to archive this trip? It will be moved to the archive.",
        confirmText: "Archive",
        cancelText: "Cancel",
        type: "warning",
      });
      if (isConfirmed && id != null) {
        archiveTravel(String(id), {
          onSuccess: () => {
            onRefresh?.();
          },
        });
      }
    } else if (menuAction === TravelMenuAction.Unarchive) {
      const isConfirmed = await confirm({
        title: "Unarchive Trip",
        message: "Are you sure you want to unarchive this trip?",
        confirmText: "Unarchive",
        cancelText: "Cancel",
        type: "default",
      });
      if (isConfirmed && id != null) {
        unarchiveTravel(String(id), {
          onSuccess: () => {
            onRefresh?.();
          },
        });
      }
    }
  };

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
        <View className="px-6 py-2 bg-white flex-row justify-between items-start relative">
          <Animated.View className="flex-1 mr-4">
            <FadeInView type="right" delay={80} duration={200}>
              <View className="flex-row items-center gap-3"
                style={{ paddingEnd: isMinimized ? 48 : 0 }}>
                {travelPlan.travel.status !== undefined && (
                  <View className="absolute -top-sm opacity-75">
                    <StatusBadge type={1} status={travelPlan.travel.status} />
                  </View>
                )}
                <Text
                  className={`${isMinimized ? "text-2xl  mt-lg!" : "text-[30px] pr-2xl "} mt-md font-semibold text-secondary flex-1`}
                  numberOfLines={isMinimized ? 1 : undefined}
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
                    <Icon name="location-pin" size={14} color="#999" />
                    <Text className="text-base font-medium text-tertiary ml-1" numberOfLines={1}>
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
                  <View className="flex-row items-center ">
                    <Text className="text-md font-medium text-tertiary pr-lg opacity-50">
                      ❘
                    </Text>
                    <Icon name="calendar-month" size={16} color="#999" />
                    <Text className="text-base font-medium text-tertiary ml-1">
                      {formattedDates}
                    </Text>
                  </View>
                )}
              </View>
            </FadeInView>
          </Animated.View>

          {/* Action buttons: Share & More Options */}
          <View className={`flex-row items-center absolute top-sm right-lg ${isMinimized ? "hidden" : ""}`}>
            <TouchableOpacity
              style={{ padding: 6 }}
              onPress={() => setShowTravelNavigationModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <Icon name="more-vert" size={22} color={"#999"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabbed Content */}
        <Animated.View className="flex-1 "
          style={{ marginTop: isMinimized ? 18 : 0 }}>
          <FadeInView type="right" delay={80} duration={400} className="flex-1">
            <Tabs
              tabs={tabData}
              initialActiveTabId="details"
              activeTabId={activeTabId}
              type="default"
              onTabChange={setActiveTabId}
              expanded={true}
              wrapperStyle={`bg-white px-1 pb-4 ${activeTabId === "itinerary" ? "border-b border-[#e0e0e0]" : ""
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

      <TravelMenuNavigation
        showModal={showTravelNavigationModal}
        setShowModal={setShowTravelNavigationModal}
        onSelect={handleSelectNavigationMenu}
        travel={travelPlan?.travel}
      />

      <CreateTripModal
        showModal={showEditTripModal}
        setShowModal={setShowEditTripModal}
        tripData={travelPlan?.travel}
        mode="edit"
        onCreated={() => {
          onRefresh?.();
        }}
      />
    </Portal.Host>
  );
};

export default ViewTravel;
