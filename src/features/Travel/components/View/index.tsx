import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  Text,
  Portal,
} from "react-native-paper";
import SectionAccordion from "./SectionAccordion";
import { TravelPlan, ItineraryExpense } from "../../../Travel/types/TravelDto";
import StatusTag from "../../../../components/StatusTag";
import Tabs from "../../../../components/Tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import MapViewer from "../MapViewer";
import ItineraryTab from "./Tabs/ItineraryTab";
import ChecklistTab from "./Tabs/ChecklistTab";
import NotesTab from "./Tabs/NotesTab";
import DetailsTab from "./Tabs/DetailsTab";
import ExpensesTab from "./Tabs/ExpensesTab";
import ExpenseModal from "../Forms/Expense/Modal";
import NoteModal from "../Forms/Note/Modal";
import TravelActionFAB from "./TravelActionFAB";
// @ts-ignore
import { MAPBOX_ACCESS_TOKEN } from "@env";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose: () => void;
}

const ViewTravel = ({ travelPlan, onClose }: ViewTravelProps) => {
  const [showActivityViewModal, setShowActivityViewModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showDestinationOnlyMap, setShowDestinationOnlyMap] = useState<boolean>(true);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<ItineraryExpense | null>(null);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  const getAllMarkers = () => {
    const markers: Array<{ latitude: number; longitude: number; title: string , type?: number}> = [];
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
            latitude: activity.destinationData.coordinates.latitude,
            longitude: activity.destinationData.coordinates.longitude,
            title: activity.title || "Activity",
            type: activity.type,
          });
        }
      });
    });

    return markers;
  };

  const Toolbar = () => (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setShowDestinationOnlyMap(false)
          setShowMapModal(true)}}
        className="bg-black/80 w-8 h-8 rounded-full absolute right-[60px] top-5 z-10 items-center justify-center"
      >
        <Animated.View>
          <Icon name="map" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        className="bg-black/80 w-8 h-8 rounded-full absolute right-5 top-5 z-10 items-center justify-center"
      >
        <Animated.View>
          <Icon name="group" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const HeaderSection = () => (
    <View>
      <View className="flex-1">
        <Toolbar />
        <View className="flex-1 bg-white pt-2.5 px-2.5">
          {travelPlan.travel.destinationData?.coordinates ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => {
                setShowDestinationOnlyMap(true)
                setShowMapModal(true)}}
              className="w-full"
            >
              <Image
                source={{
                  uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0C4C8A(${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude})/${travelPlan.travel.destinationData.coordinates.longitude},${travelPlan.travel.destinationData.coordinates.latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`,
                }}
                className="w-full h-[200px] rounded-xl"
                style={{ resizeMode: "cover" }}
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={require("../../../../assets/images/japan.jpg")}
              className="w-full h-[200px] rounded-xl"
              style={{ resizeMode: "cover" }}
            />
          )}
        </View>
      </View>

      <View className="flex-[2] bg-white">
        <View className="p-4 pb-2">
          <View className="flex-row justify-between items-start">
            <Text className="text-2xl font-bold text-[#183B7A] mb-2 flex-1 mr-4">
              {travelPlan?.travel.title}
            </Text>
            <StatusTag type={2} status={travelPlan.travel.status!} />
          </View>
          <View className="flex-row items-center flex-wrap ">
            <TouchableOpacity 
              activeOpacity={0.8}
              className="flex-row items-center my-1 mr-2 !w-[200px]"
              onPress={() => travelPlan.travel.destinationData?.coordinates && setShowMapModal(true)}
            >
              <Icon name="location-pin" size={16} color={"red"} />
              <Text className="text-[#183B7A] font-medium ml-1 " numberOfLines={1} ellipsizeMode="tail">
                {travelPlan.travel.destination}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center my-1">
              <Text className="text-sm text-[#666] px-2 mx-2 border-l border-[#DDD]">
                {travelPlan.travel?.startOrDepartureDate
                  ? new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
                  : ""}
                {travelPlan.travel?.startOrDepartureDate && travelPlan.travel?.endOrReturnDate
                  ? ` (${Math.ceil((new Date(travelPlan.travel.endOrReturnDate).getTime() - new Date(travelPlan.travel.startOrDepartureDate).getTime()) / (1000 * 60 * 60 * 24))} days)`
                  : ""}
              </Text>
            </View>
          </View>

          <View className="mt-2.5">
            <Text className="text-base text-[#666] leading-6">
              {travelPlan.travel.description || null}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const tabData = [
    { id: "itinerary", title: "Itinerary", content: <ItineraryTab travelPlan={travelPlan} /> },
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
    {
      id: "checklist",
      title: "Checklist",
      content: <ChecklistTab travelPlan={travelPlan} />,
    },
    {
      id: "details",
      title: "Details",
      content: <DetailsTab travelPlan={travelPlan} />,
    },
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
  ];

  const handleViewModeActivity = (id: number) => {
    setShowActivityViewModal(true);
  };


  return (
    <Portal.Host>
      <ScrollView className="flex-1 bg-[#F9F9F9]" showsVerticalScrollIndicator={false}>
        <HeaderSection /> 
        <View>
          <Tabs tabs={tabData} initialActiveTabId="itinerary" />
        </View>

        {setShowMapModal && (
          <MapViewer
            visible={showMapModal}
            onClose={() => setShowMapModal(false)}
            markers={getAllMarkers()}
            title={travelPlan.travel.title || "Trip Map"}
            zoom={showDestinationOnlyMap ? 6 : null}
          />
        )}
      </ScrollView>

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
    </Portal.Host>
  );
};

export default ViewTravel;
