import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
} from "react-native";
import {
  Portal,
  useTheme,
} from "react-native-paper";
import StatusBadge from "../../../../components/StatusBadge";
import Tabs from "../../../../components/Tabs";
import { ItineraryExpense, TravelPlan } from "../../../Travel/types/TravelDto";
import ExpenseModal from "../Forms/Expense/Modal";
import NoteModal from "../Forms/Note/Modal";
import ActivityModal from "../Edit/Itinerary/Activity/Modal";
import MapViewer from "../MapViewer";
import ShareTripModal from "../ShareOverlay/ShareTripModal";
import ChecklistTab from "./Tabs/ChecklistTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import ItineraryTab from "./Tabs/ItineraryTab";
import NotesTab from "./Tabs/NotesTab";
import TravelActionFAB from "./TravelActionFAB";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

import { useEffect } from "react";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose: () => void;
  expanded?: boolean;
  onScrollY?: (y: number) => void;
  showMap?: boolean;
  setShowMap?: React.Dispatch<React.SetStateAction<boolean>>;
  showShare?: boolean;
  setShowShare?: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => Promise<any>;
}

const ViewTravel = ({ 
  travelPlan, 
  onClose, 
  expanded, 
  onScrollY,
  showMap = false,
  setShowMap,
  showShare = false,
  setShowShare,
  onRefresh,
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

  const [showDestinationOnlyMap, setShowDestinationOnlyMap] = useState<boolean>(true);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<ItineraryExpense | null>(null);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);

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

  const [selectedNote, setSelectedNote] = useState<any | null>(null);
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
      content: <DetailsTab travelPlan={travelPlan} />,
    },
    { id: "itinerary", title: "Itinerary", content: <ItineraryTab travelPlan={travelPlan} /> },
       {
      id: "expenses",
      title: "Expenses",
      content: (
        <ExpensesTab 
          travelPlan={travelPlan} 
          onEditExpense={(expense) => {
            setSelectedExpense(expense);
            setShowExpenseModal(true);
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
            setSelectedNote(note);
            setShowNoteModal(true);
          }}
        />
      ),
    },
  ];

  const handleViewModeActivity = (id: number) => {
    setShowActivityViewModal(true);
  };


  return (
    <Portal.Host>
      {expanded ? (
        <View className="flex-1 bg-gray-100 mt-[85px]">
          <View className="flex-1">
            <Tabs tabs={tabData} initialActiveTabId="details" type="secondary" expanded={expanded}/>
          </View>
          {setMapVisible && (
            <MapViewer
              visible={isMapVisible}
              onClose={() => setMapVisible(false)}
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
          )}
        </View>
      ) : (
        <ScrollView 
          className="flex-1 bg-gray-100 " 
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScrollY ? (event) => {
            onScrollY(event.nativeEvent.contentOffset.y);
          } : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <HeaderSection />
          <View>
            <Tabs tabs={tabData} initialActiveTabId="details" type="secondary" />
          </View>
          {setMapVisible && (
            <MapViewer
              visible={isMapVisible}
              onClose={() => setMapVisible(false)}
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
          )}
        </ScrollView>
      )}

      <TravelActionFAB 
        onAddNote={() => {
          setSelectedNote(null);
          setShowNoteModal(true);
        }}
        onAddChecklist={() => console.log('Add Checklist')}
        onAddExpense={() => {
          setSelectedExpense(null);
          setShowExpenseModal(true);
        }}
        onAddActivity={() => setShowActivityModal(true)}
      />

      <ExpenseModal
        visible={showExpenseModal}
        itineraryExpense={selectedExpense}
        activities={travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []}
        onClose={() => setShowExpenseModal(false)}
      />

      <NoteModal
        visible={showNoteModal}
        itineraryNote={selectedNote}
        activities={travelPlan.itinerarySection?.flatMap(s => s.itineraryActivity || []) || []}
        onClose={() => setShowNoteModal(false)}
      />

      <ActivityModal
        visible={showActivityModal}
        itineraryActivity={null}
        itinerarySectionId={undefined}
        onClose={() => setShowActivityModal(false)}
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
