import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  Portal,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "../../../../components/StatusBadge";
import Tabs from "../../../../components/Tabs";
import { useTravelContext } from "../../../../context/TravelContext";
import { TravelPlan } from "../../../Travel/types/TravelDto";
import MapViewer from "../MapViewer";
import ShareTripModal from "../ShareOverlay/ShareTripModal";
import ChecklistTab from "./Tabs/ChecklistTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import ItineraryTab from "./Tabs/ItineraryTab";
import MembersTab from "./Tabs/MembersTab";
import NotesTab from "./Tabs/NotesTab";
import TravelActionFAB from "./TravelActionFAB";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onScrollY?: (y: number) => void;
  showMap?: boolean;
  setShowMap?: React.Dispatch<React.SetStateAction<boolean>>;
  showShare?: boolean;
  setShowShare?: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => Promise<any>;
  fabOpen?: boolean;
  setFabOpen?: (open: boolean) => void;
}

const ViewTravel = ({ 
  travelPlan, 
  onClose, 
  expanded, 
  onExpandedChange,
  onScrollY,
  showMap = false,
  setShowMap,
  showShare = false,
  setShowShare,
  onRefresh,
  fabOpen,
  setFabOpen,
}: ViewTravelProps) => {
  const [showActivityViewModal, setShowActivityViewModal] = useState<boolean>(false);
  const [localShowMap, localSetShowMap] = useState<boolean>(false);
  const [localShowShare, localSetShowShare] = useState<boolean>(false);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const travelId = travelPlan.travel.id;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        onRefresh ? onRefresh() : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["itineraryExpenses", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["itineraryNotes", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["tripMembers", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["memberSplitBills", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["checklistGroups", travelId] }),
        queryClient.invalidateQueries({ queryKey: ["checklistItems", travelId] }),
      ]);
    } catch (err) {
      console.error("Failed to refresh travel plan:", err);
    } finally {
      setRefreshing(false);
    }
  };



  const isMapVisible = setShowMap ? showMap : localShowMap;
  const setMapVisible = setShowMap ? setShowMap : localSetShowMap;

  const isShareVisible = setShowShare ? showShare : localShowShare;
  const setShareVisible = setShowShare ? setShowShare : localSetShowShare;
  const {
    openExpenseModal,
    openNoteModal,
    openChecklistModal,
    openActivityModal,
  } = useTravelContext();
  const [showDestinationOnlyMap, setShowDestinationOnlyMap] = useState<boolean>(true);
  const [activeTabId, setActiveTabId] = useState<string>("details");

  // --- Draggable Bottom Sheet Snap Values ---
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const SNAP_MAX = 0;
  const SNAP_MID = screenHeight * 0.45;
  const SNAP_MIN = screenHeight - 108;

  // Track the last-snapped position manually because Animated.Value.addListener
  // does NOT fire reliably on Android when useNativeDriver: true.
  const snappedY = useRef(SNAP_MID);
  const dragStartY = useRef(0);

  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const [currentSnap, setCurrentSnap] = useState(SNAP_MID);

  const snapTo = (toValue: number) => {
    snappedY.current = toValue;
    setCurrentSnap(toValue);
    Animated.spring(translateY, {
      toValue,
      tension: 80,
      friction: 12,
      useNativeDriver: false, // Set to false to allow smooth layout/padding animations
    }).start(() => {
      onExpandedChange?.(toValue === SNAP_MAX);
    });
  };

  useEffect(() => {
    if (expanded) {
      snapTo(SNAP_MAX);
      onExpandedChange?.(true);
    } else {
      snapTo(SNAP_MID);
      onExpandedChange?.(false);
    }
  }, [expanded]);

  // Smoothly interpolate padding top as the sheet is dragged/scrolled up to full height
  const headerPaddingTop = translateY.interpolate({
    inputRange: [SNAP_MAX, SNAP_MID],
    outputRange: [insets.top + 24, 12],
    extrapolate: "clamp",
  });

  // Smoothly fade out the gray drag handle as the sheet approaches full screen height
  const handleOpacity = translateY.interpolate({
    inputRange: [SNAP_MAX, SNAP_MID],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Smoothly reveal the down icon as the sheet approaches full screen height
  const downIconOpacity = translateY.interpolate({
    inputRange: [SNAP_MAX, SNAP_MID],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const touchStartRelativeY = evt.nativeEvent.pageY - snappedY.current;
        // Handle curved borders/shadows by allowing Y to be slightly above the sheet top (-30px)
        const shouldSet = touchStartRelativeY > -30 && touchStartRelativeY < 120;
        // console.log(`[PanResponder] onStartShouldSetPanResponder: pageY=${evt.nativeEvent.pageY}, snappedY=${snappedY.current}, relativeY=${touchStartRelativeY}, shouldSet=${shouldSet}`);
        return shouldSet;
      },
      // Capture phase: intercept vertical gestures BEFORE child ScrollViews/TouchableOpacities consume them
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 8;
        if (!isVertical) return false;

        // Snapping/dragging ONLY allowed from Drag Handle & Trip Title areas (top 120px)
        const touchStartRelativeY = evt.nativeEvent.pageY - snappedY.current;
        if (touchStartRelativeY > -30 && touchStartRelativeY < 120) {
          // console.log(`[PanResponder] onMoveShouldSetPanResponderCapture: Capturing because in header/title area. relativeY=${touchStartRelativeY}`);
          return true;
        }

        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
        if (!isVertical) return false;

        const touchStartRelativeY = evt.nativeEvent.pageY - snappedY.current;
        if (touchStartRelativeY > -30 && touchStartRelativeY < 120) {
          return true;
        }

        return false;
      },
      // Prevent children from reclaiming the gesture once we've started dragging.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(`[PanResponder] onPanResponderGrant: snappedY=${snappedY.current}`);
        dragStartY.current = snappedY.current;
        translateY.setOffset(snappedY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = dragStartY.current + gestureState.dy;
        if (nextY >= SNAP_MAX && nextY <= SNAP_MIN) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const nextY = dragStartY.current + gestureState.dy;
        const velocityY = gestureState.vy;
        
        let target = SNAP_MID;
        if (velocityY < -0.5) {
          target = nextY < SNAP_MID ? SNAP_MAX : SNAP_MID;
        } else if (velocityY > 0.5) {
          target = nextY > SNAP_MID ? SNAP_MIN : SNAP_MID;
        } else {
          const distMax = Math.abs(nextY - SNAP_MAX);
          const distMid = Math.abs(nextY - SNAP_MID);
          const distMin = Math.abs(nextY - SNAP_MIN);
          
          const minDist = Math.min(distMax, distMid, distMin);
          if (minDist === distMax) {
            target = SNAP_MAX;
          } else if (minDist === distMin) {
            target = SNAP_MIN;
          } else {
            target = SNAP_MID;
          }
        }
        // console.log(`[PanResponder] onPanResponderRelease: nextY=${nextY}, velocityY=${velocityY}, target=${target}`);
        snapTo(target);
      },
    })
  ).current;

  useEffect(() => {
    if (isMapVisible) {
      setShowDestinationOnlyMap(false);
    }
  }, [isMapVisible]);

  /** Extract the country portion from a destination string like "Tokyo, Japan" */
  const extractCountryName = (destination?: string): string => {
    if (!destination) return '';
    const parts = destination.split(',').map(p => p.trim());
    return parts[parts.length - 1] || destination;
  };


  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showMoreButton, setShowMoreButton] = useState<boolean>(false);
  const countryName = extractCountryName(travelPlan.travel.destination);

  const allActivities = (travelPlan.itinerarySection ?? [])
    .flatMap(s => s.itineraryActivity ?? [])
    .filter(a =>
      a.destinationData?.coordinates &&
      a.destinationData.coordinates.latitude  !== 0 &&
      a.destinationData.coordinates.longitude !== 0
    )
    .map(a => ({
      id: a.id,
      title: a.title || "Activity",
      type: a.type,
      latitude: a.destinationData!.coordinates.latitude,
      longitude: a.destinationData!.coordinates.longitude,
      sortOrder: a.sortOrder,
    }));

  const doneActivities = (travelPlan.itinerarySection ?? [])
    .flatMap(s => s.itineraryActivity ?? [])
    .filter(a =>
      a.isDone &&
      a.destinationData?.coordinates &&
      a.destinationData.coordinates.latitude  !== 0 &&
      a.destinationData.coordinates.longitude !== 0
    )
    .map(a => ({
      lat: a.destinationData!.coordinates.latitude,
      lng: a.destinationData!.coordinates.longitude,
      type: a.type,
    }));

  const getAllMarkers = () => {
    const markers: Array<{ id?: string; latitude: number; longitude: number; title: string; type?: number; sortOrder?: string; images?: Array<{ url: string }> }> = [];
    if (travelPlan.travel.destinationData?.coordinates) {
      markers.push({
        latitude: travelPlan.travel.destinationData.coordinates.latitude,
        longitude: travelPlan.travel.destinationData.coordinates.longitude,
        title: travelPlan.travel.destination || "Trip Destination",
      });
    }

    !showDestinationOnlyMap && travelPlan.itinerarySection?.forEach((section) => {
      section.itineraryActivity?.forEach((activity) => {
        if (activity.destinationData?.coordinates && activity.destinationData.coordinates.latitude !== 0 && activity.destinationData.coordinates.longitude !== 0) {
          markers.push({
            id: activity.id,
            latitude: activity.destinationData.coordinates.latitude,
            longitude: activity.destinationData.coordinates.longitude,
            title: activity.title || "Activity",
            type: activity.type,
            sortOrder: activity.sortOrder,
            images: activity.images,
          });
        }
      });
    });

    return markers;
  };

  const HeaderSection = () => (
    <View>
      <View className="flex-1">
        <View className="flex-1 bg-white">
          {travelPlan.travel.destinationData?.coordinates ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => {
                setShowDestinationOnlyMap(true)
                setMapVisible(true)}}
              className="w-full relative"
            >
              <Image
                source={{
                  uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+263F69(${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude})/${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`,
                }}
                className="w-full h-[200px] "
                style={{ resizeMode: "cover" }}
              />
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.75)", "rgba(0, 0, 0, 0.5)"]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            </TouchableOpacity>
          ) : (
            <View className="relative w-full h-[200px]">
              <Image
                source={require("../../../../assets/images/japan.jpg")}
                className="w-full h-[200px]"
                style={{ resizeMode: "cover" }}
              />
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.70)", "rgba(0, 0, 0, 0.30)"]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            </View>
          )}
        </View>
      </View>

      <View className="flex-2 bg-white border-t border-gray-300 rounded-t-4xl -mt-7">
        <View className="p-6">
          <View className="flex-row justify-between items-start">
            <Text className="text-4xl font-bold  mb-2 flex-1 mr-4">
              {travelPlan?.travel.title}
            </Text>
            <StatusBadge type={1} status={travelPlan.travel.status!} />
          </View>
          <View className="flex-row items-center flex-wrap bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center my-1 pr-3 border-r border-[#DDD]">
              <View className="flex-row items-center">
                <Icon name="calendar-month" size={28} color={"#858585"} />
              <View className="flex-col px-1">
                <Text className="text-xs text-tertiary leading-3">Trip Duration  {travelPlan.travel?.startOrDepartureDate && travelPlan.travel?.endOrReturnDate
                    ? ` (${Math.ceil((new Date(travelPlan.travel.endOrReturnDate).getTime() - new Date(travelPlan.travel.startOrDepartureDate).getTime()) / (1000 * 60 * 60 * 24))} days)`
                    : ""}</Text>
                <Text className="text-lg font-bold text-secondary line-clamp-1 leading-6">
                  {travelPlan.travel?.startOrDepartureDate
                    ? new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString("en-US", { month: "short", day:"2-digit"})
                    : ""}

                    - {travelPlan.travel?.endOrReturnDate
                    ? new Date(travelPlan.travel.endOrReturnDate).toLocaleDateString("en-US", { month: "short", day:"2-digit" })
                    : ""}
                </Text>
                </View>              
              </View>
            </View>
            <View className="flex-row items-center my-1 pl-3">
                <TouchableOpacity 
                  activeOpacity={0.8}
                  className="flex-row items-center my-1 mr-2 "
                  onPress={() => travelPlan.travel.destinationData?.coordinates && setMapVisible(true)}
                >
                  <Icon name="location-pin" size={24} color={"#B42318"} />
               
                {travelPlan.travel.destination ? (
                  <Text className="text-[#183B7A] font-medium mx-1 " numberOfLines={1} ellipsizeMode="tail">
                  {travelPlan.travel.destination}
                </Text>
                ) : (
                  <Text className="text-tertiary italic text-base  mx-1 " numberOfLines={1} ellipsizeMode="tail">
                  Not set
                </Text>
                )}
              </TouchableOpacity>
            </View>
        
          </View>

          <View className="mt-2.5">
            <Text 
              className="text-base text-tertiary leading-6"
              numberOfLines={isDescriptionExpanded ? undefined : 3}
              onTextLayout={(e) => {
                if (!showMoreButton && e.nativeEvent.lines.length >= 3) {
                  setShowMoreButton(true);
                }
              }}
            >
              {travelPlan.travel.description || null}
            </Text>
            {showMoreButton && (
              <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                <Text className="text-secondary font-medium mt-1">
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const tabData = [
    {
      id: "details",
      title: "Details",
      content: (
        <DetailsTab 
          travelPlan={travelPlan} 
        />
      ),
    },
    { 
      id: "itinerary", 
      title: "Itinerary", 
      content: (
        <ItineraryTab 
          travelPlan={travelPlan} 
        />
      ) 
    },
    {
      id: "expenses",
      title: "Expenses",
      content: (
        <ExpensesTab 
          travelPlan={travelPlan} 
          onEditExpense={(expense) => {
            openExpenseModal(
              expense,
              undefined,
              travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
            );
          }}
        />
      ),
    },
    {
      id: "checklist",
      title: "Checklist",
      content: (
        <ChecklistTab
          travelPlan={travelPlan}
          activities={travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []}
        />
      ),
    },
    {
      id: "notes",
      title: "Notes",
      content: (
        <NotesTab
          travelPlan={travelPlan}
          onEditNote={(note) => {
            openNoteModal(
              note,
              travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
            );
          }}
        />
      ),
    },
    {
      id: "members",
      title: "Members",
      content: (
        <MembersTab
          travelPlan={travelPlan}
        />
      ),
    },
  ];

  const handleViewModeActivity = (id: number) => {
    setShowActivityViewModal(true);
  };


  return (
    <Portal.Host>
      {/* Full-screen background interactive map */}
      <View style={StyleSheet.absoluteFillObject} className="absolute inset-0">
        <MapViewer
          inline={true}
          visible={true}
          onClose={onClose}
          markers={getAllMarkers()}
          title={travelPlan.travel.title || "Trip Map"}
          zoom={showDestinationOnlyMap ? 6 : null}
          destination={travelPlan.travel.destination}
          countryName={countryName}
          dateRange={
            travelPlan.travel.startOrDepartureDate
              ? `${new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${
                  travelPlan.travel.endOrReturnDate
                    ? ` → ${new Date(travelPlan.travel.endOrReturnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : ''
                }`
              : undefined
          }
          doneActivities={doneActivities}
        />
      </View>

      {/* Floating Bottom Form Sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            transform: [{ translateY }],
            height: screenHeight - SNAP_MAX,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 24,
          },
        ]}
      >

        
        {/* Drag Handle Area */}
        <Animated.View 
          className="w-full items-center bg-white"
          style={{ 
            borderTopLeftRadius: 32, 
            borderTopRightRadius: 32,
            paddingTop: headerPaddingTop,
            paddingBottom: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel="Drag up or down to expand or collapse trip details sheet"
        >
          <Animated.View 
            className="w-12 h-1.5 bg-gray-300 rounded-full" 
            style={{ opacity: handleOpacity }}
          />
        </Animated.View>


        <Animated.View
            style={{
              position: 'absolute',
              left: 12,
              top: insets.top,
              // bottom: 0,
              justifyContent: 'center',
              opacity: downIconOpacity,
            }}
            pointerEvents={currentSnap === SNAP_MAX ? "auto" : "none"}
          >
            <TouchableOpacity
              className="pr-3.5 p-0.5"
              onPress={() => snapTo(SNAP_MID)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Collapse trip details sheet"
            >
              <View 
                style={{ 
                  width: 32, 
                  height: 32, 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}
              >
                <Icon name="keyboard-arrow-down" size={32} color="#263F69" />
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          

        {/* Trip Title & Summary */}
        <View className="px-6 pb-4 bg-white flex-row justify-between items-start relative">

          <Animated.View
            className="flex-1 mr-4"
            style={{
                // transform: [{ scaleY: expanded ? 0 : 0 }], 

              // height: translateY.interpolate({
              //   inputRange: [SNAP_MAX, SNAP_MID],
              //   outputRange: [100, 40],
              //   extrapolate: "clamp",
              // })
            }}
          >
            <Text className="text-3xl font-bold text-gray-800" numberOfLines={expanded ? undefined : 1}>
              {travelPlan.travel.title}
            </Text>
            <View className="flex-row items-center mt-1 flex-wrap">
              <Icon name="location-pin" size={14} color="#B42318" />
              <Text className="text-xs text-gray-500 font-medium ml-0.5 mr-3" numberOfLines={1}>
                {travelPlan.travel.destination || "Destination not set"}
              </Text>
              <Icon name="calendar-month" size={14} color="#858585" />
              <Text className="text-xs text-gray-500 font-medium ml-0.5">
                {travelPlan.travel.startOrDepartureDate
                  ? new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" })
                  : ""}
                - {travelPlan.travel.endOrReturnDate
                  ? new Date(travelPlan.travel.endOrReturnDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" })
                  : ""}
              </Text>
            </View>
          </Animated.View>
          <StatusBadge type={1} status={travelPlan.travel.status!} />
        </View>

        {/* Tabbed Content */}
        <View className="flex-1 bg-gray-100">
          <Tabs 
            tabs={tabData} 
            initialActiveTabId="details" 
            type="secondary" 
            onTabChange={setActiveTabId} 
            expanded={true}
          />
        </View>
      </Animated.View>
      <TravelActionFAB 
        currentTab={activeTabId}
        open={fabOpen}
        setOpen={setFabOpen}
        travelId={travelId}
        isIncreasePosition={currentSnap === SNAP_MIN}
        onAddNote={() => {
          openNoteModal(
            null,
            travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
          );
        }}
        onAddChecklist={() => {
          openChecklistModal(
            null,
            travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || [],
            travelId
          );
        }}
        onAddExpense={() => {
          openExpenseModal(
            null,
            undefined,
            travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []
          );
        }}
        onAddActivity={() => openActivityModal(null, undefined)}
      />

      <ShareTripModal
        visible={isShareVisible}
        onClose={() => setShareVisible(false)}
        tripTitle={travelPlan.travel.title || 'My Trip'}
        destination={travelPlan.travel.destination || ''}
        countryName={countryName}
        activities={allActivities}
        doneActivities={doneActivities}
        dateRange={
          travelPlan.travel.startOrDepartureDate
            ? `${new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${
                travelPlan.travel.endOrReturnDate
                  ? ` → ${new Date(travelPlan.travel.endOrReturnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : ''
              }`
            : undefined
        }
      />
    </Portal.Host>
  );
};

export default ViewTravel;
